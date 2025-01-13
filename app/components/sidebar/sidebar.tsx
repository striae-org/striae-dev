import {
  getApiKey, 
  validateCaseNumber,
  checkExistingCase, 
  createNewCase 
} from '~/components/actions/case-manage';
import {  
  uploadFile,
  deleteFile,
  //getImageUrl
} from '~/components/actions/image-manage';
import { CasesModal } from '~/components/sidebar/cases-modal';
import { ManageProfile } from '~/components/user/manage-profile';
import { User } from 'firebase/auth';
import { SignOut } from '~/components/actions/signout';
import styles from './sidebar.module.css';
import { useState, useEffect, useRef } from 'react';
import paths from '~/config/config.json';


  interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface CaseData {
  files: FileData[];
}

interface SidebarProps {
  user: User;  
}

const WORKER_URL = paths.data_worker_url;
const SUCCESS_MESSAGE_TIMEOUT = 3000;


export const Sidebar = ({ user }: SidebarProps) => {
  // Case management states
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<string>('');  

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [successAction, setSuccessAction] = useState<'loaded' | 'created' | null>(null);

  // File management state
  const [files, setFiles] = useState<FileData[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  // Load files when case changes
  useEffect(() => {
  if (currentCase) {
    getApiKey()
      .then(apiKey =>
        fetch(`${WORKER_URL}/${user.uid}/${currentCase}/data.json`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Auth-Key': apiKey
          }
        })
      )
      .then(response => response.json())
      .then((data: unknown) => {
        // Type check the response data
        const caseData = data as CaseData;
        setFiles(caseData.files || []);
      })
      .catch(err => {
        console.error('Failed to load files:', err);
        setFiles([]);
      });
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
        setFiles(existingCase.files || []); // Use files from case data
        setCaseNumber('');
        setSuccessAction('loaded');
        setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
        return;
      }

      const newCase = await createNewCase(user, caseNumber);
      setCurrentCase(caseNumber);
      setFiles(newCase.files || []); // Initialize empty files array      
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFileError('Only image files are allowed');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setFileError('File size must be less than 100MB');
      return;
    }

    try {
      const uploadedFile = await uploadFile(user, currentCase, file);
      setFiles(prev => [...prev, uploadedFile]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingFile(false);
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

  return (
    <div className={styles.sidebar}>
      <div className={styles.userInfo}>
        <h3 className={styles.userTitle}>
          {`${user.displayName?.split(' ')[0] || 'User'}'s Striae`}
        </h3>
        <div className={styles.userActions}>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className={styles.profileButton}
          >
            Manage Profile
          </button>
        <SignOut />
        </div>
      </div>

      <ManageProfile 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      
     <div className={styles.caseSection}>
        <h4>Case Management</h4>
        <div className={styles.caseInput}>
          <input
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="Case #"
          />
          <button 
        onClick={handleCase}
        disabled={isLoading || !caseNumber}
      >
            {isLoading ? 'Loading...' : 'Load/Create Case'}
      </button>
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
        user={user}  // Add user prop for data fetching
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
        accept="image/*"
        onChange={handleFileUpload}
        disabled={isUploadingFile}
        className={styles.fileInput}
        aria-label="Upload image file"
      />
      {isUploadingFile && <span className={styles.uploadingText}>Uploading...</span>}
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
            <li key={file.id} className={styles.fileItem}>
              <span className={styles.fileName}>{file.originalFilename}</span>
              <span className={styles.uploadDate}>
                {new Date(file.uploadedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleFileDelete(file.id)}
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
      </div>
    </div>  
  );
};