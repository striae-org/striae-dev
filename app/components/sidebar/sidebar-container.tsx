import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { User } from 'firebase/auth';
import styles from './sidebar.module.css';

interface FileData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

interface SidebarContainerProps {
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

export const SidebarContainer: React.FC<SidebarContainerProps> = (props) => {
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Main Sidebar */}
      <Sidebar {...props} />
      
      {/* Footer Section */}
      <div className={styles.footerSection}>
        <button 
          onClick={() => setIsFooterModalOpen(true)}
          className={styles.footerSectionButton}
        >
          About & Links
        </button>
      </div>

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
