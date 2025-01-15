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
  onCaseChange: (caseNumber: string) => void;  // Add this prop
}

export const Sidebar = ({ user, onImageSelect, onCaseChange }: SidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

      <CaseSidebar 
        user={user} 
        onImageSelect={onImageSelect}
        onCaseChange={onCaseChange} />
    </div>
  );
};