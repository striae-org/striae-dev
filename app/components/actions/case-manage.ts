/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from 'firebase/auth';
import paths from '~/config/config.json';
import { deleteFile } from './image-manage';
import { 
  getDataApiKey,
  getUserApiKey
} from '~/utils/auth';
import { canCreateCase } from '~/utils/permissions';
import { CaseData, UserData, CasesToDelete } from '~/types';
import { auditService } from '~/services/audit.service';

const USER_WORKER_URL = paths.user_worker_url;
const DATA_WORKER_URL = paths.data_worker_url;
const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;
const MAX_CASE_NUMBER_LENGTH = 25;

export const listCases = async (user: User): Promise<string[]> => {
  try {
    const apiKey = await getUserApiKey();
    
    // Get user data from KV store
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

    const userData: UserData = await response.json();
    
    if (!userData?.cases) {
      return [];
    }

    const caseNumbers = userData.cases.map(c => c.caseNumber);
    return sortCaseNumbers(caseNumbers);
    
  } catch (error) {
    console.error('Error listing cases:', error);
    return [];
  }
};

const sortCaseNumbers = (cases: string[]): string[] => {
  return cases.sort((a, b) => {
    // Extract all numbers and letters
    const getComponents = (str: string) => {
      const numbers = str.match(/\d+/g)?.map(Number) || [];
      const letters = str.match(/[A-Za-z]+/g)?.join('') || '';
      return { numbers, letters };
    };

    const aComponents = getComponents(a);
    const bComponents = getComponents(b);

    // Compare numbers first
    const maxLength = Math.max(aComponents.numbers.length, bComponents.numbers.length);
    for (let i = 0; i < maxLength; i++) {
      const aNum = aComponents.numbers[i] || 0;
      const bNum = bComponents.numbers[i] || 0;
      if (aNum !== bNum) return aNum - bNum;
    }

    // If all numbers match, compare letters
    return aComponents.letters.localeCompare(bComponents.letters);
  });
};

export const validateCaseNumber = (caseNumber: string): boolean => {
  return CASE_NUMBER_REGEX.test(caseNumber) && 
         caseNumber.length <= MAX_CASE_NUMBER_LENGTH;
};

export const checkExistingCase = async (user: User, caseNumber: string): Promise<CaseData | null> => {
  try {
    const apiKey = await getDataApiKey();
    const url = `${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as CaseData & { isReadOnly?: boolean };
    
    // Check if this is a read-only case - if so, don't consider it as an existing regular case
    if (data.isReadOnly) {
      return null;
    }
    
    // Verify the case number matches (extra safety check)
    if (data.caseNumber === caseNumber) {
      return data;
    }
    
    return null;

  } catch (error) {
    console.error('Error checking existing case:', error);
    return null;
  }
};

export const checkCaseIsReadOnly = async (user: User, caseNumber: string): Promise<boolean> => {
  try {
    const apiKey = await getDataApiKey();
    const url = `${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      // Case doesn't exist, so it's not read-only
      return false;
    }

    const data = await response.json() as { isReadOnly?: boolean };
    return !!data.isReadOnly;
    
  } catch (error) {
    console.error('Error checking if case is read-only:', error);
    return false;
  }
};

