import { User } from 'firebase/auth';
import { useState } from 'react';
import styles from './sidebar.module.css';
import { ManageProfile } from '../user/manage-profile';
import { SignOut } from '../actions/signout';
import { CaseSidebar } from './case-sidebar';

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface SidebarProps {
  user: User;
  onImageSelect: (file: FileData) => void;
  onToggleHide: (isHidden: boolean) => void;  
}

export const Sidebar = ({ user, onImageSelect, onToggleHide }: SidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleHideImage = () => {
    setIsHidden(true);
    onToggleHide(true);
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
        <button 
          onClick={handleHideImage}
          className={styles.toggleButton}
          disabled={isHidden}
        >
          {isHidden ? 'Canvas Cleared' : 'Clear Canvas'}
        </button>
      </div>

      <ManageProfile 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <CaseSidebar user={user} onImageSelect={onImageSelect} />
    </div>
  );
};