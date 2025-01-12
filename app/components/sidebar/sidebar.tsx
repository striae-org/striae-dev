import { User } from 'firebase/auth';
import { SignOut } from '~/components/actions/signout';
import styles from './sidebar.module.css';
import { useState } from 'react';
import { json } from '@remix-run/cloudflare';
import paths from '~/config.json';

interface CloudflareContext {  
    cloudflare: {
      env: {
        R2_KEY_SECRET: string;
      };
    };
  }
  interface CaseData {
  createdAt: string;
  caseNumber: string;
  userId: string;
  files: FileData[];
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
const CASE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;
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
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
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
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoadingCase, setIsLoadingCase] = useState<boolean>(false);
  //const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  
  const loadCase = async () => {
    setIsLoadingCase(true);
    setError('');
    
    if (!caseNumber.match(CASE_NUMBER_REGEX)) {
      setError('Invalid case number format');
      setIsLoadingCase(false);
      return;
    }

    try {
      const checkResponse = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
        }
      });

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        const isCaseData = (data: unknown): data is CaseData => {
          return (
            typeof data === 'object' &&
            data !== null &&
            'caseNumber' in data &&
            typeof (data as CaseData).caseNumber === 'string'
          );
        };

        if (isCaseData(data) && data.caseNumber === caseNumber) {
          setCurrentCase(caseNumber);
          setFiles(data.files || []);
          setCaseNumber('');
          setSuccess(true);
          setTimeout(() => setSuccess(false), SUCCESS_MESSAGE_TIMEOUT);
          return;
        }
      }
      
      // Case doesn't exist, create it
      await createCase();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
      console.error(err);
    } finally {
      setIsLoadingCase(false);
    }
  };


   const createCase = async () => {
    setIsLoadingCase(true);
    setError('');
    
    // Validate case number
    if (!caseNumber.match(CASE_NUMBER_REGEX)) {
      setError('Invalid case number format');
      setIsLoadingCase(false);
      return;
    }

    try {
      // Check if case exists
      const checkResponse = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
        }
      });

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        const isCaseData = (data: unknown): data is CaseData => {
          return (
            typeof data === 'object' &&
            data !== null &&
            'caseNumber' in data &&
            typeof (data as CaseData).caseNumber === 'string'
          );
        };
        
        if (isCaseData(data) && data.caseNumber === caseNumber) {
          setError('Case already exists');
          setIsLoadingCase(false);
          return;
        }
      }

      const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
        },
        body: JSON.stringify({
          createdAt: new Date().toISOString(),
          caseNumber,
          userId: user.uid,
          files: []
        })
      });

      if (!response.ok) throw new Error(`Failed to create case: ${response.statusText}`);      
      setCurrentCase(caseNumber);
      setFiles([]);
      setCaseNumber('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), SUCCESS_MESSAGE_TIMEOUT);
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
        onClick={loadCase}
        disabled={isLoadingCase || !caseNumber}
      >
            {isLoadingCase ? 'Loading...' : 'Load Case'}
      </button>
    </div>
    {error && <p className={styles.error}>{error}</p>}
    {success && <p className={styles.success}>
      Case {currentCase ? 'loaded' : 'created'} successfully!
    </p>}
        
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