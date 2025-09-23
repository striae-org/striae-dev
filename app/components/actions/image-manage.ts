import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { 
  getImageApiKey,
  getDataApiKey,
  getAccountHash 
} from '~/utils/auth';
import { canUploadFile } from '~/utils/permissions';
import { CaseData, FileData, ImageUploadResponse } from '~/types';
import { auditService } from '~/services/audit.service';

const WORKER_URL = paths.data_worker_url;
const IMAGE_URL = paths.image_worker_url;

interface FileApiResponse {
  files: FileData[];
}

export const fetchFiles = async (user: User, caseNumber: string): Promise<FileData[]> => {
  const apiKey = await getDataApiKey();
  const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
    headers: { 'X-Custom-Auth-Key': apiKey }
  });
  const data = (await response.json()) as FileApiResponse;
  return data.files || [];
};

export const uploadFile = async (
  user: User, 
  caseNumber: string, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<FileData> => {
  const startTime = Date.now();
  
  // First, get current files to check count
  const currentFiles = await fetchFiles(user, caseNumber);
  
  // Check if user can upload another file
  const permission = await canUploadFile(user, currentFiles.length);
  if (!permission.canUpload) {
    // Log permission denied
    try {
      await auditService.logFileUpload(
        user,
        file.name,
        file.size,
        file.type,
        caseNumber,
        'failure',
        ['File upload permission denied'],
        undefined,
        'file-picker'
      );
    } catch (auditError) {
      console.error('Failed to log file upload permission denial:', auditError);
    }
    throw new Error(permission.reason || 'You cannot upload more files to this case.');
  }

  const imagesApiToken = await getImageApiKey();
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', async () => {
      const endTime = Date.now();
      
      if (xhr.status === 200) {
        try {
          const imageData = JSON.parse(xhr.responseText) as ImageUploadResponse;
          if (!imageData.success) throw new Error('Upload failed');

          const newFile: FileData = {
            id: imageData.result.id,
            originalFilename: file.name,
            uploadedAt: new Date().toISOString()
          };

          // Update case data
          const apiKey = await getDataApiKey();
          const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
            headers: { 'X-Custom-Auth-Key': apiKey }
          });
          const existingData = await response.json() as CaseData;

          const updatedData = {
            ...existingData,
            files: [...(existingData.files || []), newFile]
          };

          await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
            method: 'PUT',
            headers: {
              'X-Custom-Auth-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
          });

          // Log successful file upload
          try {
            await auditService.logFileUpload(
              user,
              file.name,
              file.size,
              file.type,
              caseNumber,
              'success',
              [],
              imageData.result.id,
              'file-picker'
            );
          } catch (auditError) {
            console.error('Failed to log successful file upload:', auditError);
          }

          console.log(`✅ File uploaded: ${file.name} (${file.size} bytes) (${endTime - startTime}ms)`);
          resolve(newFile);
        } catch (error) {
          // Log failed file upload
          try {
            await auditService.logFileUpload(
              user,
              file.name,
              file.size,
              file.type,
              caseNumber,
              'failure',
              [error instanceof Error ? error.message : 'Upload failed'],
              undefined,
              'file-picker'
            );
          } catch (auditError) {
            console.error('Failed to log file upload failure:', auditError);
          }
          reject(error);
        }
      } else {
        // Log failed file upload
        try {
          await auditService.logFileUpload(
            user,
            file.name,
            file.size,
            file.type,
            caseNumber,
            'failure',
            ['Upload failed'],
            undefined,
            'file-picker'
          );
        } catch (auditError) {
          console.error('Failed to log file upload failure:', auditError);
        }
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', async () => {
      // Log upload error
      try {
        await auditService.logFileUpload(
          user,
          file.name,
          file.size,
          file.type,
          caseNumber,
          'failure',
          ['Upload failed'],
          undefined,
          'file-picker'
        );
      } catch (auditError) {
        console.error('Failed to log file upload error:', auditError);
      }
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', IMAGE_URL);
    xhr.setRequestHeader('Authorization', `Bearer ${imagesApiToken}`);
    xhr.send(formData);
  });
};

