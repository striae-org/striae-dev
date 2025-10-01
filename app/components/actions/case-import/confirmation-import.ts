import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { getDataApiKey } from '~/utils/auth';
import { ConfirmationImportResult, ConfirmationImportData } from '~/types';
import { checkExistingCase } from '../case-manage';
import { validateExporterUid, validateConfirmationHash } from './validation';
import { auditService } from '~/services/audit.service';

const DATA_WORKER_URL = paths.data_worker_url;

/**
 * Import confirmation data from JSON file
 */
export async function importConfirmationData(
  user: User,
  confirmationFile: File,
  onProgress?: (stage: string, progress: number, details?: string) => void
): Promise<ConfirmationImportResult> {
  const startTime = Date.now();
  
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
    
    // Start audit workflow
    auditService.startWorkflow(result.caseNumber);

    onProgress?.('Validating hash', 20, 'Verifying data integrity...');

    // Validate hash
    const hashValid = await validateConfirmationHash(fileContent, confirmationData.metadata.hash);
    if (!hashValid) {
      throw new Error('Confirmation data hash validation failed. The file may have been tampered with or corrupted.');
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
    const caseResponse = await fetch(`${DATA_WORKER_URL}/${encodeURIComponent(user.uid)}/${encodeURIComponent(result.caseNumber)}/data.json`, {
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

      // Get the original filename for user-friendly messages
      const currentFile = caseData.files.find((file: any) => file.id === currentImageId);
      const displayFilename = currentFile?.originalFilename || currentImageId;

      // Get current annotation data for this image
      const annotationResponse = await fetch(`${DATA_WORKER_URL}/${encodeURIComponent(user.uid)}/${encodeURIComponent(result.caseNumber)}/${encodeURIComponent(currentImageId)}/data.json`, {
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
        result.warnings?.push(`Image ${displayFilename} already has confirmation data - skipping`);
        continue;
      }

      // Validate that annotations haven't been modified after original export
      const importedConfirmationData = confirmations.length > 0 ? confirmations[0] : null;
      if (importedConfirmationData && confirmationData.metadata.originalExportCreatedAt && (annotationData as any).updatedAt) {
        const originalExportDate = new Date(confirmationData.metadata.originalExportCreatedAt);
        const annotationUpdatedAt = new Date((annotationData as any).updatedAt);
        
        if (annotationUpdatedAt > originalExportDate) {
          // Format timestamps in user's timezone
          const formattedExportDate = originalExportDate.toLocaleString();
          const formattedUpdatedDate = annotationUpdatedAt.toLocaleString();
          
          result.errors?.push(
            `Cannot import confirmation for image "${displayFilename}" (${importedConfirmationData.confirmationId}). ` +
            `The annotations were last modified at ${formattedUpdatedDate} which is after ` +
            `the original case export date of ${formattedExportDate}. ` +
            `Confirmations can only be imported for images that haven't been modified since the original export.`
          );
          continue; // Skip this image and continue with others
        }
      } else if (importedConfirmationData && !confirmationData.metadata.originalExportCreatedAt) {
        // Block legacy confirmation data without forensic linking
        result.errors?.push(
          `Cannot import confirmation for image "${displayFilename}" (${importedConfirmationData.confirmationId}). ` +
          `This confirmation data lacks forensic timestamp linking and cannot be validated. ` +
          `Only confirmation exports with complete forensic metadata are accepted.`
        );
        continue; // Skip this image and continue with others
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
      const saveResponse = await fetch(`${DATA_WORKER_URL}/${encodeURIComponent(user.uid)}/${encodeURIComponent(result.caseNumber)}/${encodeURIComponent(currentImageId)}/data.json`, {
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
        
        // Audit log successful confirmation import
        try {
          await auditService.logAnnotationEdit(
            user,
            `${result.caseNumber}-${currentImageId}`,
            annotationData, // Previous state (without confirmation)
            updatedAnnotationData, // New state (with confirmation)
            result.caseNumber,
            'confirmation-import',
            currentImageId,
            displayFilename
          );
        } catch (auditError) {
          console.error('Failed to log confirmation import audit:', auditError);
        }
      } else {
        result.warnings?.push(`Failed to update image ${displayFilename}: ${saveResponse.status}`);
        
        // Audit log failed confirmation import
        try {
          await auditService.logAnnotationEdit(
            user,
            `${result.caseNumber}-${currentImageId}`,
            annotationData, // Previous state
            null, // Failed save
            result.caseNumber,
            'confirmation-import',
            currentImageId,
            displayFilename
          );
        } catch (auditError) {
          console.error('Failed to log failed confirmation import audit:', auditError);
        }
      }

      processedCount++;
      const progress = 50 + (processedCount / totalConfirmations) * 40;
      onProgress?.('Processing confirmations', progress, `Updated ${result.imagesUpdated} images...`);
    }

    const blockedCount = (result.errors?.length || 0);
    const successMessage = blockedCount > 0 
      ? `Imported ${result.confirmationsImported} confirmations, ${blockedCount} blocked`
      : `Successfully imported ${result.confirmationsImported} confirmations`;
    
    onProgress?.('Import complete', 100, successMessage);

    // If there were errors (blocked confirmations), include that in the result message
    if (result.errors && result.errors.length > 0) {
      result.success = result.confirmationsImported > 0; // Success if at least one confirmation was imported
    } else {
      result.success = true;
    }
    
    // Log confirmation import audit event
    const endTime = Date.now();
    await auditService.logConfirmationImport(
      user,
      result.caseNumber,
      confirmationFile.name,
      result.success ? (result.errors && result.errors.length > 0 ? 'warning' : 'success') : 'failure',
      hashValid,
      result.confirmationsImported,
      result.errors || [],
      confirmationData.metadata.exportedByUid,
      {
        processingTimeMs: endTime - startTime,
        fileSizeBytes: confirmationFile.size,
        validationStepsCompleted: result.confirmationsImported,
        validationStepsFailed: result.errors ? result.errors.length : 0
      },
      true // exporterUidValidated - true for successful imports
    );
    
    auditService.endWorkflow();
    
    return result;

  } catch (error) {
    console.error('Confirmation import failed:', error);
    result.success = false;
    result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred during confirmation import');
    
    // Log failed confirmation import
    const endTime = Date.now();
    
    // Determine what validation failed based on error message - each check is independent
    let hashValidForAudit = true;
    let exporterUidValidatedForAudit = true;
    let reviewingExaminerUidForAudit: string | undefined = undefined;
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('hash validation failed')) {
      // Hash failed - only flag file integrity, don't affect other validations
      hashValidForAudit = false;
      // Don't pass reviewingExaminerUid - we can't trust data from corrupted file
      // exporterUidValidatedForAudit stays true - we didn't test this validation
    } else if (errorMessage.includes('does not exist in the user database')) {
      // Exporter UID validation failed - only flag this check
      exporterUidValidatedForAudit = false;
      // Don't pass reviewingExaminerUid - the UID failed validation
      // Hash validation would have passed to get this far, so hashValidForAudit stays true
    } else if (errorMessage.includes('cannot import confirmation data that you exported yourself')) {
      // Self-confirmation attempt - all validations technically passed except the self-check
      try {
        const confirmationData: any = JSON.parse(await confirmationFile.text());
        reviewingExaminerUidForAudit = confirmationData.metadata?.exportedByUid;
        // This is the only case where we pass the UID because self-confirmation was actually detected
      } catch {
        // If we can't parse the file, keep undefined
      }
    }
    
    await auditService.logConfirmationImport(
      user,
      result.caseNumber || 'unknown',
      confirmationFile.name,
      'failure',
      hashValidForAudit,
      0,
      result.errors || [],
      reviewingExaminerUidForAudit,
      {
        processingTimeMs: endTime - startTime,
        fileSizeBytes: confirmationFile.size
      },
      exporterUidValidatedForAudit
    );
    
    auditService.endWorkflow();
    
    return result;
  }
}