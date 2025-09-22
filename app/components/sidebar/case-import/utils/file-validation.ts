import { isConfirmationDataFile } from '~/components/actions/case-review';

/**
 * Check if a file is a valid ZIP file
 */
export const isValidZipFile = (file: File): boolean => {
  return file.type === 'application/zip' || 
         file.type === 'application/x-zip-compressed' ||
         file.name.toLowerCase().endsWith('.zip');
};

/**
 * Check if a file is a valid confirmation JSON file
 */
export const isValidConfirmationFile = (file: File): boolean => {
  return file.type === 'application/json' && 
         isConfirmationDataFile(file.name);
};

/**
 * Check if a file is valid for import (either ZIP or confirmation JSON)
 */
export const isValidImportFile = (file: File): boolean => {
  return isValidZipFile(file) || isValidConfirmationFile(file);
};

/**
 * Get import type based on file
 */
export const getImportType = (file: File): 'case' | 'confirmation' | null => {
  if (isValidZipFile(file)) return 'case';
  if (isValidConfirmationFile(file)) return 'confirmation';
  return null;
};

/**
 * Reset file input element
 */
export const resetFileInput = (ref: React.RefObject<HTMLInputElement | null>): void => {
  if (ref.current) {
    ref.current.value = '';
  }
};