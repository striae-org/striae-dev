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
  onAnnotationRefresh
}: SidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);

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
          onReturn={() => setShowNotes(false)}
          user={user}
          imageId={imageId || ''}
          onAnnotationRefresh={onAnnotationRefresh}
        />
      ) : (
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
        />
      )}

      {/* Footer Button */}
      <button 
        onClick={() => setIsFooterModalOpen(true)}
        className={styles.footerButton}
      >
        About & Links
      </button>

      {/* Footer Modal */}
      {isFooterModalOpen && (
        <div className={styles.footerModalOverlay} onClick={() => setIsFooterModalOpen(false)}>
          <div className={styles.footerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.footerModalHeader}>
              <h2 className={styles.footerModalTitle}>About Striae</h2>
              <button 
                onClick={() => setIsFooterModalOpen(false)}
                className={styles.footerModalClose}
              >
                ×
              </button>
            </div>
            <div className={styles.footerModalContent}>
              <div className={styles.footerModalLinks}>
                <a href="/privacy" className={styles.footerModalLink}>Privacy Policy</a>
                <a href="/terms" className={styles.footerModalLink}>Terms of Service</a>
                <a href="/security" className={styles.footerModalLink}>Security Policy</a>
                <a href="/support" className={styles.footerModalLink}>Support</a>
                <a href="/bugs" className={styles.footerModalLink}>Report a Bug</a>
                <a href="/" className={styles.footerModalLink}>Home</a>
              </div>
              <div className={styles.footerModalCopyright}>
                © 2025 Striae. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};