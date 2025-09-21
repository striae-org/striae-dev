import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { 
  importCaseForReview, 
  listReadOnlyCases, 
  deleteReadOnlyCase,
  previewCaseImport,
  ImportResult,
  CaseImportPreview
} from '~/components/actions/case-review';
import styles from './case-import.module.css';

interface CaseImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}

// Consolidated state interfaces
interface ImportState {
  selectedFile: File | null;
  isImporting: boolean;
  isClearing: boolean;
  isLoadingPreview: boolean;
  showConfirmation: boolean;
}

interface MessageState {
  error: string;
  success: string;
}

interface ProgressState {
  stage: string;
  progress: number;
  details?: string;
}

// Helper functions
const isValidZipFile = (file: File): boolean => {
  return file.type === 'application/zip' || 
         file.type === 'application/x-zip-compressed' ||
         file.name.toLowerCase().endsWith('.zip');
};

const resetFileInput = (ref: React.RefObject<HTMLInputElement | null>) => {
  if (ref.current) {
    ref.current.value = '';
  }
};

// JSX Components for better organization
const ExistingCaseSection = ({ existingReadOnlyCase, selectedFile, onClear, isClearing, isImporting }: {
  existingReadOnlyCase: string | null;
  selectedFile: File | null;
  onClear: () => void;
  isClearing: boolean;
  isImporting: boolean;
}) => {
  if (!existingReadOnlyCase) return null;

  return (
    <div className={styles.warningSection}>
      <div className={styles.warningText}>
        <strong>Current Review Case:</strong> "{existingReadOnlyCase}"
        <p className={styles.warningSubtext}>
          {selectedFile 
            ? 'Importing a new case will automatically replace the existing one.'
            : 'You can clear this case or import a new one to replace it.'
          }
        </p>
      </div>
      <button
        className={styles.clearButton}
        onClick={onClear}
        disabled={isClearing || isImporting}
      >
        {isClearing ? 'Clearing...' : 'Clear Case'}
      </button>
    </div>
  );
};

