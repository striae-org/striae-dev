import { User } from 'firebase/auth';
import { useState } from 'react';
import styles from './sidebar.module.css';
import { ManageProfile } from '../user/manage-profile';
import { SignOut } from '../actions/signout';
import { CaseSidebar } from './case-sidebar';
import { NotesSidebar } from './notes-sidebar';
import { CaseImport } from './case-import';
import { FileData } from '~/types';
import { ImportResult } from '../actions/case-review';

interface SidebarProps {
  user: User;
  onImageSelect: (file: FileData) => void;
  imageId?: string;
  onCaseChange: (caseNumber: string) => void;
  currentCase: string;
  setCurrentCase: (caseNumber: string) => void;
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
  caseNumber: string;
  setCaseNumber: (caseNumber: string) => void;
  error: string;
  setError: (error: string) => void;
  successAction: 'loaded' | 'created' | 'deleted' | null;
  setSuccessAction: (action: 'loaded' | 'created' | 'deleted' | null) => void;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  onAnnotationRefresh?: () => void;
  isReadOnly?: boolean;
}

export const Sidebar = ({ 
  user, 
  onImageSelect,
  imageId, 
  onCaseChange,
  currentCase,
  setCurrentCase,
  imageLoaded,
  setImageLoaded,
  files,
  setFiles,
  caseNumber,
  setCaseNumber,
  error,
  setError,
  successAction,
  setSuccessAction,
  showNotes,
  setShowNotes,
  onAnnotationRefresh,
  isReadOnly = false
}: SidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportComplete = (result: ImportResult) => {
    if (result.success) {
      // Load the imported case automatically
      onCaseChange(result.caseNumber);
      setCurrentCase(result.caseNumber);
      setCaseNumber(result.caseNumber);
      setSuccessAction('loaded');
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
      <CaseImport 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
      {showNotes ? (
        <NotesSidebar 
          currentCase={currentCase}
          onReturn={() => setShowNotes(false)}
          user={user}
          imageId={imageId || ''}
          onAnnotationRefresh={onAnnotationRefresh}
        />
      ) : (
        <>
          <CaseSidebar 
            user={user} 
            onImageSelect={onImageSelect}
            onCaseChange={onCaseChange}
            currentCase={currentCase}
            setCurrentCase={setCurrentCase}
            imageLoaded={imageLoaded}
            setImageLoaded={setImageLoaded}
            files={files}
            setFiles={setFiles}
            caseNumber={caseNumber}
            setCaseNumber={setCaseNumber}
            error={error}
            setError={setError}
            successAction={successAction}
            setSuccessAction={setSuccessAction}
            onNotesClick={() => setShowNotes(true)}
            isReadOnly={isReadOnly}
          />
          <div className={styles.importSection}>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className={styles.importButton}
            >
              Import Case for Review
            </button>
          </div>
        </>
      )}
    </div>
  );
};