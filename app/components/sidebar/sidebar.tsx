import {
  listCases, 
  validateCaseNumber,
  checkExistingCase, 
  createNewCase 
} from '~/components/actions/case-manage';
import { CasesModal } from '~/components/sidebar/cases-modal';
import { ManageProfile } from '~/components/user/manage-profile';
import { User } from 'firebase/auth';
import { SignOut } from '~/components/actions/signout';
import styles from './sidebar.module.css';
import { useState, useEffect } from 'react';
import { json } from '@remix-run/cloudflare';
import paths from '~/config/config.json';


  interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface CaseData {
  createdAt: string;
  caseNumber: string;
  files?: FileData[];
}

interface LoaderData {
  files: FileData[];
}

interface SidebarProps {
  user: User;  
}

const WORKER_URL = paths.data_worker_url;
const KEYS_URL = paths.keys_url;
const SUCCESS_MESSAGE_TIMEOUT = 3000;

export const loader = async ({ user, caseNumber }: { 
  user: User;   
  caseNumber: string;
}) => {
    try {

      // Get API key from keys worker
    const keyResponse = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`);
    if (!keyResponse.ok) {
      throw new Error('Failed to retrieve API key');
    }
    const apiKey = await keyResponse.text();
    
    // First fetch case directory listing
    const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch files:', response.status);
      return json<LoaderData>({ files: [] });
    }

    const fileList: { name: string; size: number; lastModified: string; type: string; }[] = await response.json();
    
    // Format file data
    const files = fileList.map((file) => ({
      id: file.name, // Using filename as ID
      originalFilename: file.name,
      uploadedAt: file.lastModified
    }));

    return json<LoaderData>({ 
      files: files.filter(Boolean)       
    });

  } catch (error) {
    console.error('Loader error:', error);
    return json<LoaderData>({ files: [] });
  }
};

export const Sidebar = ({ user }: SidebarProps) => {
  // Case management states
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<string>('');
  const [allCases, setAllCases] = useState<string[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [successAction, setSuccessAction] = useState<'loaded' | 'created' | null>(null);

  // File management state
  const [files, setFiles] = useState<FileData[]>([]);
  //const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // Load cases effect
  useEffect(() => {
    setIsLoading(true);
    listCases(user)
      .then(cases => {
        setAllCases(cases);
      })
      .catch(err => {
        console.error('Failed to load cases:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
        setFiles(existingCase.files || []);
        setCaseNumber('');
        setSuccessAction('loaded');
        setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
        return;
      }

      const newCase: CaseData = await createNewCase(user, caseNumber);
      setCurrentCase(caseNumber);
      setFiles(newCase.files || []);
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
        cases={allCases}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectCase={setCaseNumber}
        currentCase={currentCase}
      />
        <div className={styles.filesSection}>
      <h4>{currentCase || 'No Case Selected'}</h4>
      {!currentCase ? (
        <p className={styles.emptyState}>Create or select a case to view files</p>
      ) : files.length === 0 ? (
        <p className={styles.emptyState}>No files found for {currentCase}</p>
      ) : (
        <ul className={styles.fileList}>
          {files.map((file) => (
            <li key={file.id} className={styles.fileItem}>
              {file.originalFilename}
              <span className={styles.uploadDate}>
                {new Date(file.uploadedAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
      </div>
    </div>  
  );
};