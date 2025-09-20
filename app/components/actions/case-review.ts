import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { 
  getDataApiKey,
  getUserApiKey,
  getImageApiKey
} from '~/utils/auth';
import { 
  CaseExportData, 
  UserData, 
  FileData, 
  ImageUploadResponse 
} from '~/types';
import { validateCaseNumber, checkExistingCase } from './case-manage';
import { deleteFile } from './image-manage';
import { saveNotes } from './notes-manage';

const USER_WORKER_URL = paths.user_worker_url;
const DATA_WORKER_URL = paths.data_worker_url;
const IMAGE_WORKER_URL = paths.image_worker_url;

export interface ImportOptions {
  overwriteExisting?: boolean;
  validateIntegrity?: boolean;
  preserveTimestamps?: boolean;
}

export interface ImportResult {
  success: boolean;
  caseNumber: string;
  isReadOnly: boolean;
  filesImported: number;
  annotationsImported: number;
  errors?: string[];
  warnings?: string[];
}

export interface ReadOnlyCaseMetadata {
  caseNumber: string;
  importedAt: string;
  originalExportDate: string;
  originalExportedBy: string;
  sourceChecksum?: string;
  isReadOnly: true;
}

/**
 * Parse and validate ZIP file contents for case import
 */
export async function parseImportZip(zipFile: File): Promise<{
  caseData: CaseExportData;
  imageFiles: { [filename: string]: Blob };
  metadata?: any;
}> {
  // Dynamic import of JSZip to avoid bundle size issues
  const JSZip = (await import('jszip')).default;
  
  try {
    const zip = await JSZip.loadAsync(zipFile);
    
    // Find the main data file (JSON or CSV)
    const dataFiles = Object.keys(zip.files).filter(name => 
      name.endsWith('_data.json') || name.endsWith('_data.csv')
    );
    
    if (dataFiles.length === 0) {
      throw new Error('No valid data file found in ZIP archive');
    }
    
    if (dataFiles.length > 1) {
      throw new Error('Multiple data files found in ZIP archive');
    }
    
    const dataFileName = dataFiles[0];
    const isJsonFormat = dataFileName.endsWith('.json');
    
    // Extract and parse case data
    let caseData: CaseExportData;
    if (isJsonFormat) {
      const dataContent = await zip.file(dataFileName)?.async('text');
      if (!dataContent) {
        throw new Error('Failed to read data file from ZIP');
      }
      
      // Handle forensic protection warnings in JSON
      const cleanedContent = dataContent.replace(/^\/\*[\s\S]*?\*\/\s*/, '');
      caseData = JSON.parse(cleanedContent);
    } else {
      throw new Error('CSV import not yet supported. Please use JSON format.');
    }
    
    // Validate case data structure
    if (!caseData.metadata?.caseNumber) {
      throw new Error('Invalid case data: missing case number');
    }
    
    if (!validateCaseNumber(caseData.metadata.caseNumber)) {
      throw new Error(`Invalid case number format: ${caseData.metadata.caseNumber}`);
    }
    
    // Extract image files
    const imageFiles: { [filename: string]: Blob } = {};
    const imagesFolder = zip.folder('images');
    
    if (imagesFolder) {
      for (const [relativePath, file] of Object.entries(imagesFolder.files)) {
        if (!file.dir && file.name.includes('/')) {
          const filename = file.name.split('/').pop();
          if (filename) {
            const blob = await file.async('blob');
            imageFiles[filename] = blob;
          }
        }
      }
    }
    
    // Extract forensic metadata if present
    let metadata: any = undefined;
    const metadataFile = zip.file('FORENSIC_METADATA.json');
    if (metadataFile) {
      const metadataContent = await metadataFile.async('text');
      metadata = JSON.parse(metadataContent);
    }
    
    return {
      caseData,
      imageFiles,
      metadata
    };
    
  } catch (error) {
    console.error('Error parsing ZIP file:', error);
    throw new Error(`Failed to parse ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user already has a read-only case with the same number
 */
export async function checkReadOnlyCaseExists(
  user: User, 
  caseNumber: string
): Promise<ReadOnlyCaseMetadata | null> {
  try {
    const apiKey = await getUserApiKey();
    
    const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status);
      return null;
    }

    const userData: UserData & { readOnlyCases?: ReadOnlyCaseMetadata[] } = await response.json();
    
    if (!userData.readOnlyCases) {
      return null;
    }

    return userData.readOnlyCases.find(c => c.caseNumber === caseNumber) || null;
    
  } catch (error) {
    console.error('Error checking read-only case existence:', error);
    return null;
  }
}

/**
 * Upload image blob to image worker and get file data
 */
async function uploadImageBlob(
  imageBlob: Blob, 
  originalFilename: string,
  onProgress?: (filename: string, progress: number) => void
): Promise<FileData> {
  const imagesApiToken = await getImageApiKey();
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    // Create a File object from the blob to preserve the filename
    const file = new File([imageBlob], originalFilename, { type: imageBlob.type });
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(originalFilename, progress);
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status === 200) {
        try {
          const imageData = JSON.parse(xhr.responseText) as ImageUploadResponse;
          if (!imageData.success) {
            throw new Error(`Upload failed: ${imageData.errors?.join(', ') || 'Unknown error'}`);
          }

          const fileData: FileData = {
            id: imageData.result.id,
            originalFilename: originalFilename,
            uploadedAt: new Date().toISOString()
          };

          resolve(fileData);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', IMAGE_WORKER_URL);
    xhr.setRequestHeader('Authorization', `Bearer ${imagesApiToken}`);
    xhr.send(formData);
  });
}

/**
 * Create read-only case entry in user database
 */
async function addReadOnlyCaseToUser(
  user: User, 
  caseMetadata: ReadOnlyCaseMetadata
): Promise<void> {
  try {
    const apiKey = await getUserApiKey();
    
    // Get current user data
    const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }

    const userData: UserData & { readOnlyCases?: ReadOnlyCaseMetadata[] } = await response.json();
    
    // Initialize readOnlyCases array if it doesn't exist
    if (!userData.readOnlyCases) {
      userData.readOnlyCases = [];
    }
    
    // Check if case already exists (shouldn't happen if properly checked)
    const existingIndex = userData.readOnlyCases.findIndex(c => c.caseNumber === caseMetadata.caseNumber);
    if (existingIndex !== -1) {
      // Update existing entry
      userData.readOnlyCases[existingIndex] = caseMetadata;
    } else {
      // Add new entry
      userData.readOnlyCases.push(caseMetadata);
    }
    
    // Update user data
    const updateResponse = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      },
      body: JSON.stringify(userData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update user data: ${updateResponse.status}`);
    }
    
  } catch (error) {
    console.error('Error adding read-only case to user:', error);
    throw error;
  }
}

