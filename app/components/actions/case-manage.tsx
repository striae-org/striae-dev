import { User } from 'firebase/auth';
import paths from '~/config.json';

interface CaseData {
  createdAt: string;
  caseNumber: string;  
  files: FileData[];
}

interface FileData {
  name: string;
  size: number;
  lastModified: string;
  type: string;
}

const WORKER_URL = paths.data_worker_url;
const KEYS_URL = paths.keys_url;
const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;

// Get API key from keys worker
    export const getApiKey = () => {
  return fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to retrieve API key');
      }
      return response.text();
    })
    .catch(error => {
      console.error('Error fetching API key:', error);
      throw error;
    });
};

export const listCases = (user: User): Promise<string[]> =>
  getApiKey()
    .then(apiKey =>
      fetch(`${WORKER_URL}/${user.uid}/data.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        }
      })
    )
    .then(response => {
      if (!response.ok) return [];
      return response.json();
    })
    .then(data => {
      // Handle array or single object response
      const userData = Array.isArray(data) ? data[0] : data;
      
      // Return case numbers if cases exist, empty array if not
      return (userData as { cases?: CaseData[] })?.cases?.map(c => c.caseNumber) || [];
    })
    .catch(error => {
      console.error('Error listing cases:', error);
      return [];
    });

export const validateCaseNumber = (caseNumber: string): boolean => {
  return CASE_NUMBER_REGEX.test(caseNumber);
};

export const checkExistingCase = (user: User, caseNumber: string): Promise<CaseData | null> => 
  getApiKey()
    .then(apiKey => 
      fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        }
      })
    )
    .then(response => {
      if (!response.ok) return null;
      return response.json();
    })
    .then(data => {
      const cases = Array.isArray(data) ? data : [data];
      return cases.find(c => c.caseNumber === caseNumber) || null;
    });

export const createNewCase = (user: User, caseNumber: string): Promise<CaseData> =>
  getApiKey()
    .then(apiKey =>{
      const newCase: CaseData = {
        createdAt: new Date().toISOString(),
        caseNumber,        
        files: []
      };

      // First create individual case file
      const createCaseFile = fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify(newCase)
      });

      // Then update user's data.json with cases array
      const updateUserData = fetch(`${WORKER_URL}/${user.uid}/data.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        }
      })
      .then(response => response.ok ? response.json() : { cases: [] })
      .then((existingData) => {
        // Always work with first user object only
        const baseUserData = Array.isArray(existingData) ? existingData[0] : existingData;
        

        // Store all existing user properties
        const newData = {
          ...baseUserData,                    // Keep all existing properties
          cases: baseUserData.cases || [],    // Initialize or keep existing cases array               
        };
        
        // Add new case if not already present
        if (!newData.cases.some((c: CaseData) => c.caseNumber === newCase.caseNumber)) {
          newData.cases.push(newCase);
        }
        
        // Always replace with single user object
        return fetch(`${WORKER_URL}/${user.uid}/data.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Auth-Key': apiKey
          },
          body: JSON.stringify(newData)  // Single object with consolidated cases
        });
      });
      // Wait for both operations
      return Promise.all([createCaseFile, updateUserData])
        .then(() => newCase);
    });