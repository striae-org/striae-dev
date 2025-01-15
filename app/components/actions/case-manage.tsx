import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { deleteFile } from './image-manage';
import { 
  getDataApiKey,
  getUserApiKey
} from '~/utils/auth';

interface CaseData {
  createdAt: string;
  caseNumber: string;
  files?: FileData[];  // Optional since we don't store in root data.json
}

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  permitted: boolean;
  cases?: CaseData[];
  createdAt: string;
}

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

const USER_WORKER_URL = paths.user_worker_url;
const DATA_WORKER_URL = paths.data_worker_url;
const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;
const MAX_CASE_NUMBER_LENGTH = 25;

/* Get API key from keys worker
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
*/

export const listCases = async (user: User): Promise<string[]> => {
  try {
    const apiKey = await getUserApiKey();
    
    // Get user data from KV store
    const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status);
      return [];
    }

    const userData: UserData = await response.json();
    
    if (!userData?.cases) {
      return [];
    }

    const caseNumbers = userData.cases.map(c => c.caseNumber);
    return sortCaseNumbers(caseNumbers);
    
  } catch (error) {
    console.error('Error listing cases:', error);
    return [];
  }
};

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

export const checkExistingCase = async (user: User, caseNumber: string): Promise<CaseData | null> => {
  try {
    const apiKey = await getDataApiKey();
    const response = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const cases = Array.isArray(data) ? data : [data];
    return cases.find(c => c.caseNumber === caseNumber) || null;

  } catch (error) {
    console.error('Error checking existing case:', error);
    return null;
  }
};

export const createNewCase = async (user: User, caseNumber: string): Promise<CaseData> => {
  try {
    // Get both API keys
    const dataApiKey = await getDataApiKey();
    const userApiKey = await getUserApiKey();

    // Create case data objects
    const newCase: CaseData = {
      createdAt: new Date().toISOString(),
      caseNumber,
      files: []
    };

    const rootCaseData: Omit<CaseData, 'files'> = {
      createdAt: newCase.createdAt,
      caseNumber: newCase.caseNumber
    };

    // Create case file in data worker
    const createCaseFile = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': dataApiKey
      },
      body: JSON.stringify(newCase)
    });

    if (!createCaseFile.ok) {
      throw new Error('Failed to create case file');
    }

    // Get current user data from KV
    const getUserData = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': userApiKey
      }
    });

    const userData = await getUserData.json() as UserData;
    
    // Update user data in KV store
    const updateUserData = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': userApiKey
      },
      body: JSON.stringify({
        ...userData,
        cases: [...(userData.cases || []), rootCaseData]
      })
    });

    if (!updateUserData.ok) {
      throw new Error('Failed to update user data');
    }

    return newCase;
  } catch (error) {
    console.error('Error creating new case:', error);
    throw error;
  }
};
////////////////////////////////////////TODO      

    export const renameCase = async (
  user: User, 
  oldCaseNumber: string, 
  newCaseNumber: string
): Promise<void> => {
  // Validate both case numbers
  if (!validateCaseNumber(oldCaseNumber) || !validateCaseNumber(newCaseNumber)) {
    throw new Error('Invalid case number format');
  }

  const apiKey = await getApiKey();

  // Check if new case number already exists
  const existingCase = await checkExistingCase(user, newCaseNumber);
  if (existingCase) {
    throw new Error('New case number already exists');
  }

  // Get existing case data
  const oldCaseResponse = await fetch(`${WORKER_URL}/${user.uid}/${oldCaseNumber}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });

  if (!oldCaseResponse.ok) {
    throw new Error('Original case not found');
  }

  const oldCaseData = await oldCaseResponse.json() as CaseData;

  // Create new case with existing data but new case number
  const newCaseData: CaseData = {
    ...oldCaseData,
    caseNumber: newCaseNumber
  };

  // Save new case data
  await fetch(`${WORKER_URL}/${user.uid}/${newCaseNumber}/data.json`, {
    method: 'PUT',
    headers: {
      'X-Custom-Auth-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newCaseData)
  });

  // Update root data.json
  const rootResponse = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
  
  const rootData = await rootResponse.json();
  const userData = Array.isArray(rootData) ? rootData[0] : rootData;

  // Replace old case with new case in cases array
  const updatedData = {
    ...userData,
    cases: (userData.cases || []).map((c: CaseData) => 
      c.caseNumber === oldCaseNumber 
        ? { ...c, caseNumber: newCaseNumber }
        : c
    )
  };

  // Save updated root data
  await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
    method: 'PUT',
    headers: {
      'X-Custom-Auth-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedData)
  });

  // Delete old case data file
  await fetch(`${WORKER_URL}/${user.uid}/${oldCaseNumber}/data.json`, {
    method: 'DELETE',
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
};

    export const deleteCase = async (user: User, caseNumber: string): Promise<void> => {
  if (!validateCaseNumber(caseNumber)) {
    throw new Error('Invalid case number');
  }

  const apiKey = await getApiKey();

  // First get the case data to find all files
  const caseResponse = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });

  if (!caseResponse.ok) {
    throw new Error('Case not found');
  }

  const caseData = await caseResponse.json() as CaseData;

  // Delete all files first
  if (caseData.files && caseData.files.length > 0) {
    await Promise.all(
      caseData.files.map(file => 
        deleteFile(user, caseNumber, file.id)
      )
    );
  }

  // Delete the case data file
  await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    method: 'DELETE',
    headers: { 'X-Custom-Auth-Key': apiKey }
  });

  // Update root data.json to remove case from list
  const rootResponse = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
  
  const rootData = await rootResponse.json();
  const userData = Array.isArray(rootData) ? rootData[0] : rootData;

  // Remove case from cases array
  const updatedData = {
    ...userData,
    cases: (userData.cases || []).filter((c: CaseData) => c.caseNumber !== caseNumber)
  };

  // Save updated root data
  await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
    method: 'PUT',
    headers: {
      'X-Custom-Auth-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedData)
  });
};