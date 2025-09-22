import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { getUserApiKey } from '~/utils/auth';
import { CaseExportData } from '~/types';
import { calculateCRC32 } from '~/utils/CRC32';

const USER_WORKER_URL = paths.user_worker_url;

/**
 * Validate that a user exists in the database by UID and is not the current user
 */
export async function validateExporterUid(exporterUid: string, currentUser: User): Promise<{ exists: boolean; isSelf: boolean }> {
  try {
    const apiKey = await getUserApiKey();
    const response = await fetch(`${USER_WORKER_URL}/${exporterUid}`, {
      method: 'GET',
      headers: {
        'X-Custom-Auth-Key': apiKey
      }
    });
    
    const exists = response.status === 200;
    const isSelf = exporterUid === currentUser.uid;
    
    return { exists, isSelf };
  } catch (error) {
    console.error('Error validating exporter UID:', error);
    return { exists: false, isSelf: false };
  }
}

/**
 * Check if file is a confirmation data import
 */
export function isConfirmationDataFile(filename: string): boolean {
  return filename.startsWith('confirmation-data') && filename.endsWith('.json');
}

/**
 * Validate confirmation data file checksum
 */
export function validateConfirmationChecksum(jsonContent: string, expectedChecksum: string): boolean {
  // Create data without checksum for validation
  const data = JSON.parse(jsonContent);
  const dataWithoutChecksum = {
    ...data,
    metadata: {
      ...data.metadata,
      checksum: undefined
    }
  };
  delete dataWithoutChecksum.metadata.checksum;
  
  const contentForChecksum = JSON.stringify(dataWithoutChecksum, null, 2);
  const actualChecksum = calculateCRC32(contentForChecksum);
  
  return actualChecksum.toUpperCase() === expectedChecksum.toUpperCase();
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