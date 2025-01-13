import { User } from 'firebase/auth';
import { useState } from 'react';
import styles from './sidebar.module.css';
import { ManageProfile } from '../user/manage-profile';
import { SignOut } from '../actions/signout';
import { CaseSidebar } from './case-sidebar';

interface SidebarProps {
  user: User;
}

export const Sidebar = ({ user }: SidebarProps) => {
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

      <CaseSidebar user={user} />
    </div>
  );
};