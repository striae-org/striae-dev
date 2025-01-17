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
  imageLoaded?: boolean;
  currentCase?: string;
}

export const Sidebar = ({ user, onImageSelect, onCaseChange, imageLoaded, currentCase }: SidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const handleReturn = () => {
    setShowNotes(false);
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
          currentCase={currentCase || ''}
          onReturn={handleReturn}
        />
      ) : (
        <CaseSidebar 
          user={user} 
          onImageSelect={onImageSelect}
          onCaseChange={onCaseChange}
        />
      )}

      <div className={styles.sidebarToggle}>
        <button
          onClick={() => setShowNotes(true)}
          disabled={!imageLoaded}
          className={styles.toggleButton}
        >
          Image Notes
        </button>
      </div>
      
    </div>
  );
};