import { User } from 'firebase/auth';
import { useState, useEffect, useRef } from 'react';
import styles from './sidebar.module.css';
import { CasesModal } from './cases-modal';
import {
  validateCaseNumber,
  checkExistingCase,
  createNewCase,
  renameCase,
  deleteCase,
} from '../actions/case-manage';
import {
  fetchFiles,
  uploadFile,
  deleteFile,
} from '../actions/image-manage';

interface CaseSidebarProps {
  user: User;
  onImageSelect: (file: FileData) => void;
}

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

const SUCCESS_MESSAGE_TIMEOUT = 3000;

export const CaseSidebar = ({ user, onImageSelect }: CaseSidebarProps) => {
  // Case management states
    const [caseNumber, setCaseNumber] = useState<string>('');
    const [currentCase, setCurrentCase] = useState<string>('');
    const [isDeletingCase, setIsDeletingCase] = useState(false);
    const [newCaseName, setNewCaseName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);  
  
    // UI states
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string>('');
    const [successAction, setSuccessAction] = useState<'loaded' | 'created' | 'deleted' | null>(null);

    // File management state
    const [files, setFiles] = useState<FileData[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [fileError, setFileError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image File Types
    const allowedTypes = [
      'image/png',
      'image/gif', 
      'image/jpeg',
      'image/webp',
      'image/svg+xml'
    ];

   // Load files effect
  useEffect(() => {
    if (currentCase) {
      setIsLoading(true);
      fetchFiles(user, currentCase)
        .then(loadedFiles => {
          setFiles(loadedFiles);
        })
        .catch(err => {
          console.error('Failed to load files:', err);
          setFileError(err instanceof Error ? err.message : 'Failed to load files');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setFiles([]);
    }
  }, [user, currentCase]);
  
  const handleCase = async () => {
    setIsLoading(true);
    setError('');
    
    if (!validateCaseNumber(caseNumber)) {
      setError('Invalid case number format');
      setIsLoading(false);
      return;
    }

    try {
      const existingCase = await checkExistingCase(user, caseNumber);
      
      if (existingCase) {
        setCurrentCase(caseNumber);
        const files = await fetchFiles(user, caseNumber);
        setFiles(files);
        setCaseNumber('');
        setSuccessAction('loaded');
        setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
        return;
      }

      const newCase = await createNewCase(user, caseNumber);
      setCurrentCase(newCase.caseNumber);
      setFiles([]); // New case starts with empty files
      setCaseNumber('');
      setSuccessAction('created');
      setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCase) return;

    // Clear previous errors
    setFileError('');
    setIsUploadingFile(true);
    setUploadProgress(0);

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PNG, GIF, JPEG, WEBP, or SVG files are allowed');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10 MB');
      return;
    }

    try {
    const uploadedFile = await uploadFile(user, currentCase, file, (progress) => {
      setUploadProgress(progress);
    });
    setFiles(prev => [...prev, uploadedFile]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  } catch (err) {
    setFileError(err instanceof Error ? err.message : 'Upload failed');
  } finally {
    setIsUploadingFile(false);
    setUploadProgress(0);
  }
};

  const handleFileDelete = async (fileId: string) => {
    if (!currentCase) return;
    
    setFileError('');
    try {
      await deleteFile(user, currentCase, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleRenameCase = async () => {
  if (!currentCase || !newCaseName) return;
  
  if (!validateCaseNumber(newCaseName)) {
    setError('Invalid new case number format');
    return;
  }
  
  setIsRenaming(true);
  setError('');
  
  try {
    await renameCase(user, currentCase, newCaseName);
    setCurrentCase(newCaseName);
    setNewCaseName('');
    setSuccessAction('loaded');
    setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to rename case');
  } finally {
    setIsRenaming(false);
  }
};

  const handleDeleteCase = async () => {
  if (!currentCase) return;
  
  const confirmed = window.confirm(
    `Are you sure you want to delete case ${currentCase}? This will permanently delete all associated files and cannot be undone.`
  );
  
  if (!confirmed) return;
  
  setIsDeletingCase(true);
  setError('');
  
  try {
    await deleteCase(user, currentCase);
    setCurrentCase('');
    setFiles([]);
    setSuccessAction('deleted');
    setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to delete case');
  } finally {
    setIsDeletingCase(false);
  }
};

return (
    <div className={styles.caseSection}>
     <div className={styles.caseSection}>
        <h4>Case Management</h4>
        <div className={`${styles.caseInput} mb-4`}>
          <input
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="Case #"
          />
          </div>
          <div className={`${styles.caseLoad} mb-4`}>
          <button
        onClick={handleCase}
        disabled={isLoading || !caseNumber}
      >
            {isLoading ? 'Loading...' : 'Load/Create Case'}
      </button>      
      </div>
      <div className={styles.caseInput}>            
      <button 
            onClick={() => setIsModalOpen(true)}
            className={styles.listButton}
          >
            List All Cases
          </button>
    </div>
    {error && <p className={styles.error}>{error}</p>}
    {successAction && (
      <p className={styles.success}>
        Case {currentCase} {successAction} successfully!
      </p>
    )}  
    <CasesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectCase={setCaseNumber}
        currentCase={currentCase}
        user={user}
      />
        <div className={styles.filesSection}>
      <h4>{currentCase || 'No Case Selected'}</h4>
      {currentCase && (
        <div className={styles.fileUpload}>
      <label htmlFor="file-upload">Upload Image:</label>
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept="image/png, image/gif, image/jpeg, image/webp, image/svg+xml"
        onChange={handleFileUpload}
        disabled={isUploadingFile}
        className={styles.fileInput}
        aria-label="Upload image file"
      />      
      {isUploadingFile && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${uploadProgress}%` }}
          />
          <span className={styles.uploadingText}>
            {uploadProgress === 100 ? 'Processing...' : `${uploadProgress}%`}
          </span>
        </div>
      )}
      {fileError && <p className={styles.error}>{fileError}</p>}
    </div>
      )}
      {!currentCase ? (
        <p className={styles.emptyState}>Create or select a case to view files</p>
      ) : files.length === 0 ? (
        <p className={styles.emptyState}>No files found for {currentCase}</p>
      ) : (
        <ul className={styles.fileList}>
          {files.map((file) => (
            <li key={file.id}
              className={styles.fileItem}>
                <button
                  className={styles.fileButton}
                  onClick={() => onImageSelect(file)}
                  onKeyDown={(e) => e.key === 'Enter' && onImageSelect(file)}
                >
                <span className={styles.fileName}>{file.originalFilename}</span>
              </button>              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
                    handleFileDelete(file.id);
                  }
                }}
                className={styles.deleteButton}
                aria-label="Delete file"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
          {currentCase && (
        <div className={styles.renameCaseSection}>
          <input
            type="text"
            value={newCaseName}
            onChange={(e) => setNewCaseName(e.target.value)}
            placeholder="New Case Number"
            className={styles.renameInput}
          />
          <button
            onClick={handleRenameCase}
            disabled={isRenaming || !newCaseName}
            className={styles.renameButton}
          >
            {isRenaming ? 'Renaming...' : 'Rename Case'}
          </button>
        </div>
      )}
        {currentCase && (
          <div className={styles.deleteCaseSection}>
            <button
              onClick={handleDeleteCase}
              disabled={isDeletingCase}
              className={styles.deleteWarningButton}
            >
              {isDeletingCase ? 'Deleting...' : 'Delete Case'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};