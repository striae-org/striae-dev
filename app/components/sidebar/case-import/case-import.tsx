import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { 
  listReadOnlyCases, 
  deleteReadOnlyCase
} from '~/components/actions/case-review';
import {
  ImportResult,  
  ConfirmationImportResult
} from '~/types';
import {
  FileSelector,
  CasePreviewSection,
  ConfirmationPreviewSection,
  ProgressSection,
  ExistingCaseSection,
  ConfirmationDialog,
  useImportState,
  useFilePreview,
  useImportExecution,
  isValidImportFile,
  getImportType,
  resetFileInput
} from './index';
import styles from './case-import.module.css';

interface CaseImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult | ConfirmationImportResult) => void;
}

export const CaseImport = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: CaseImportProps) => {
  const { user } = useContext(AuthContext);
  
  // Use our custom hooks
  const {
    importState,
    messages,
    importProgress,
    clearMessages,
    setError,
    setSuccess,
    updateImportState,
    resetImportState,
    setImportProgress
  } = useImportState();
  
  const [existingReadOnlyCase, setExistingReadOnlyCase] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Clear import data helper
  const clearImportData = useCallback(() => {
    updateImportState({ selectedFile: null, importType: null });
    clearPreviews();
    resetFileInput(fileInputRef);
  }, [updateImportState]);

  // File preview hook
  const {
    casePreview,
    confirmationPreview,
    loadCasePreview,
    loadConfirmationPreview,
    clearPreviews
  } = useFilePreview(
    user,
    setError,
    (loading) => updateImportState({ isLoadingPreview: loading }),
    clearImportData
  );

  // Import execution hook
  const { executeImport } = useImportExecution({
    user,
    selectedFile: importState.selectedFile,
    importType: importState.importType,
    setImportProgress,
    clearMessages,
    setError,
    setSuccess,
    setIsImporting: (importing) => updateImportState({ isImporting: importing }),
    onImportComplete,
    onUpdateExistingCase: setExistingReadOnlyCase,
    onClose
  });

  // Check for existing read-only cases
  const checkForExistingReadOnlyCase = useCallback(async () => {
    if (!user) return;
    
    try {
      const readOnlyCases = await listReadOnlyCases(user);
      setExistingReadOnlyCase(readOnlyCases.length > 0 ? readOnlyCases[0].caseNumber : null);
    } catch (error) {
      console.error('Error checking existing read-only cases:', error);
    }
  }, [user]);

  // Clear existing read-only case
  const clearExistingReadOnlyCase = useCallback(async () => {
    if (!user || !existingReadOnlyCase) return;
    
    updateImportState({ isClearing: true });
    
    try {
      await deleteReadOnlyCase(user, existingReadOnlyCase);
      
      const clearedCaseName = existingReadOnlyCase;
      setExistingReadOnlyCase(null);
      setSuccess(`Removed read-only case "${clearedCaseName}"`);
      
      onImportComplete?.({ 
        success: true,
        caseNumber: '',
        isReadOnly: false,
        filesImported: 0,
        annotationsImported: 0,
        errors: [],
        warnings: []
      });
      
    } catch (error) {
      console.error('Error clearing existing read-only case:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear existing case');
    } finally {
      updateImportState({ isClearing: false });
    }
  }, [user, existingReadOnlyCase, updateImportState, setSuccess, setError, onImportComplete]);

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear any existing messages when selecting a new file
    clearMessages();

    if (!isValidImportFile(file)) {
      setError('Only ZIP files (case imports) or JSON files (confirmation imports) are allowed. Please select a valid file.');
      clearImportData();
      return;
    }

    const importType = getImportType(file);
    updateImportState({ 
      selectedFile: file, 
      importType 
    });
    clearPreviews();
    
    // Load preview based on import type
    if (importType === 'case') {
      await loadCasePreview(file);
    } else if (importType === 'confirmation') {
      await loadConfirmationPreview(file);
    }
  }, [clearMessages, clearImportData, setError, updateImportState, clearPreviews, loadCasePreview, loadConfirmationPreview]);

  // Handle direct file selection (for drag and drop)
  const handleFileSelectDirect = useCallback(async (file: File) => {
    // Clear any existing messages when selecting a new file
    clearMessages();

    if (!isValidImportFile(file)) {
      setError('Only ZIP files (case imports) or JSON files (confirmation imports) are allowed. Please select a valid file.');
      clearImportData();
      return;
    }

    const importType = getImportType(file);
    updateImportState({ 
      selectedFile: file, 
      importType 
    });
    clearPreviews();
    
    // Load preview based on import type
    if (importType === 'case') {
      await loadCasePreview(file);
    } else if (importType === 'confirmation') {
      await loadConfirmationPreview(file);
    }
  }, [clearMessages, clearImportData, setError, updateImportState, clearPreviews, loadCasePreview, loadConfirmationPreview]);

  // Handle import action
  const handleImport = useCallback(() => {
    if (!user || !importState.selectedFile || !importState.importType) return;
    
    // For case imports, show confirmation dialog with preview
    // For confirmation imports, proceed directly to import
    if (importState.importType === 'case') {
      if (!casePreview) return;
      updateImportState({ showConfirmation: true });
    } else {
      // Direct import for confirmations
      executeImport();
    }
  }, [user, importState.selectedFile, importState.importType, casePreview, updateImportState, executeImport]);

  const handleCancelImport = useCallback(() => {
    updateImportState({ showConfirmation: false });
    clearImportData();
  }, [updateImportState, clearImportData]);

  const handleModalCancel = useCallback(() => {
    clearImportData();
    onClose();
  }, [clearImportData, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !importState.isImporting && !importState.isClearing) {
      onClose();
    }
  }, [importState.isImporting, importState.isClearing, onClose]);

  // Effects
  useEffect(() => {
    if (user && isOpen) {
      checkForExistingReadOnlyCase();
    }
  }, [user, isOpen, checkForExistingReadOnlyCase]);

  // Handle keyboard events
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !importState.isImporting && !importState.isClearing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, importState.isImporting, importState.isClearing]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetImportState();
    }
  }, [isOpen, resetImportState]);

  // Handle confirmation import
  const handleConfirmImport = useCallback(() => {
    executeImport();
    updateImportState({ showConfirmation: false });
  }, [executeImport, updateImportState]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Import Case for Review</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            disabled={importState.isImporting || importState.isClearing}
          >
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.fieldGroup}>
            
            {/* Existing read-only case section */}
            <ExistingCaseSection 
              existingReadOnlyCase={existingReadOnlyCase}
              selectedFile={importState.selectedFile}
              onClear={clearExistingReadOnlyCase}
              isClearing={importState.isClearing}
              isImporting={importState.isImporting}
            />
            
            {/* File selector */}
            <FileSelector
              selectedFile={importState.selectedFile}
              onFileSelect={handleFileSelect}
              onFileSelectDirect={handleFileSelectDirect}
              isDisabled={importState.isImporting || importState.isClearing}
              onClear={clearImportData}
            />

            {/* Import type indicator and preview */}
            {importState.selectedFile && importState.importType && (
              <div className={styles.importTypeSection}>
                <div className={styles.importTypeIndicator}>
                  <strong>Import Type:</strong> {importState.importType === 'case' ? 'Case Import' : 'Confirmation Import'}
                </div>
                
                {importState.importType === 'case' && (
                  <CasePreviewSection 
                    casePreview={casePreview} 
                    isLoadingPreview={importState.isLoadingPreview} 
                  />
                )}
                
                {importState.importType === 'confirmation' && (
                  <ConfirmationPreviewSection 
                    confirmationPreview={confirmationPreview} 
                    isLoadingPreview={importState.isLoadingPreview} 
                  />
                )}
              </div>
            )}

            {/* Import progress */}
            <ProgressSection importProgress={importProgress} />

            {/* Hash validation warning */}
            {casePreview?.hashValid === false && (
              <div className={styles.hashWarning}>
                <strong>⚠️ Import Blocked:</strong> Data hash validation failed. 
                This file may have been tampered with or corrupted and cannot be imported.
              </div>
            )}

            {/* Success message */}
            {messages.success && (
              <div className={styles.success}>
                {messages.success}
              </div>
            )}

            {/* Error message */}
            {messages.error && (
              <div className={styles.error}>
                {messages.error}
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.buttonGroup}>
              <button
                className={styles.importButton}
                onClick={handleImport}
                disabled={
                  !importState.selectedFile || 
                  !importState.importType ||
                  importState.isImporting || 
                  importState.isClearing || 
                  importState.isLoadingPreview ||
                  (importState.importType === 'case' && (!casePreview || casePreview.hashValid !== true))
                }
              >
                {importState.isImporting ? 'Importing...' : 
                 importState.importType === 'confirmation' ? 'Import Confirmations' : 'Import Case'}
              </button>
              
              <button
                className={styles.cancelButton}
                onClick={handleModalCancel}
                disabled={importState.isImporting || importState.isClearing}
              >
                Cancel
              </button>
            </div>

            {/* Instructions */}
            <div className={styles.instructions}>
              <h3 className={styles.instructionsTitle}>Instructions:</h3>
              <ul className={styles.instructionsList}>
                <li>Only ZIP files (.zip) exported with the JSON data format from Striae are accepted</li>
                <li>Only one case can be reviewed at a time</li>
                <li>Imported cases are read-only and cannot be modified</li>
                <li>Importing will automatically replace any existing review case</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Confirmation Dialog */}
    <ConfirmationDialog 
      showConfirmation={importState.showConfirmation}
      casePreview={casePreview}
      onConfirm={handleConfirmImport}
      onCancel={handleCancelImport}
    />
    </>
  );
};