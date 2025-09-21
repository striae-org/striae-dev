import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { getDataApiKey } from '~/utils/auth';

const DATA_WORKER_URL = paths.data_worker_url;

export interface ConfirmationData {
  fullName: string;
  badgeId: string;
  timestamp: string;
  confirmationId: string;
  confirmedBy: string; // User UID
  confirmedByEmail: string;
  confirmedAt: string; // ISO timestamp
}

export interface CaseConfirmations {
  [originalImageId: string]: ConfirmationData[];
}

export interface CaseDataWithConfirmations {
  createdAt: string;
  caseNumber: string;
  files: any[];
  isReadOnly?: boolean;
  importedAt?: string;
  originalMetadata?: any;
  originalSummary?: any;
  originalImageIds?: { [originalId: string]: string };
  confirmations?: CaseConfirmations;
}

/**
 * Store a confirmation for a specific image, linked to the original image ID
 */
export async function storeConfirmation(
  user: User,
  caseNumber: string,
  currentImageId: string,
  confirmationData: {
    fullName: string;
    badgeId: string;
    timestamp: string;
    confirmationId: string;
  }
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

    // Create enhanced confirmation data
    const enhancedConfirmation: ConfirmationData = {
      ...confirmationData,
      confirmedBy: user.uid,
      confirmedByEmail: user.email || 'Unknown',
      confirmedAt: new Date().toISOString()
    };

    // Initialize confirmations object if it doesn't exist
    if (!caseData.confirmations) {
      caseData.confirmations = {};
    }

    // Initialize array for this original image if it doesn't exist
    if (!caseData.confirmations[originalImageId]) {
      caseData.confirmations[originalImageId] = [];
    }

    // Add the new confirmation
    caseData.confirmations[originalImageId].push(enhancedConfirmation);

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

    console.log(`Confirmation stored for original image ${originalImageId}:`, enhancedConfirmation);
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
