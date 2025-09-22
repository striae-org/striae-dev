import { User } from 'firebase/auth';
import { ImportOptions, ImportResult, ReadOnlyCaseMetadata } from '~/types';
import { checkExistingCase } from '../case-manage';
import { validateCaseIntegrity as validateForensicIntegrity } from '~/utils/CRC32';
import { parseImportZip } from './zip-processing';
import { 
  checkReadOnlyCaseExists, 
  deleteReadOnlyCase, 
  storeCaseDataInR2, 
  addReadOnlyCaseToUser 
} from './storage-operations';
import { uploadImageBlob } from './image-operations';
import { importAnnotations } from './annotation-import';

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
    const { caseData, imageFiles, metadata, cleanedContent } = await parseImportZip(zipFile, user);
    result.caseNumber = caseData.metadata.caseNumber;
    
    // Step 1.5: Validate checksum if forensic metadata exists
    if (metadata?.forensicManifest && cleanedContent) {
      onProgress?.('Validating comprehensive integrity', 15, 'Checking all file checksums...');
      
      // Extract image files for comprehensive validation
      const imageBlobs: { [filename: string]: Blob } = {};
      for (const [filename, blob] of Object.entries(imageFiles)) {
        imageBlobs[filename] = blob;
      }
      
      // Perform comprehensive validation
      const validation = await validateForensicIntegrity(
        cleanedContent, 
        imageBlobs, 
        metadata.forensicManifest
      );
      
      if (!validation.isValid) {
        throw new Error(
          `Comprehensive integrity validation failed: ${validation.summary}. ` +
          `Errors: ${validation.errors.join(', ')}. Import cannot proceed.`
        );
      }
      
      onProgress?.('Complete integrity verified', 18, validation.summary);
      
    } else {
      // No forensic manifest found - cannot import
      throw new Error(
        'No forensic manifest found in case export. This case export does not support comprehensive ' +
        'integrity validation and cannot be imported. Please re-export the case with forensic protection enabled.'
      );
    }
    
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
    const originalImageIdMapping = new Map<string, string>(); // originalImageId -> newImageId
    const importedFiles = [];
    
    let uploadedCount = 0;
    const totalImages = Object.keys(imageFiles).length;
    
    for (const [filename, blob] of Object.entries(imageFiles)) {
      try {
        // Find the original image ID from the case data
        const originalFileEntry = caseData.files.find(f => f.fileData.originalFilename === filename);
        const originalImageId = originalFileEntry?.fileData.id;
        
        const fileData = await uploadImageBlob(blob, filename, (fname, progress) => {
          const overallProgress = 30 + (uploadedCount / totalImages) * 40 + (progress / totalImages) * 0.4;
          onProgress?.('Uploading images', overallProgress, `Uploading ${fname}...`);
        });
        
        fileMapping.set(filename, fileData.id);
        
        // Map original image ID to new image ID
        if (originalImageId) {
          originalImageIdMapping.set(originalImageId, fileData.id);
        }
        
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
    await storeCaseDataInR2(user, result.caseNumber, caseData, importedFiles, originalImageIdMapping);
    
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
      sourceChecksum: metadata?.forensicManifest?.manifestChecksum,
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