const CasePreviewSection = ({ casePreview, isLoadingPreview }: {
  casePreview: CaseImportPreview | null;
  isLoadingPreview: boolean;
}) => {
  if (isLoadingPreview) {
    return (
      <div className={styles.previewSection}>
        <div className={styles.previewLoading}>
          Loading case information...
        </div>
      </div>
    );
  }

  if (!casePreview) return null;

  return (
    <div className={styles.previewSection}>
      <h3 className={styles.previewTitle}>Case Information</h3>
      
      {/* Checksum validation status */}
      {casePreview.checksumValid !== undefined && (
        <div className={`${styles.checksumStatus} ${casePreview.checksumValid ? styles.checksumValid : styles.checksumInvalid}`}>
          <div className={styles.checksumLabel}>
            <strong>Data Integrity:</strong>
          </div>
          <div className={styles.checksumValue}>
            {casePreview.checksumValid ? (
              <span className={styles.checksumSuccess}>✓ Verified (Checksum: {casePreview.expectedChecksum})</span>
            ) : (
              <span className={styles.checksumError}>
                ✗ FAILED - {casePreview.checksumError}
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.previewGrid}>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Case Number:</span>
          <span className={styles.previewValue}>{casePreview.caseNumber}</span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Exported by:</span>
          <span className={styles.previewValue}>
            {casePreview.exportedByName || casePreview.exportedBy || 'N/A'}
          </span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Lab/Company:</span>
          <span className={styles.previewValue}>{casePreview.exportedByCompany || 'N/A'}</span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Export Date:</span>
          <span className={styles.previewValue}>
            {new Date(casePreview.exportDate).toLocaleDateString()}
          </span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Total Images:</span>
          <span className={styles.previewValue}>{casePreview.totalFiles}</span>
        </div>
      </div>
    </div>
  );
};

const ProgressSection = ({ importProgress }: { importProgress: ProgressState | null }) => {
  if (!importProgress) return null;

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressText}>
        {importProgress.stage}
        {importProgress.details && (
          <span className={styles.progressDetails}> - {importProgress.details}</span>
        )}
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${importProgress.progress}%` }}
        />
      </div>
      <div className={styles.progressPercent}>
        {Math.round(importProgress.progress)}%
      </div>
    </div>
  );
};

const ConfirmationDialog = ({ 
  showConfirmation, 
  casePreview, 
  onConfirm, 
  onCancel 
}: {
  showConfirmation: boolean;
  casePreview: CaseImportPreview | null;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!showConfirmation || !casePreview) return null;

  return (
    <div className={styles.confirmationOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.confirmationModal}>
        <div className={styles.confirmationContent}>
          <h3 className={styles.confirmationTitle}>Confirm Case Import</h3>
          <p className={styles.confirmationText}>
            Are you sure you want to import this case for review?
          </p>
          
          <div className={styles.confirmationDetails}>
            <div className={styles.confirmationItem}>
              <strong>Case Number:</strong> {casePreview.caseNumber}
            </div>
            <div className={styles.confirmationItem}>
              <strong>Exported by:</strong> {casePreview.exportedByName || casePreview.exportedBy || 'N/A'}
            </div>
            <div className={styles.confirmationItem}>
              <strong>Lab/Company:</strong> {casePreview.exportedByCompany || 'N/A'}
            </div>
            <div className={styles.confirmationItem}>
              <strong>Export Date:</strong> {new Date(casePreview.exportDate).toLocaleDateString()}
            </div>
            <div className={styles.confirmationItem}>
              <strong>Total Images:</strong> {casePreview.totalFiles}
            </div>
            {casePreview.checksumValid !== undefined && (
              <div className={styles.confirmationItem}>
                <strong>Data Integrity:</strong> {casePreview.checksumValid ? 
                  <span style={{ color: 'green' }}>✓ Verified</span> : 
                  <span style={{ color: 'red' }}>✗ Failed</span>
                }
              </div>
            )}
          </div>

          <div className={styles.confirmationButtons}>
            <button
              className={styles.confirmButton}
              onClick={onConfirm}
            >
              Confirm Import
            </button>
            <button
              className={styles.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CaseImport = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: CaseImportProps) => {
  const { user } = useContext(AuthContext);
  
  // Consolidated state
  const [importState, setImportState] = useState<ImportState>({
    selectedFile: null,
    isImporting: false,
    isClearing: false,
    isLoadingPreview: false,
    showConfirmation: false
  });
  
  const [messages, setMessages] = useState<MessageState>({
    error: '',
    success: ''
  });
  
  const [existingReadOnlyCase, setExistingReadOnlyCase] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ProgressState | null>(null);
  const [casePreview, setCasePreview] = useState<CaseImportPreview | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions
  const clearMessages = useCallback(() => {
    setMessages({ error: '', success: '' });
  }, []);

  const clearImportData = useCallback(() => {
    setImportState(prev => ({ ...prev, selectedFile: null }));
    setCasePreview(null);
    resetFileInput(fileInputRef);
  }, []);

  const checkForExistingReadOnlyCase = useCallback(async () => {
    if (!user) return;
    
    try {
      const readOnlyCases = await listReadOnlyCases(user);
      setExistingReadOnlyCase(readOnlyCases.length > 0 ? readOnlyCases[0].caseNumber : null);
    } catch (error) {
      console.error('Error checking existing read-only cases:', error);
    }
  }, [user]);

  // Combined effects for initialization and cleanup
  useEffect(() => {
    if (user) {
      checkForExistingReadOnlyCase();
    }
    
    if (isOpen && user) {
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
      clearImportData();
      clearMessages();
      setImportProgress(null);
    }
  }, [isOpen, clearImportData, clearMessages]);

  const clearExistingReadOnlyCase = useCallback(async () => {
    if (!user || !existingReadOnlyCase) return;
    
    setImportState(prev => ({ ...prev, isClearing: true }));
    clearMessages();
    
    try {
      // Delete the read-only case properly (includes all data cleanup)
      await deleteReadOnlyCase(user, existingReadOnlyCase);
      
      const clearedCaseName = existingReadOnlyCase;
      setExistingReadOnlyCase(null);
      setMessages({ error: '', success: `Removed read-only case "${clearedCaseName}"` });
      
      // Notify parent component about the clear (if currently loaded)
      onImportComplete?.({ 
        success: true,
        caseNumber: '',
        isReadOnly: false,
        filesImported: 0,
        annotationsImported: 0,
        errors: [],
        warnings: []
      });
      
      // Clear success message after a delay
      setTimeout(() => setMessages(prev => ({ ...prev, success: '' })), 3000);
      
    } catch (error) {
      console.error('Error clearing existing read-only case:', error);
      setMessages({ error: error instanceof Error ? error.message : 'Failed to clear existing case', success: '' });
    } finally {
      setImportState(prev => ({ ...prev, isClearing: false }));
    }
  }, [user, existingReadOnlyCase, onImportComplete, clearMessages]);

  const loadCasePreview = useCallback(async (file: File) => {
    if (!user) {
      setMessages({ error: 'User authentication required', success: '' });
      return;
    }

    setImportState(prev => ({ ...prev, isLoadingPreview: true }));
    try {
      const preview = await previewCaseImport(file, user);
      setCasePreview(preview);
    } catch (error) {
      console.error('Error loading case preview:', error);
      setMessages({ 
        error: `Failed to read case information: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        success: '' 
      });
      clearImportData();
    } finally {
      setImportState(prev => ({ ...prev, isLoadingPreview: false }));
    }
  }, [user, clearImportData]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidZipFile(file)) {
      setMessages({ error: 'Only ZIP files are allowed. Please select a valid .zip file.', success: '' });
      clearImportData();
      return;
    }

    setImportState(prev => ({ ...prev, selectedFile: file }));
    clearMessages();
    setCasePreview(null);
    
    // Load case preview
    await loadCasePreview(file);
  }, [clearImportData, clearMessages, loadCasePreview]);

  const handleImport = useCallback(() => {
    if (!user || !importState.selectedFile || !casePreview) return;
    
    // Show confirmation dialog
    setImportState(prev => ({ ...prev, showConfirmation: true }));
  }, [user, importState.selectedFile, casePreview]);

  const handleConfirmImport = useCallback(async () => {
    if (!user || !importState.selectedFile) return;
    
    setImportState(prev => ({ ...prev, showConfirmation: false, isImporting: true }));
    clearMessages();
    setImportProgress({ stage: 'Starting import...', progress: 0 });
    
    try {
      const result = await importCaseForReview(
        user,
        importState.selectedFile,
        { overwriteExisting: true },
        (stage: string, progress: number, details?: string) => {
          setImportProgress({ stage, progress, details });
        }
      );
      
      if (result.success) {
        setMessages({ error: '', success: `Successfully imported case "${result.caseNumber}" for review` });
        setImportState(prev => ({ ...prev, selectedFile: null }));
        setCasePreview(null);
        resetFileInput(fileInputRef);
        
        // Update existing case status
        setExistingReadOnlyCase(result.caseNumber);
        
        // Call completion callback
        onImportComplete?.(result);
        
        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } else {
        setMessages({ error: result.errors?.join(', ') || 'Import failed', success: '' });
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      setMessages({ error: error instanceof Error ? error.message : 'Import failed. Please try again.', success: '' });
    } finally {
      setImportState(prev => ({ ...prev, isImporting: false }));
      setImportProgress(null);
    }
  }, [user, importState.selectedFile, onImportComplete, onClose, clearMessages]);

  const handleCancelImport = useCallback(() => {
    setImportState(prev => ({ ...prev, showConfirmation: false }));
    // Clear the import preview when user cancels
    setCasePreview(null);
    setImportState(prev => ({ ...prev, selectedFile: null }));
    resetFileInput(fileInputRef);
  }, []);

  const handleModalCancel = useCallback(() => {
    // Clear the import preview when closing modal
    setCasePreview(null);
    setImportState(prev => ({ ...prev, selectedFile: null }));
    resetFileInput(fileInputRef);
    onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !importState.isImporting && !importState.isClearing) {
      onClose();
    }
  }, [importState.isImporting, importState.isClearing, onClose]);

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
            <div className={styles.fileSection}>
              <div className={styles.fileInputGroup}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="zipFile"
                  accept=".zip"
                  onChange={handleFileSelect}
                  disabled={importState.isImporting || importState.isClearing}
                  className={styles.fileInput}
                />
                <label htmlFor="zipFile" className={styles.fileLabel}>
                  <span className={styles.fileLabelIcon}>📁</span>
                  <span className={styles.fileLabelText}>
                    {importState.selectedFile ? importState.selectedFile.name : 'Select ZIP file (JSON data files only)...'}
                  </span>
                </label>
              </div>
              
              {importState.selectedFile && (
                <div className={styles.fileInfo}>
                  <span className={styles.fileSize}>
                    {(importState.selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>

            {/* Case preview */}
            <CasePreviewSection 
              casePreview={casePreview} 
              isLoadingPreview={importState.isLoadingPreview} 
            />

            {/* Import progress */}
            <ProgressSection importProgress={importProgress} />

            {/* Action buttons */}
            <div className={styles.buttonGroup}>
              <button
                className={styles.importButton}
                onClick={handleImport}
                disabled={
                  !importState.selectedFile || 
                  !casePreview || 
                  importState.isImporting || 
                  importState.isClearing || 
                  importState.isLoadingPreview ||
                  (casePreview?.checksumValid === false) // Disable if checksum validation failed
                }
              >
                {importState.isImporting ? 'Importing...' : 'Import'}
              </button>
              
              <button
                className={styles.cancelButton}
                onClick={handleModalCancel}
                disabled={importState.isImporting || importState.isClearing}
              >
                Cancel
              </button>
            </div>

            {/* Checksum validation warning */}
            {casePreview?.checksumValid === false && (
              <div className={styles.checksumWarning}>
                <strong>⚠️ Import Blocked:</strong> Data checksum validation failed. 
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