/**
 * Store case data in R2 storage
 */
async function storeCaseDataInR2(
  user: User,
  caseNumber: string,
  caseData: CaseExportData,
  importedFiles: FileData[]
): Promise<void> {
  try {
    const apiKey = await getDataApiKey();
    
    // Create the case data structure that matches normal cases
    const r2CaseData = {
      createdAt: new Date().toISOString(),
      caseNumber: caseNumber,
      files: importedFiles,
      // Add read-only metadata
      isReadOnly: true,
      importedAt: new Date().toISOString(),
      originalMetadata: caseData.metadata,
      originalSummary: caseData.summary
    };
    
    // Store in R2
    const response = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      },
      body: JSON.stringify(r2CaseData)
    });

    if (!response.ok) {
      throw new Error(`Failed to store case data: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error storing case data in R2:', error);
    throw error;
  }
}

/**
 * Import annotations for all files in the case
 */
async function importAnnotations(
  user: User,
  caseNumber: string,
  caseData: CaseExportData,
  fileMapping: Map<string, string> // originalFilename -> newFileId
): Promise<number> {
  let annotationsImported = 0;
  
  try {
    for (const fileEntry of caseData.files) {
      if (fileEntry.annotations && fileEntry.hasAnnotations) {
        const newFileId = fileMapping.get(fileEntry.fileData.originalFilename);
        if (newFileId) {
          // Save annotations using the existing notes management system
          await saveNotes(user, caseNumber, newFileId, fileEntry.annotations);
          annotationsImported++;
        }
      }
    }
  } catch (error) {
    console.error('Error importing annotations:', error);
    throw error;
  }
  
  return annotationsImported;
}

/**
 * Main function to import a case for read-only viewing
 */
export async function importCaseForReview(
  user: User,
  zipFile: File,
  options: ImportOptions = {},
  onProgress?: (stage: string, progress: number, details?: string) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    caseNumber: '',
    isReadOnly: true,
    filesImported: 0,
    annotationsImported: 0,
    errors: [],
    warnings: []
  };
  
  try {
    onProgress?.('Parsing ZIP file', 10, 'Extracting archive contents...');
    
    // Step 1: Parse ZIP file
    const { caseData, imageFiles, metadata } = await parseImportZip(zipFile);
    result.caseNumber = caseData.metadata.caseNumber;
    
    onProgress?.('Validating case data', 20, `Case: ${result.caseNumber}`);
    
    // Step 2a: Check if case already exists in user's regular cases (original analyst)
    const existingRegularCase = await checkExistingCase(user, result.caseNumber);
    if (existingRegularCase) {
      throw new Error(`Case "${result.caseNumber}" already exists in your case list. You cannot import a case for review if you were the original analyst.`);
    }
    
    // Step 2b: Check if read-only case already exists
    const existingCase = await checkReadOnlyCaseExists(user, result.caseNumber);
    if (existingCase && !options.overwriteExisting) {
      throw new Error(`Read-only case "${result.caseNumber}" already exists. Use overwriteExisting option to replace it.`);
    }
    
    if (existingCase) {
      result.warnings?.push('Overwriting existing read-only case');
      
      // Step 2c: Clean up existing read-only case data before importing new data
      onProgress?.('Cleaning up existing case', 25, 'Removing existing case data...');
      const cleanupSuccess = await deleteReadOnlyCase(user, result.caseNumber);
      if (!cleanupSuccess) {
        result.warnings?.push('Some existing case data may not have been fully cleaned up');
      }
    }
    
    onProgress?.('Uploading images', 30, 'Processing image files...');
    
    // Step 3: Upload all image files and create file mapping
    const fileMapping = new Map<string, string>(); // originalFilename -> newFileId
    const importedFiles: FileData[] = [];
    
    let uploadedCount = 0;
    const totalImages = Object.keys(imageFiles).length;
    
    for (const [filename, blob] of Object.entries(imageFiles)) {
      try {
        const fileData = await uploadImageBlob(blob, filename, (fname, progress) => {
          const overallProgress = 30 + (uploadedCount / totalImages) * 40 + (progress / totalImages) * 0.4;
          onProgress?.('Uploading images', overallProgress, `Uploading ${fname}...`);
        });
        
        fileMapping.set(filename, fileData.id);
        importedFiles.push(fileData);
        uploadedCount++;
        
        const overallProgress = 30 + (uploadedCount / totalImages) * 40;
        onProgress?.('Uploading images', overallProgress, `Uploaded ${uploadedCount}/${totalImages} files`);
        
      } catch (error) {
        result.errors?.push(`Failed to upload ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    result.filesImported = importedFiles.length;
    
    if (importedFiles.length === 0) {
      throw new Error('No images were successfully uploaded');
    }
    
    onProgress?.('Storing case data', 75, 'Creating case structure...');
    
    // Step 4: Store case data in R2
    await storeCaseDataInR2(user, result.caseNumber, caseData, importedFiles);
    
    onProgress?.('Importing annotations', 85, 'Processing annotations...');
    
    // Step 5: Import annotations
    result.annotationsImported = await importAnnotations(user, result.caseNumber, caseData, fileMapping);
    
    onProgress?.('Updating user profile', 95, 'Finalizing import...');
    
    // Step 6: Add read-only case to user profile
    const caseMetadata: ReadOnlyCaseMetadata = {
      caseNumber: result.caseNumber,
      importedAt: new Date().toISOString(),
      originalExportDate: caseData.metadata.exportDate,
      originalExportedBy: caseData.metadata.exportedBy || 'Unknown',
      sourceChecksum: metadata?.contentChecksum,
      isReadOnly: true
    };
    
    await addReadOnlyCaseToUser(user, caseMetadata);
    
    onProgress?.('Import complete', 100, 'Case successfully imported for review');
    
    result.success = true;
    
    return result;
    
  } catch (error) {
    console.error('Case import failed:', error);
    result.success = false;
    result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred during import');
    
    // TODO: Cleanup any partially imported data
    // This would involve deleting uploaded images and removing case data
    
    return result;
  }
}

