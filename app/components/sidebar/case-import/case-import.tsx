import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { 
  importCaseForReview, 
  listReadOnlyCases, 
  removeReadOnlyCase,
  deleteReadOnlyCase,
  ImportResult 
} from '~/components/actions/case-review';
import styles from './case-import.module.css';

interface CaseImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}

export const CaseImport = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: CaseImportProps) => {
  const { user } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [existingReadOnlyCase, setExistingReadOnlyCase] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    stage: string;
    progress: number;
    details?: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for existing read-only cases when modal opens AND when component mounts
  useEffect(() => {
    if (user) {
      checkForExistingReadOnlyCase();
    }
  }, [user]);

  // Also check when modal opens
  useEffect(() => {
    if (isOpen && user) {
      checkForExistingReadOnlyCase();
    }
  }, [isOpen, user]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isImporting && !isClearing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, isImporting, isClearing]);

  // Reset state when modal closes (but preserve existingReadOnlyCase since it reflects DB state)
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError('');
      setSuccess('');
      setImportProgress(null);
      // Don't reset existingReadOnlyCase - it should persist to show the clear button
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const checkForExistingReadOnlyCase = async () => {
    if (!user) return;
    
    try {
      const readOnlyCases = await listReadOnlyCases(user);
      if (readOnlyCases.length > 0) {
        setExistingReadOnlyCase(readOnlyCases[0].caseNumber);
      } else {
        setExistingReadOnlyCase(null);
      }
    } catch (error) {
      console.error('Error checking existing read-only cases:', error);
    }
  };

  const clearExistingReadOnlyCase = async () => {
    if (!user || !existingReadOnlyCase) return;
    
    setIsClearing(true);
    setError('');
    setSuccess('');
    
    try {
      // Delete the read-only case properly (includes all data cleanup)
      await deleteReadOnlyCase(user, existingReadOnlyCase);
      
      const clearedCaseName = existingReadOnlyCase;
      setExistingReadOnlyCase(null);
      setSuccess(`Removed read-only case "${clearedCaseName}"`);
      
      // Notify parent component about the clear (if currently loaded)
      if (onImportComplete) {
        onImportComplete({ 
          success: true,
          caseNumber: '',
          isReadOnly: false,
          filesImported: 0,
          annotationsImported: 0,
          errors: [],
          warnings: []
        });
      }
      
      // Clear success message after a delay
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error clearing existing read-only case:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear existing case');
    } finally {
      setIsClearing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Strict validation: only allow .zip files
      const isZipFile = file.type === 'application/zip' || 
                       file.type === 'application/x-zip-compressed' ||
                       file.name.toLowerCase().endsWith('.zip');
      
      if (isZipFile) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Only ZIP files are allowed. Please select a valid .zip file.');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleImport = async () => {
    if (!user || !selectedFile) return;
    
    setIsImporting(true);
    setError('');
    setSuccess('');
    setImportProgress(null);
    
    try {
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
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Update existing case status
        setExistingReadOnlyCase(result.caseNumber);
        
        // Call completion callback
        if (onImportComplete) {
          onImportComplete(result);
        }
        
        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } else {
        setError(result.errors?.join(', ') || 'Import failed');
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      setError(error instanceof Error ? error.message : 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isImporting && !isClearing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Import Case for Review</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            disabled={isImporting || isClearing}
          >
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.fieldGroup}>
            
            {/* Existing read-only case section */}
            {existingReadOnlyCase && (
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
                  onClick={clearExistingReadOnlyCase}
                  disabled={isClearing || isImporting}
                >
                  {isClearing ? 'Clearing...' : 'Clear Case'}
                </button>
              </div>
            )}
            
            {/* File selector */}
            <div className={styles.fileSection}>
              <div className={styles.fileInputGroup}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="zipFile"
                  accept=".zip"
                  onChange={handleFileSelect}
                  disabled={isImporting || isClearing}
                  className={styles.fileInput}
                />
                <label htmlFor="zipFile" className={styles.fileLabel}>
                  <span className={styles.fileLabelIcon}>📁</span>
                  <span className={styles.fileLabelText}>
                    {selectedFile ? selectedFile.name : 'Select ZIP file (JSON data files only)...'}
                  </span>
                </label>
              </div>
              
              {selectedFile && (
                <div className={styles.fileInfo}>
                  <span className={styles.fileSize}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>

            {/* Import progress */}
            {importProgress && (
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
            )}

            {/* Action buttons */}
            <div className={styles.buttonGroup}>
              <button
                className={styles.importButton}
                onClick={handleImport}
                disabled={!selectedFile || isImporting || isClearing}
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
              
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isImporting || isClearing}
              >
                Cancel
              </button>
            </div>

            {/* Success message */}
            {success && (
              <div className={styles.success}>
                {success}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className={styles.error}>
                {error}
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
  );
};