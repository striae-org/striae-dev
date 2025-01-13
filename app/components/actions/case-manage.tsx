import { User } from 'firebase/auth';
import paths from '~/config/config.json';

interface CaseData {
  createdAt: string;
  caseNumber: string;
  files?: FileData[];  // Optional since we don't store in root data.json
}

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

const WORKER_URL = paths.data_worker_url;
const KEYS_URL = paths.keys_url;
const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;
const MAX_CASE_NUMBER_LENGTH = 25;

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
      const userData = Array.isArray(data) ? data[0] : data;
      const cases = (userData as { cases?: CaseData[] })?.cases?.map(c => c.caseNumber) || [];
      return sortCaseNumbers(cases);
    })
    .catch(error => {
      console.error('Error listing cases:', error);
      return [];
    });

    /**
     * Sorts case numbers in ascending order, first by numbers and then by letters.
     */

    const sortCaseNumbers = (cases: string[]): string[] => {
  return cases.sort((a, b) => {
    // Extract all numbers and letters
    const getComponents = (str: string) => {
      const numbers = str.match(/\d+/g)?.map(Number) || [];
      const letters = str.match(/[A-Za-z]+/g)?.join('') || '';
      return { numbers, letters };
    };

    const aComponents = getComponents(a);
    const bComponents = getComponents(b);

    // Compare numbers first
    const maxLength = Math.max(aComponents.numbers.length, bComponents.numbers.length);
    for (let i = 0; i < maxLength; i++) {
      const aNum = aComponents.numbers[i] || 0;
      const bNum = bComponents.numbers[i] || 0;
      if (aNum !== bNum) return aNum - bNum;
    }

    // If all numbers match, compare letters
    return aComponents.letters.localeCompare(bComponents.letters);
  });
};

export const validateCaseNumber = (caseNumber: string): boolean => {
  return CASE_NUMBER_REGEX.test(caseNumber) && 
         caseNumber.length <= MAX_CASE_NUMBER_LENGTH;
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
    .then(apiKey => {
      const newCase: CaseData = {
        createdAt: new Date().toISOString(),
        caseNumber,
        files: []  // Initialize empty files array only in case file
      };

      const caseOnlyData: CaseData = {
        createdAt: newCase.createdAt,
        caseNumber: newCase.caseNumber,
        files: []
      };

      const rootCaseData: Omit<CaseData, 'files'> = {
        createdAt: newCase.createdAt,
        caseNumber: newCase.caseNumber
      };

      // Create individual case file with files array
      const createCaseFile = fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify(caseOnlyData)
      });

      // Update root data.json without files array
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
          ...baseUserData,      // Copy all existing properties
          cases: baseUserData.cases || [],    // Initialize cases array if not present
        };
        
        // Add new case if not already present
        if (!newData.cases.some((c: CaseData) => c.caseNumber === rootCaseData.caseNumber)) {
          newData.cases.push(rootCaseData);
        }
        
        // Always replace with single user object
        return fetch(`${WORKER_URL}/${user.uid}/data.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Auth-Key': apiKey
          },
          body: JSON.stringify(newData)   // Update with new case
        });
      });
      // Wait for both operations
      return Promise.all([createCaseFile, updateUserData])
        .then(() => newCase);
    });