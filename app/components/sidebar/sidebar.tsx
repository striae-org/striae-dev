import { User } from 'firebase/auth';
import { useState } from 'react';
import styles from './sidebar.module.css';
import { ManageProfile } from '../user/manage-profile';
import { SignOut } from '../actions/signout';
import { CaseSidebar } from './case-sidebar';
import { NotesSidebar } from './notes-sidebar';

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface SidebarProps {
  user: User;
  onImageSelect: (file: FileData) => void;
  onCaseChange: (caseNumber: string) => void;
  currentCase?: string;
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
}

export const Sidebar = ({ 
  user, 
  onImageSelect, 
  onCaseChange, 
  currentCase = '', 
  imageLoaded,
  setImageLoaded
}: SidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  // Preserve case management state
  const [files, setFiles] = useState<FileData[]>([]);
  const [caseNumber, setCaseNumber] = useState('');
  const [error, setError] = useState('');
  const [successAction, setSuccessAction] = useState<'loaded' | 'created' | 'deleted' | null>(null);

  const handleReturn = () => {
    setShowNotes(false);
    // Don't reset other state
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

      {showNotes ? (
        <NotesSidebar 
          currentCase={currentCase}
          onReturn={handleReturn}
        />
      ) : (
        <CaseSidebar 
          user={user} 
          onImageSelect={onImageSelect}
          onCaseChange={onCaseChange}
          currentCase={currentCase}
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
        />
      )}
    </div>
  );
};