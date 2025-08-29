/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
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
  const year = new Date().getFullYear();

  // Handle escape key to close modal
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFooterModalOpen) {
          setIsFooterModalOpen(false);
        }
      };

      if (isFooterModalOpen) {
        document.addEventListener('keydown', handleEscape);
      }
  
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isFooterModalOpen]);

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
          About & Support
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
                <a href="https://help.striae.org" target="_blank" rel="noopener noreferrer" className={styles.footerModalLink}>User&apos;s Guide</a>
                <a href="/support" target="_blank" rel="noopener noreferrer" className={styles.footerModalLink}>Need Help?</a>
                <a href="/bugs" target="_blank" rel="noopener noreferrer" className={styles.footerModalLink}>Report a Bug</a>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.footerModalLink}>Privacy Policy</a>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.footerModalLink}>Terms of Service</a>
                <a href="/security" target="_blank" rel="noopener noreferrer" className={styles.footerModalLink}>Security Policy</a>
              </div>
              <div className={styles.footerModalCopyright}>
                Striae © {year}. All rights reserved.
              </div>
              <div className={styles.footerModalCopyrightLink}>
                Designed and developed by <Link to="https://stephenjlu.com" target="_blank" rel="noopener noreferrer">Stephen J. Lu</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
