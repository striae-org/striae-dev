/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from 'firebase/auth';
import { deleteFile } from './image-manage';
import { 
  canCreateCase, 
  getUserCases,
  validateUserSession,
  addUserCase,
  removeUserCase
} from '~/utils/permissions';
import { 
  getCaseData,
  updateCaseData,
  deleteCaseData,
  duplicateCaseData
} from '~/utils/data-operations';
import { CaseData, ReadOnlyCaseData } from '~/types';
import { auditService } from '~/services/audit.service';

const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;

/**
 * Type guard to check if case data has isReadOnly property
 */
const isReadOnlyCaseData = (caseData: CaseData): caseData is ReadOnlyCaseData => {
  return 'isReadOnly' in caseData && typeof (caseData as ReadOnlyCaseData).isReadOnly === 'boolean';
};
const MAX_CASE_NUMBER_LENGTH = 25;

export const listCases = async (user: User): Promise<string[]> => {
  try {
    // Use centralized function to get user cases
    const userCases = await getUserCases(user);
    const caseNumbers = userCases.map(c => c.caseNumber);
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
    // Use centralized function with access validation disabled
    // This prevents timing issues where case exists in storage but not yet in user's access list
    const caseData = await getCaseData(user, caseNumber, { validateAccess: false });
    
    if (!caseData) {
      return null;
    }

    // Check if this is a read-only case - if so, don't consider it as an existing regular case
    if ('isReadOnly' in caseData && caseData.isReadOnly) {
      return null;
    }
    
    // Verify the case number matches (extra safety check)
    if (caseData.caseNumber === caseNumber) {
      return caseData;
    }
    
    return null;

  } catch (error) {
    console.error('Error checking existing case:', error);
    return null;
  }
};

export const checkCaseIsReadOnly = async (user: User, caseNumber: string): Promise<boolean> => {
  try {
    const caseData = await getCaseData(user, caseNumber);
    if (!caseData) {
      // Case doesn't exist, so it's not read-only
      return false;
    }

    // Use type guard to check for isReadOnly property safely
    return isReadOnlyCaseData(caseData) ? !!caseData.isReadOnly : false;
    
  } catch (error) {
    console.error('Error checking if case is read-only:', error);
    return false;
  }
};

export const createNewCase = async (user: User, caseNumber: string): Promise<CaseData> => {
  const startTime = Date.now();
  
  try {
    // Validate user session first
    const sessionValidation = await validateUserSession(user);
    if (!sessionValidation.valid) {
      throw new Error(`Session validation failed: ${sessionValidation.reason}`);
    }

    // Check if user can create a new case
    const permission = await canCreateCase(user);
    if (!permission.canCreate) {
      throw new Error(permission.reason || 'You cannot create more cases.');
    }

    const newCase: CaseData = {
      createdAt: new Date().toISOString(),
      caseNumber,
      files: []
    };

    const caseMetadata = {
      createdAt: newCase.createdAt,
      caseNumber: newCase.caseNumber
    };

    // Create case file using centralized function with access validation disabled
    // (case hasn't been added to user's list yet)
    await updateCaseData(user, caseNumber, newCase, { validateAccess: false });

    // Add case to user data using centralized function
    await addUserCase(user, caseMetadata);

    // Log successful case creation
    const endTime = Date.now();
    await auditService.logCaseCreation(
      user,
      caseNumber,
      caseNumber // Using case number as case name for now
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
          newCaseName: caseNumber
        },
        performanceMetrics: {
          processingTimeMs: endTime - startTime,
          fileSizeBytes: 0
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

    // Check if new case exists
    const existingCase = await checkExistingCase(user, newCaseNumber);
    if (existingCase) {
      throw new Error('New case number already exists');
    }

    // Use centralized function to duplicate case data (skip destination check for rename)
    await duplicateCaseData(user, oldCaseNumber, newCaseNumber, { skipDestinationCheck: true });

    // Add new case metadata to user data
    const newCaseMetadata = {
      createdAt: new Date().toISOString(),
      caseNumber: newCaseNumber
    };

    await addUserCase(user, newCaseMetadata);

    // Remove old case from user data  
    await removeUserCase(user, oldCaseNumber);

    // Delete old case data using centralized function
    await deleteCaseData(user, oldCaseNumber);

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
          fileSizeBytes: 0
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

    // Validate user session
    const sessionValidation = await validateUserSession(user);
    if (!sessionValidation.valid) {
      throw new Error(`Session validation failed: ${sessionValidation.reason}`);
    }

    // Get case data using centralized function
    const caseData = await getCaseData(user, caseNumber);
    if (!caseData) {
      throw new Error('Case not found');
    }

    // Store case info for audit logging
    const fileCount = caseData.files?.length || 0;
    const caseName = caseData.caseNumber || caseNumber;

    // Delete all files using centralized function
    if (caseData.files && caseData.files.length > 0) {
      await Promise.all(
        caseData.files.map(file => 
          deleteFile(user, caseNumber, file.id)
        )
      );
    }

    // Delete case data using centralized function
    await deleteCaseData(user, caseNumber);

    // Remove case from user data using centralized function
    await removeUserCase(user, caseNumber);

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
          fileSizeBytes: 0
        }
      });
    } catch (auditError) {
      console.error('Failed to log case deletion failure:', auditError);
    }
    
    console.error('Error deleting case:', error);
    throw error;
  }
};