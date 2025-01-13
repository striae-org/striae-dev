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

export const checkExistingCase = (user: User, caseNumber: string): Promise<FileData | null> => 
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
      if (data && typeof data === 'object' && 'id' in data && 'originalFilename' in data && 'uploadedAt' in data) {
        return data as FileData;
      }
      return null;
    });

export const createNewCase = (user: User, caseNumber: string): Promise<CaseData> =>
  getApiKey()
    .then(apiKey => {
      // Root case data (without files)
      const newCase: Omit<CaseData, 'files'> = {
        createdAt: new Date().toISOString(),
        caseNumber
      };      

      const rootCaseData: Omit<CaseData, 'files'> = {
        createdAt: newCase.createdAt,
        caseNumber: newCase.caseNumber
      };

      // Initialize case file with just files array if it doesn't exist
      const createCaseFile = fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify({ files: [] })
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
      .then(existingData => {
        const userData = Array.isArray(existingData) ? existingData[0] : existingData;
        const cases = userData.cases || [];
        
        if (!cases.some((c: Omit<CaseData, 'files'>) => c.caseNumber === caseNumber)) {
          cases.push(rootCaseData);
        }

        return fetch(`${WORKER_URL}/${user.uid}/data.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Auth-Key': apiKey
          },
          body: JSON.stringify({ cases })
        });
      });

      return Promise.all([createCaseFile, updateUserData])
        .then(() => ({ ...newCase, files: [] }));
    });