export const createNewCase = async (user: User, caseNumber: string): Promise<CaseData> => {
  const startTime = Date.now();
  
  try {
    // Check if user can create a new case
    const permission = await canCreateCase(user);
    if (!permission.canCreate) {
      throw new Error(permission.reason || 'You cannot create more cases.');
    }

    const dataApiKey = await getDataApiKey();
    const userApiKey = await getUserApiKey();

    const newCase: CaseData = {
      createdAt: new Date().toISOString(),
      caseNumber,
      files: []
    };

    const rootCaseData: Omit<CaseData, 'files'> = {
      createdAt: newCase.createdAt,
      caseNumber: newCase.caseNumber
    };

    // Create case file in data worker
    const createCaseFile = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': dataApiKey
      },
      body: JSON.stringify(newCase)
    });

    if (!createCaseFile.ok) {
      throw new Error('Failed to create case file');
    }

    // Add case to user data in KV store
    const updateResponse = await fetch(`${USER_WORKER_URL}/${user.uid}/cases`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': userApiKey
      },
      body: JSON.stringify({ cases: [rootCaseData] })
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update user data');
    }

    // Log successful case creation
    const endTime = Date.now();
    await auditService.logCaseCreation(
      user,
      caseNumber,
      caseNumber, // Using case number as case name for now
      `New case created by ${user.email}`,
      'standard'
    );

    console.log(`✅ Case created: ${caseNumber} (${endTime - startTime}ms)`);
    return newCase;
    
  } catch (error) {
    // Log failed case creation
    const endTime = Date.now();
    try {
      await auditService.logEvent({
        userId: user.uid,
        userEmail: user.email || '',
        action: 'case-create',
        result: 'failure',
        fileName: `${caseNumber}.case`,
        fileType: 'case-package',
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        caseNumber,
        caseDetails: {
          newCaseName: caseNumber,
          caseDescription: `Failed case creation attempt by ${user.email}`,
          caseType: 'standard'
        },
        performanceMetrics: {
          processingTimeMs: endTime - startTime,
          fileSizeBytes: 0,
          validationStepsCompleted: 0,
          validationStepsFailed: 1
        }
      });
    } catch (auditError) {
      console.error('Failed to log case creation failure:', auditError);
    }
    
    console.error('Error creating new case:', error);
    throw error;
  }
};
      
export const renameCase = async (
  user: User, 
  oldCaseNumber: string, 
  newCaseNumber: string
): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Validate case numbers
    if (!validateCaseNumber(oldCaseNumber) || !validateCaseNumber(newCaseNumber)) {
      throw new Error('Invalid case number format');
    }

    const dataApiKey = await getDataApiKey();
    const userApiKey = await getUserApiKey();

    // Check if new case exists
    const existingCase = await checkExistingCase(user, newCaseNumber);
    if (existingCase) {
      throw new Error('New case number already exists');
    }

    // Get old case data from data worker
    const oldCaseResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${oldCaseNumber}/data.json`, {
      headers: { 'X-Custom-Auth-Key': dataApiKey }
    });

    if (!oldCaseResponse.ok) {
      throw new Error('Original case not found');
    }

    const oldCaseData = await oldCaseResponse.json() as CaseData;

    // Create new case with data worker
    const newCaseData: CaseData = {
      ...oldCaseData,
      caseNumber: newCaseNumber
    };

    // Add new case to data worker
    await fetch(`${DATA_WORKER_URL}/${user.uid}/${newCaseNumber}/data.json`, {
      method: 'PUT',
      headers: {
        'X-Custom-Auth-Key': dataApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCaseData)
    });

    // Transfer notes JSON files for each image
    if (oldCaseData.files && oldCaseData.files.length > 0) {
      for (const file of oldCaseData.files) {
        try {
          // Try to get the notes file for this image
          const notesResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${oldCaseNumber}/${file.id}/data.json`, {
            headers: { 'X-Custom-Auth-Key': dataApiKey }
          });

          if (notesResponse.ok) {
            const notesData = await notesResponse.json();
            
            // Copy notes to new case location
            await fetch(`${DATA_WORKER_URL}/${user.uid}/${newCaseNumber}/${file.id}/data.json`, {
              method: 'PUT',
              headers: {
                'X-Custom-Auth-Key': dataApiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(notesData)
            });
          }
        } catch (error) {
          // Continue with other files even if one fails
        }
      }
    }

    // Add new case to KV store
    const rootCaseData: Omit<CaseData, 'files'> = {
      createdAt: newCaseData.createdAt,
      caseNumber: newCaseNumber
    };

    const addResponse = await fetch(`${USER_WORKER_URL}/${user.uid}/cases`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': userApiKey
      },
      body: JSON.stringify({ cases: [rootCaseData] })
    });

    if (!addResponse.ok) {
      throw new Error('Failed to add new case');
    }

    // Delete old case from KV
    const deleteResponse = await fetch(`${USER_WORKER_URL}/${user.uid}/cases`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': userApiKey
      },
      body: JSON.stringify({ casesToDelete: [oldCaseNumber] })
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete old case');
    }

    // Delete old case from data worker
    await fetch(`${DATA_WORKER_URL}/${user.uid}/${oldCaseNumber}/data.json`, {
      method: 'DELETE',
      headers: { 'X-Custom-Auth-Key': dataApiKey }
    });

    // Clean up old notes JSON files
    if (oldCaseData.files && oldCaseData.files.length > 0) {
      for (const file of oldCaseData.files) {
        try {
          // Delete old notes file if it exists
          await fetch(`${DATA_WORKER_URL}/${user.uid}/${oldCaseNumber}/${file.id}/data.json`, {
            method: 'DELETE',
            headers: { 'X-Custom-Auth-Key': dataApiKey }
          });
        } catch (error) {
          // Continue with cleanup even if one fails
        }
      }
    }

    // Log successful case rename
    const endTime = Date.now();
    await auditService.logCaseRename(
      user,
      newCaseNumber, // Use new case number as the current context
      oldCaseNumber,
      newCaseNumber
    );

    console.log(`✅ Case renamed: ${oldCaseNumber} → ${newCaseNumber} (${endTime - startTime}ms)`);
    
  } catch (error) {
    // Log failed case rename
    const endTime = Date.now();
    try {
      await auditService.logEvent({
        userId: user.uid,
        userEmail: user.email || '',
        action: 'case-rename',
        result: 'failure',
        fileName: `${oldCaseNumber}.case`,
        fileType: 'case-package',
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        caseNumber: oldCaseNumber,
        caseDetails: {
          oldCaseName: oldCaseNumber,
          newCaseName: newCaseNumber,
          lastModified: new Date().toISOString()
        },
        performanceMetrics: {
          processingTimeMs: endTime - startTime,
          fileSizeBytes: 0,
          validationStepsCompleted: 0,
          validationStepsFailed: 1
        }
      });
    } catch (auditError) {
      console.error('Failed to log case rename failure:', auditError);
    }
    
    console.error('Error renaming case:', error);
    throw error;
  }
};

