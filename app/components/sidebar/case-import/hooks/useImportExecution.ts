import { useCallback } from 'react';
import { User } from 'firebase/auth';
import { importCaseForReview, importConfirmationData } from '~/components/actions/case-review';
import { ImportResult, ConfirmationImportResult, CaseImportPreview } from '~/types';

interface ProgressState {
  stage: string;
  progress: number;
  details?: string;
}

interface UseImportExecutionProps {
  user: User | null;
  selectedFile: File | null;
  importType: 'case' | 'confirmation' | null;
  setImportProgress: (progress: ProgressState | null) => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setIsImporting: (importing: boolean) => void;
  onImportComplete?: (result: ImportResult | ConfirmationImportResult) => void;
  onUpdateExistingCase: (caseNumber: string) => void;
  onClose: () => void;
}

/**
 * Custom hook for handling import execution logic
 */
export const useImportExecution = ({
  user,
  selectedFile,
  importType,
  setImportProgress,
  setError,
  setSuccess,
  setIsImporting,
  onImportComplete,
  onUpdateExistingCase,
  onClose
}: UseImportExecutionProps) => {

  const executeImport = useCallback(async () => {
    if (!user || !selectedFile || !importType) return;
    
    setIsImporting(true);
    
    try {
      if (importType === 'case') {
        // Handle case import
        setImportProgress({ stage: 'Starting case import...', progress: 0 });
        
        const result = await importCaseForReview(
          user,
          selectedFile,
          { overwriteExisting: true },
          (stage: string, progress: number, details?: string) => {
            setImportProgress({ stage, progress, details });
          }
        );
        
        if (result.success) {
          setSuccess(`Successfully imported case "${result.caseNumber}" for review`);
          
          // Update existing case status
          onUpdateExistingCase(result.caseNumber);
          
          // Call completion callback
          onImportComplete?.(result);
          
          // Auto-close after success
          setTimeout(() => {
            onClose();
          }, 2000);
          
        } else {
          setError(result.errors?.join(', ') || 'Case import failed');
        }
        
      } else if (importType === 'confirmation') {
        // Handle confirmation import
        setImportProgress({ stage: 'Validating confirmation data...', progress: 50 });
        
        const result = await importConfirmationData(user, selectedFile);
        
        if (result.success) {
          setSuccess(`Successfully imported ${result.confirmationsImported} confirmation(s) for case "${result.caseNumber}"`);
          
          // Auto-close after success
          setTimeout(() => {
            onClose();
          }, 2000);
          
        } else {
          setError(result.errors?.join(', ') || 'Confirmation import failed');
        }
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      setError(error instanceof Error ? error.message : 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  }, [
    user, 
    selectedFile, 
    importType, 
    setImportProgress, 
    setError, 
    setSuccess, 
    setIsImporting, 
    onImportComplete, 
    onUpdateExistingCase, 
    onClose
  ]);

  return {
    executeImport
  };
};