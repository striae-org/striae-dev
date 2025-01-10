import { User } from 'firebase/auth';
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
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const createCase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${WORKER_URL}/${user.uid}/${caseNumber}/data.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
        },
        body: JSON.stringify({
          createdAt: new Date().toISOString(),
          caseNumber
        })
      });

      if (!response.ok) throw new Error('Failed to create case');
      // Refresh file list after creating case
      const filesResponse = await loader({ user, context, caseNumber });
      const data = await filesResponse.json();
      setFiles(data.files);
    } catch (err) {
      setError('Failed to create case');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.userInfo}>
        <h3>{user.displayName?.split(' ')[0] || 'User'}</h3>
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
            onClick={createCase}
            disabled={isLoading || !caseNumber}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        
        <div className={styles.filesSection}>
          <h4>Files</h4>
          {!caseNumber ? (
            <p className={styles.emptyState}>Enter a case number to view files</p>
          ) : isLoading ? (
            <p className={styles.loading}>Loading files...</p>
          ) : files.length === 0 ? (
            <p className={styles.emptyState}>No files found for this case</p>
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