import { User } from 'firebase/auth';
import { CaseExportData } from '~/types';
import { saveNotes } from '../notes-manage';

/**
 * Import annotations for all files in the case
 */
export async function importAnnotations(
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