export const deleteFile = async (user: User, caseNumber: string, fileId: string): Promise<void> => {
  const startTime = Date.now();
  
  // Get file info for audit logging (outside try block so it's available in catch)
  let fileName = fileId; // Default to fileId
  let fileToDelete: FileData | undefined;
  
  try {
    const apiKey = await getDataApiKey();
    
    // First, get the file info for audit logging
    const caseResponse = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      headers: { 'X-Custom-Auth-Key': apiKey }
    });
    const caseData = await caseResponse.json() as CaseData;
    fileToDelete = (caseData.files || []).find((f: FileData) => f.id === fileId);
    fileName = fileToDelete?.originalFilename || fileId;
    const fileSize = 0; // We don't store file size, so use 0

    let imageDeleteFailed = false;
    let imageDeleteError = '';

    // Attempt to delete image file
    const imagesApiToken = await getImageApiKey();
    const imageResponse = await fetch(`${IMAGE_URL}/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${imagesApiToken}`
      }
    });

    // Handle image deletion response
    if (!imageResponse.ok) {
      if (imageResponse.status === 404) {
        // Image already doesn't exist - proceed with data cleanup
        console.warn(`Image ${fileId} not found (404) - proceeding with data cleanup`);
      } else {
        // Other errors should still fail the operation
        imageDeleteFailed = true;
        imageDeleteError = `Failed to delete image: ${imageResponse.statusText}`;
      }
    }

    // If image deletion failed with non-404 error, don't proceed with data cleanup
    if (imageDeleteFailed) {
      throw new Error(imageDeleteError);
    }

    // Clean up data files regardless of image deletion success/404
    // Try to delete notes file - ignore 404
    const notesResponse = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/${fileId}/data.json`, {
      method: 'DELETE',
      headers: {
        'X-Custom-Auth-Key': apiKey
      }
    });

    // Only throw if error is not 404 (notes file not found)
    if (!notesResponse.ok && notesResponse.status !== 404) {
      throw new Error(`Failed to delete notes: ${notesResponse.statusText}`);
    }

    // Update case data.json to remove file reference
    const updatedData: CaseData = {
      ...caseData,
      files: (caseData.files || []).filter((f: FileData) => f.id !== fileId)
    };

    await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'PUT',
      headers: {
        'X-Custom-Auth-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    // Log successful file deletion
    const endTime = Date.now();
    try {
      await auditService.logFileDeletion(
        user,
        fileName,
        caseNumber,
        'success',
        'User-requested deletion via file list',
        fileId
      );
    } catch (auditError) {
      console.error('Failed to log file deletion:', auditError);
    }

    console.log(`✅ File deleted: ${fileName} (${endTime - startTime}ms)`);
    
  } catch (error) {
    // Log failed file deletion
    const endTime = Date.now();
    try {
      await auditService.logEvent({
        userId: user.uid,
        userEmail: user.email || '',
        action: 'file-delete',
        result: 'failure',
        fileName: fileName, // Now uses the original filename
        fileType: 'unknown',
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        caseNumber,
        fileDetails: {
          fileId: fileId,
          fileSize: 0,
          deleteReason: 'Failed deletion attempt',
          originalFileName: fileToDelete?.originalFilename
        },
        performanceMetrics: {
          processingTimeMs: endTime - startTime,
          fileSizeBytes: 0
        }
      });
    } catch (auditError) {
      console.error('Failed to log file deletion failure:', auditError);
    }
    
    console.error('Error in deleteFile:', error);
    throw error;
  }
};

const DEFAULT_VARIANT = 'striae';
interface ImageDeliveryConfig {
  accountHash: string;
}

const getImageConfig = async (): Promise<ImageDeliveryConfig> => {
  const accountHash = await getAccountHash();
  return { accountHash };
};


export const getImageUrl = async (user: User, fileData: FileData, caseNumber: string): Promise<string> => {
  const startTime = Date.now();
  
  try {
    const { accountHash } = await getImageConfig();  
    const imagesApiToken = await getImageApiKey();
    const imageDeliveryUrl = `https://imagedelivery.net/${accountHash}/${fileData.id}/${DEFAULT_VARIANT}`;
    
    const workerResponse = await fetch(`${IMAGE_URL}/${imageDeliveryUrl}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${imagesApiToken}`,
        'Accept': 'text/plain'
      }
    });
    
    if (!workerResponse.ok) {
      // Log failed image access
      await auditService.logFileAccess(
        user,
        fileData.originalFilename || fileData.id,
        caseNumber,
        'failure',
        fileData.id,
        'signed-url'
      );
      throw new Error('Failed to get signed image URL');
    }
    
    const signedUrl = await workerResponse.text();
    if (!signedUrl.includes('sig=') || !signedUrl.includes('exp=')) {
      // Log invalid URL response
      await auditService.logFileAccess(
        user,
        fileData.originalFilename || fileData.id,
        caseNumber,
        'failure',
        fileData.id,
        'signed-url'
      );
      throw new Error('Invalid signed URL returned');
    }
    
    // Log successful image access
    await auditService.logFileAccess(
      user,
      fileData.originalFilename || fileData.id,
      caseNumber,
      'success',
      fileData.id,
      'signed-url'
    );
    
    return signedUrl;
  } catch (error) {
    // Log any unexpected errors if not already logged
    if (!(error instanceof Error && error.message.includes('Failed to get signed image URL'))) {
      await auditService.logFileAccess(
        user,
        fileData.originalFilename || fileData.id,
        caseNumber,
        'failure',
        fileData.id,
        'signed-url'
      );
    }
    throw error;
  }
};