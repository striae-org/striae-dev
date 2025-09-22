import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { getDataApiKey } from '~/utils/auth';
import { ConfirmationImportResult, ConfirmationImportData, R2ObjectMetadata } from '~/types';
import { checkExistingCase } from '../case-manage';
import { validateExporterUid, validateConfirmationChecksum } from './validation';

const DATA_WORKER_URL = paths.data_worker_url;

/**
 * Import confirmation data from JSON file
 */
export async function importConfirmationData(
  user: User,
  confirmationFile: File,
  onProgress?: (stage: string, progress: number, details?: string) => void
): Promise<ConfirmationImportResult> {
  const result: ConfirmationImportResult = {
    success: false,
    caseNumber: '',
    confirmationsImported: 0,
    imagesUpdated: 0,
    errors: [],
    warnings: []
  };

  try {
    onProgress?.('Reading confirmation file', 10, 'Loading JSON data...');

    // Read and parse the JSON file
    const fileContent = await confirmationFile.text();
    const confirmationData: ConfirmationImportData = JSON.parse(fileContent);
    result.caseNumber = confirmationData.metadata.caseNumber;

    onProgress?.('Validating checksum', 20, 'Verifying data integrity...');

    // Validate checksum
    if (!validateConfirmationChecksum(fileContent, confirmationData.metadata.checksum)) {
      throw new Error('Confirmation data checksum validation failed. The file may have been tampered with or corrupted.');
    }

    onProgress?.('Validating exporter', 30, 'Checking exporter credentials...');

    // Validate exporter UID exists and is not current user
    const validation = await validateExporterUid(confirmationData.metadata.exportedByUid, user);
    
    if (!validation.exists) {
      throw new Error(`Reviewer does not exist in the user database.`);
    }
    
    if (validation.isSelf) {
      throw new Error('You cannot import confirmation data that you exported yourself.');
    }

    onProgress?.('Validating case', 40, 'Checking case exists...');

    // Check if case exists in user's regular cases
    const caseExists = await checkExistingCase(user, result.caseNumber);
    if (!caseExists) {
      throw new Error(`Case "${result.caseNumber}" does not exist in your case list. You can only import confirmations for your own cases.`);
    }

    onProgress?.('Processing confirmations', 50, 'Validating timestamps and updating annotations...');

    // Get case data to find image IDs
    const apiKey = await getDataApiKey();
    const caseResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${result.caseNumber}/data.json`, {
      method: 'GET',
      headers: {
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!caseResponse.ok) {
      throw new Error(`Failed to fetch case data: ${caseResponse.status}`);
    }

    const caseData = await caseResponse.json() as any; // Using any for flexibility with originalImageIds
    
    // Build mapping from original image IDs to current image IDs
    const imageIdMapping = new Map<string, string>();
    
    // If the case has originalImageIds mapping (from read-only import), use that
    if (caseData.originalImageIds) {
      for (const [originalId, currentId] of Object.entries(caseData.originalImageIds)) {
        imageIdMapping.set(originalId, currentId as string);
      }
    } else {
      // For regular cases, assume original IDs match current IDs
      for (const file of caseData.files) {
        imageIdMapping.set(file.id, file.id);
      }
    }

    let processedCount = 0;
    const totalConfirmations = Object.keys(confirmationData.confirmations).length;

    // Process each confirmation
    for (const [originalImageId, confirmations] of Object.entries(confirmationData.confirmations)) {
      const currentImageId = imageIdMapping.get(originalImageId);
      
      if (!currentImageId) {
        result.warnings?.push(`Could not find image with original ID: ${originalImageId}`);
        continue;
      }

      // Get current annotation data for this image
      const annotationResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${result.caseNumber}/${currentImageId}/data.json`, {
        method: 'GET',
        headers: {
          'X-Custom-Auth-Key': apiKey
        }
      });

      let annotationData = {};
      if (annotationResponse.ok) {
        annotationData = await annotationResponse.json();
      }

      // Check if confirmation data already exists
      if ((annotationData as any).confirmationData) {
        result.warnings?.push(`Image ${currentImageId} already has confirmation data - skipping`);
        continue;
      }

      // Validate confirmation timestamp against annotation modification time
      const importedConfirmationData = confirmations.length > 0 ? confirmations[0] : null;
      if (importedConfirmationData) {
        const confirmationTimestamp = new Date(importedConfirmationData.confirmedAt);
        
        // Get the actual last modified timestamp from R2 using HEAD request
        const metadataResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${result.caseNumber}/${currentImageId}/data.json`, {
          method: 'HEAD',
          headers: {
            'X-Custom-Auth-Key': apiKey
          }
        });

        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json() as R2ObjectMetadata;
          const r2LastModified = new Date(metadata.lastModified);

          if (confirmationTimestamp < r2LastModified) {
            throw new Error(
              `Confirmation for image ${currentImageId} (${importedConfirmationData.confirmationId}) ` +
              `was created at ${importedConfirmationData.confirmedAt} but the annotations were ` +
              `last modified in R2 at ${metadata.lastModified}. ` +
              `Confirmations must be based on the original annotations and cannot be imported ` +
              `for images that were modified after the confirmation was created.`
            );
          }
        }
        // If HEAD request fails, we'll skip the timestamp validation (backwards compatibility)
      }

      // Set confirmationData from the imported confirmations (use the first/most recent one)
      const updatedAnnotationData = {
        ...annotationData,
        // Ensure includeConfirmation remains true (original analyst requested confirmation)
        includeConfirmation: true,
        // Set the confirmation data from import (single object, no array needed)
        confirmationData: importedConfirmationData
      };

      // Save updated annotation data
      const saveResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${result.caseNumber}/${currentImageId}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify(updatedAnnotationData)
      });

      if (saveResponse.ok) {
        result.imagesUpdated++;
        result.confirmationsImported += confirmations.length;
      } else {
        result.warnings?.push(`Failed to update image ${currentImageId}: ${saveResponse.status}`);
      }

      processedCount++;
      const progress = 50 + (processedCount / totalConfirmations) * 40;
      onProgress?.('Processing confirmations', progress, `Updated ${result.imagesUpdated} images...`);
    }

    onProgress?.('Import complete', 100, `Successfully imported ${result.confirmationsImported} confirmations`);

    result.success = true;
    return result;

  } catch (error) {
    console.error('Confirmation import failed:', error);
    result.success = false;
    result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred during confirmation import');
    return result;
  }
}