/**
 * List all read-only cases for a user
 */
export async function listReadOnlyCases(user: User): Promise<ReadOnlyCaseMetadata[]> {
  try {
    const apiKey = await getUserApiKey();
    
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

    const userData: UserData & { readOnlyCases?: ReadOnlyCaseMetadata[] } = await response.json();
    
    return userData.readOnlyCases || [];
    
  } catch (error) {
    console.error('Error listing read-only cases:', error);
    return [];
  }
}

/**
 * Remove a read-only case (does not delete the actual case data, just removes from user's read-only list)
 */
export async function removeReadOnlyCase(user: User, caseNumber: string): Promise<boolean> {
  try {
    const apiKey = await getUserApiKey();
    
    // Get current user data
    const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }

    const userData: UserData & { readOnlyCases?: ReadOnlyCaseMetadata[] } = await response.json();
    
    if (!userData.readOnlyCases) {
      return false; // Nothing to remove
    }
    
    // Remove the case from the list
    const initialLength = userData.readOnlyCases.length;
    userData.readOnlyCases = userData.readOnlyCases.filter(c => c.caseNumber !== caseNumber);
    
    if (userData.readOnlyCases.length === initialLength) {
      return false; // Case wasn't found
    }
    
    // Update user data
    const updateResponse = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      },
      body: JSON.stringify(userData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update user data: ${updateResponse.status}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('Error removing read-only case:', error);
    return false;
  }
}

