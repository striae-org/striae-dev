import { User } from 'firebase/auth';
import paths from '~/config/config.json';

const WORKER_URL = paths.data_worker_url;
const IMAGE_URL = paths.image_worker_url;
const KEYS_URL = paths.keys_url;
const DEFAULT_VARIANT = 'public';

interface CaseData {
    files?: FileData[];
    [key: string]: unknown;
  }
interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface ImageDeliveryConfig {
  accountHash: string;
}

const getImageConfig = async (): Promise<ImageDeliveryConfig> => {
  const response = await fetch(`${KEYS_URL}/1568486544161`);
  if (!response.ok) throw new Error('Failed to retrieve account hash');
  const accountHash = await response.text();
  return { accountHash };
};

const getImagesApiToken = async (): Promise<string> => {
  const response = await fetch(`${KEYS_URL}/1156884684684`);
  if (!response.ok) throw new Error('Failed to retrieve images API token');
  return response.text();
};

const getApiKey = async (): Promise<string> => {
  const response = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`);
  if (!response.ok) throw new Error('Failed to retrieve API key');
  return response.text();
};

interface ApiResponse {
  files: FileData[];
}

export const fetchFiles = async (user: User, caseNumber: string): Promise<FileData[]> => {
  const apiKey = await getApiKey();
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
  const data = (await response.json()) as ApiResponse;
  return data.files || [];
};

export const uploadFile = async (user: User, caseNumber: string, file: File): Promise<FileData> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const imagesApiToken = await getImagesApiToken();
  const imageResponse = await fetch(IMAGE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${imagesApiToken}`
    },
    body: formData
  });
  
  interface ImageUploadResponse {
    success: boolean;
    result: {
      id: string;
    };
  }
  
  const imageData = await imageResponse.json() as ImageUploadResponse;
  if (!imageData.success) throw new Error('Upload failed');
  
  const newFile: FileData = {
    id: imageData.result.id,
    originalFilename: file.name,
    uploadedAt: new Date().toISOString()
  };

  const apiKey = await getApiKey();

  // First get the entire existing case data
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
  const existingData = await response.json() as CaseData;

  // Create updated data object that preserves existing fields
  const updatedData = {
    ...existingData,              // Keep all existing case data
    files: [                      // Update files array
      ...(existingData.files || []), // Keep existing files or use empty array
      newFile                        // Add new file
    ]
  };

  // Save the updated data
  await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    method: 'PUT',
    headers: {
      'X-Custom-Auth-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedData)
  });

  return newFile;
};

export const deleteFile = async (user: User, caseNumber: string, fileId: string): Promise<void> => {
  const imagesApiToken = await getImagesApiToken();
  await fetch(`${IMAGE_URL}/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${imagesApiToken}`
    }
  });

  const apiKey = await getApiKey();
  
  // Get full case data
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
  const existingData = await response.json() as CaseData;

  // Create updated data preserving existing fields

  const updatedData: CaseData = {
    ...existingData,
    files: (existingData.files || []).filter((f: FileData) => f.id !== fileId)
  };

  await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    method: 'PUT', 
    headers: {
      'X-Custom-Auth-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedData)
  });
};

export const getImageUrl = async (fileData: FileData): Promise<string> => {
  const { accountHash } = await getImageConfig();
  const imageUrl = `https://imagedelivery.net/${accountHash}/${fileData.id}/${DEFAULT_VARIANT}`;
  
  // Get signed URL from image worker
  const response = await fetch(`${IMAGE_URL}/${encodeURIComponent(imageUrl)}`);
  if (!response.ok) throw new Error('Failed to get signed image URL');
  
  return response.text();
};