export const deleteCase = async (user: User, caseNumber: string): Promise<void> => {
  const startTime = Date.now();
  
  try {
    if (!validateCaseNumber(caseNumber)) {
      throw new Error('Invalid case number');
    }

    const dataApiKey = await getDataApiKey();
    const userApiKey = await getUserApiKey();

    // Get case data from data worker
    const caseResponse = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      headers: { 'X-Custom-Auth-Key': dataApiKey }
    });

    if (!caseResponse.ok) {
      throw new Error('Case not found');
    }

    const caseData = await caseResponse.json() as CaseData;

    // Store case info for audit logging
    const fileCount = caseData.files?.length || 0;
    const caseName = caseData.caseNumber || caseNumber;

    // Delete all files using data worker
    if (caseData.files && caseData.files.length > 0) {
      await Promise.all(
        caseData.files.map(file => 
          deleteFile(user, caseNumber, file.id)
        )
      );
    }

    // Delete case file using data worker
    await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
      method: 'DELETE',
      headers: { 'X-Custom-Auth-Key': dataApiKey }
    });

    // Delete case from KV store
    const deleteResponse = await fetch(`${USER_WORKER_URL}/${user.uid}/cases`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': userApiKey
      },
      body: JSON.stringify({ casesToDelete: [caseNumber] } as CasesToDelete)
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete case from user data');
    }

    // Log successful case deletion
    const endTime = Date.now();
    await auditService.logCaseDeletion(
      user,
      caseNumber,
      caseName,
      'User-requested deletion via case actions',
      false // No backup created for standard deletions
    );

    console.log(`✅ Case deleted: ${caseNumber} (${fileCount} files) (${endTime - startTime}ms)`);
    
  } catch (error) {
    // Log failed case deletion
    const endTime = Date.now();
    try {
      await auditService.logEvent({
        userId: user.uid,
        userEmail: user.email || '',
        action: 'case-delete',
        result: 'failure',
        fileName: `${caseNumber}.case`,
        fileType: 'case-package',
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        caseNumber,
        caseDetails: {
          newCaseName: caseNumber,
          deleteReason: 'Failed deletion attempt',
          backupCreated: false,
          lastModified: new Date().toISOString()
        },
        performanceMetrics: {
          processingTimeMs: endTime - startTime,
          fileSizeBytes: 0,
          validationStepsCompleted: 0,
          validationStepsFailed: 1
        }
      });
    } catch (auditError) {
      console.error('Failed to log case deletion failure:', auditError);
    }
    
    console.error('Error deleting case:', error);
    throw error;
  }
};