/**
 * Completely delete a read-only case including all associated data (R2, Images, user references)
 */
export async function deleteReadOnlyCase(user: User, caseNumber: string): Promise<boolean> {
  try {
    const dataApiKey = await getDataApiKey();
    
    // First get the case data to find all files that need to be deleted
    const caseResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      headers: { 'X-Custom-Auth-Key': dataApiKey }
    });

    if (caseResponse.ok) {
      const caseData = await caseResponse.json() as { files?: FileData[] };
      
      // Delete all files using image worker
      if (caseData.files && caseData.files.length > 0) {
        await Promise.all(
          caseData.files.map(async (file: FileData) => {
            try {
              await deleteFile(user, caseNumber, file.id);
            } catch (error) {
              console.error(`Failed to delete file ${file.id}:`, error);
              // Continue with cleanup even if one file fails
            }
          })
        );
      }

      // Delete case data from R2 storage
      await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'DELETE',
        headers: { 'X-Custom-Auth-Key': dataApiKey }
      });
    }

    // Remove from user's read-only case list
    await removeReadOnlyCase(user, caseNumber);
    
    return true;
    
  } catch (error) {
    console.error('Error deleting read-only case:', error);
    return false;
  }
}

/**
 * Validate imported case data integrity (optional verification)
 */
export function validateCaseIntegrity(
  caseData: CaseExportData,
  imageFiles: { [filename: string]: Blob }
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check if all referenced images exist
  for (const fileEntry of caseData.files) {
    const filename = fileEntry.fileData.originalFilename;
    if (!imageFiles[filename]) {
      issues.push(`Missing image file: ${filename}`);
    }
  }
  
  // Check if there are extra images not referenced in case data
  const referencedFiles = new Set(caseData.files.map(f => f.fileData.originalFilename));
  for (const filename of Object.keys(imageFiles)) {
    if (!referencedFiles.has(filename)) {
      issues.push(`Unreferenced image file: ${filename}`);
    }
  }
  
  // Validate metadata completeness
  if (!caseData.metadata.caseNumber) {
    issues.push('Missing case number in metadata');
  }
  
  if (!caseData.metadata.exportDate) {
    issues.push('Missing export date in metadata');
  }
  
  // Validate annotation data
  for (const fileEntry of caseData.files) {
    if (fileEntry.hasAnnotations && !fileEntry.annotations) {
      issues.push(`File ${fileEntry.fileData.originalFilename} marked as having annotations but no annotation data found`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
