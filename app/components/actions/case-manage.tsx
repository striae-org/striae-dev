import { User } from 'firebase/auth';
import paths from '~/config.json';

interface CloudflareContext {
  cloudflare: {
    env: {
      FWJIO_WFOLIWLF_WFOUIH: string;
    };
  };
}

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
const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;

export const validateCaseNumber = (caseNumber: string) => {
  return caseNumber.match(CASE_NUMBER_REGEX);
};

export const loadCase = async (
  user: User, 
  caseNumber: string, 
  context: CloudflareContext
): Promise<CaseData> => {
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Auth-Key': context.cloudflare.env.FWJIO_WFOLIWLF_WFOUIH
    }
  });

  if (response.ok) {
    return await response.json();
  }
  throw new Error('Case not found');
};

export const createCase = async (
  user: User,
  caseNumber: string,
  context: CloudflareContext
): Promise<CaseData> => {
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Auth-Key': context.cloudflare.env.FWJIO_WFOLIWLF_WFOUIH
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