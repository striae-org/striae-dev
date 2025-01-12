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
    const keyResponse = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`);
    if (!keyResponse.ok) {
      throw new Error('Failed to retrieve API key');
    }
    const apiKey = await keyResponse.text();

export const validateCaseNumber = (caseNumber: string): boolean => {
  return CASE_NUMBER_REGEX.test(caseNumber);
};

export const checkExistingCase = async (
  user: User,
  caseNumber: string,  
): Promise<CaseData | null> => {
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Auth-Key': apiKey
    }
  });

  if (response.ok) {
    const data = await response.json();
    const cases = Array.isArray(data) ? data : [data];
    return cases.find(c => c.caseNumber === caseNumber) || null;
  }
  return null;
};

export const createNewCase = async (
  user: User,
  caseNumber: string,  
): Promise<CaseData> => {
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
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
  });

  if (!response.ok) {
    throw new Error(`Failed to create case: ${response.statusText}`);
  }

  return await response.json();
};