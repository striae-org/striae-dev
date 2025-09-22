import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { getDataApiKey } from '~/utils/auth';
import { calculateCRC32 } from '~/utils/CRC32';
import { getUserData } from '~/utils/permissions';
import { ConfirmationData, CaseConfirmations, CaseDataWithConfirmations } from '~/types';

const DATA_WORKER_URL = paths.data_worker_url;

/**
 * Store a confirmation for a specific image, linked to the original image ID
 */
export async function storeConfirmation(
  user: User,
  caseNumber: string,
  currentImageId: string,
  confirmationData: ConfirmationData
): Promise<boolean> {
  try {
    const apiKey = await getDataApiKey();
    
    // First, get the current case data
    const caseResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'GET',
      headers: {
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!caseResponse.ok) {
      throw new Error(`Failed to fetch case data: ${caseResponse.status}`);
    }

    const caseData: CaseDataWithConfirmations = await caseResponse.json();

    // Find the original image ID for the current image
    let originalImageId: string | undefined;
    
    if (caseData.originalImageIds) {
      // Find the original ID by looking up the current image ID in the mapping
      for (const [origId, currentId] of Object.entries(caseData.originalImageIds)) {
        if (currentId === currentImageId) {
          originalImageId = origId;
          break;
        }
      }
    }

    if (!originalImageId) {
      throw new Error('Could not find original image ID for current image');
    }

    // Initialize confirmations object if it doesn't exist
    if (!caseData.confirmations) {
      caseData.confirmations = {};
    }

    // Initialize array for this original image if it doesn't exist
    if (!caseData.confirmations[originalImageId]) {
      caseData.confirmations[originalImageId] = [];
    }

    // Add the confirmation data directly (already complete from modal)
    caseData.confirmations[originalImageId].push(confirmationData);

    // Store the updated case data
    const updateResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      },
      body: JSON.stringify(caseData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update case data: ${updateResponse.status}`);
    }

    console.log(`Confirmation stored for original image ${originalImageId}:`, confirmationData);
    return true;

  } catch (error) {
    console.error('Failed to store confirmation:', error);
    return false;
  }
}

/**
 * Get all confirmations for a case (useful for the original analyst)
 */
export async function getCaseConfirmations(
  user: User,
  caseNumber: string
): Promise<CaseConfirmations | null> {
  try {
    const apiKey = await getDataApiKey();
    
    const response = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'GET',
      headers: {
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch case data: ${response.status}`);
      return null;
    }

    const caseData: CaseDataWithConfirmations = await response.json();
    return caseData.confirmations || null;

  } catch (error) {
    console.error('Failed to get case confirmations:', error);
    return null;
  }
}

/**
 * Get confirmations for a specific original image ID
 */
export async function getImageConfirmations(
  user: User,
  caseNumber: string,
  originalImageId: string
): Promise<ConfirmationData[]> {
  try {
    const confirmations = await getCaseConfirmations(user, caseNumber);
    return confirmations?.[originalImageId] || [];
  } catch (error) {
    console.error('Failed to get image confirmations:', error);
    return [];
  }
}

/**
 * Exports confirmation data as a JSON file with CRC32 checksum for forensic integrity
 */
export async function exportConfirmationData(
  user: User, 
  caseNumber: string
): Promise<void> {
  try {
    // Get all confirmation data for the case
    const caseConfirmations = await getCaseConfirmations(user, caseNumber);
    
    if (!caseConfirmations || Object.keys(caseConfirmations).length === 0) {
      throw new Error('No confirmation data found for this case');
    }

    // Get user metadata for export (same as case exports)
    let userMetadata = {
      exportedBy: user.email || 'Unknown User',
      exportedByUid: user.uid,
      exportedByName: user.displayName || 'N/A',
      exportedByCompany: 'N/A'
    };

    try {
      const userData = await getUserData(user);
      if (userData) {
        userMetadata = {
          exportedBy: user.email || 'Unknown User',
          exportedByUid: userData.uid,
          exportedByName: `${userData.firstName} ${userData.lastName}`.trim(),
          exportedByCompany: userData.company
        };
      }
    } catch (error) {
      console.warn('Failed to fetch user data for confirmation export metadata:', error);
    }

    // Create export data with metadata
    const exportData = {
      metadata: {
        caseNumber,
        exportDate: new Date().toISOString(),
        ...userMetadata,
        totalConfirmations: Object.keys(caseConfirmations).length,
        version: '1.0'
      },
      confirmations: caseConfirmations
    };

    // Convert to JSON string for checksum calculation
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Calculate CRC32 checksum for data integrity
    const checksum = calculateCRC32(jsonString);
    
    // Add checksum to final export data
    const finalExportData = {
      ...exportData,
      metadata: {
        ...exportData.metadata,
        checksum: checksum.toUpperCase()
      }
    };

    // Convert final data to JSON blob
    const finalJsonString = JSON.stringify(finalExportData, null, 2);
    const blob = new Blob([finalJsonString], { type: 'application/json' });
    
    // Create download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confirmation-data-${caseNumber}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`Confirmation data exported for case ${caseNumber} with checksum ${checksum.toUpperCase()}`);
    
  } catch (error) {
    console.error('Failed to export confirmation data:', error);
    throw error;
  }
}
