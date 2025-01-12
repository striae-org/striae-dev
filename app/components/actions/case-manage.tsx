import { User } from 'firebase/auth';
import paths from '~/config.json';

interface CaseData {
  createdAt: string;
  caseNumber: string;
  userId: string;
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
    .then(apiKey =>
      fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify({
          createdAt: new Date().toISOString(),
          caseNumber,
          userId: user.uid,
          files: []
        })
      })
    )
    .then(response => {
      if (!response.ok) throw new Error(`Failed to create case: ${response.statusText}`);
      return response.json();
    });