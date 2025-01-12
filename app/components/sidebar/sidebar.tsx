import { 
  validateCaseNumber,
  checkExistingCase, 
  createNewCase 
} from '~/components/actions/case-manage';
import { User } from 'firebase/auth';
import { SignOut } from '~/components/actions/signout';
import styles from './sidebar.module.css';
import { useState } from 'react';
import { json } from '@remix-run/cloudflare';
import paths from '~/config.json';

interface CloudflareContext {  
    cloudflare: {
      env: {
        FWJIO_WFOLIWLF_WFOUIH: string;
      };
    };
  }  
  interface FileData {
  name: string;
  size: number;
  lastModified: string;
  type: string;
}

interface LoaderData {
  files: FileData[];
  context: CloudflareContext;
}

interface SidebarProps {
  user: User;
  context: CloudflareContext;
}

const WORKER_URL = paths.data_worker_url;
const SUCCESS_MESSAGE_TIMEOUT = 3000;

export const loader = async ({ user, context, caseNumber }: { 
  user: User; 
  context: CloudflareContext;
  caseNumber: string;
}) => {
    try {
    // First fetch case directory listing
    const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.FWJIO_WFOLIWLF_WFOUIH,
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch files:', response.status);
      return json<LoaderData>({ files: [], context });
    }

    const fileList: { name: string; size: number; lastModified: string; type: string; }[] = await response.json();
    
    // Format file data
    const files = fileList.map((file) => ({
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      type: file.type
    }));

    return json<LoaderData>({ 
      files: files.filter(Boolean),
      context 
    });

  } catch (error) {
    console.error('Loader error:', error);
    return json<LoaderData>({ files: [], context });
  }
};

export const Sidebar = ({ user, context }: SidebarProps) => {
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<string>('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string>('');    
  const [isLoadingCase, setIsLoadingCase] = useState<boolean>(false);
  const [successAction, setSuccessAction] = useState<'loaded' | 'created' | null>(null);
  //const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  
  const handleCase = async () => {
    setIsLoadingCase(true);
    setError('');
    
    if (!validateCaseNumber(caseNumber)) {
      setError('Invalid case number format');
      setIsLoadingCase(false);
      return;
    }

    try {
      const existingCase = await checkExistingCase(user, caseNumber, context);
      
      if (existingCase) {
        setCurrentCase(caseNumber);
        setFiles(existingCase.files || []);
        setCaseNumber('');
        setSuccessAction('loaded');
        setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
        return;
      }

      const newCase = await createNewCase(user, caseNumber, context);
      setCurrentCase(caseNumber);
      setFiles(newCase.files || []);
      setCaseNumber('');
      setSuccessAction('created');
      setTimeout(() => setSuccessAction(null), SUCCESS_MESSAGE_TIMEOUT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      console.error(err);
    } finally {
      setIsLoadingCase(false);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.userInfo}>
        <h3 className={styles.userTitle}>
          {`${user.displayName?.split(' ')[0] || 'User'}'s Striae`}
        </h3>
        <SignOut />
      </div>
      
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
        disabled={isLoadingCase || !caseNumber}
      >
            {isLoadingCase ? 'Loading...' : 'Load/Create Case'}
      </button>
    </div>
    {error && <p className={styles.error}>{error}</p>}
    {successAction && (
      <p className={styles.success}>
        Case {currentCase} {successAction} successfully!
      </p>
    )}
        
        <div className={styles.filesSection}>
          <h4>{currentCase || 'No Case Selected'}</h4>
          {!currentCase ? (
            <p className={styles.emptyState}>Create or select a case to view files</p>
          ) : files.length === 0 ? (
            <p className={styles.emptyState}>No files found for {currentCase}</p>
          ) : (
            <ul className={styles.fileList}>
              {files.map((file) => (
                <li key={file.name} className={styles.fileItem}>
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};