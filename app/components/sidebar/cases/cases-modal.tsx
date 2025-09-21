import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { listCases } from '~/components/actions/case-manage';
import styles from './cases-modal.module.css';

interface CasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseNum: string) => void;
  currentCase: string;
  user: User;
}

export const CasesModal = ({ isOpen, onClose, onSelectCase, currentCase, user }: CasesModalProps) => {
  const [cases, setCases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const CASES_PER_PAGE = 10;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError('');
      
      listCases(user)
        .then(fetchedCases => {
          setCases(fetchedCases);
        })
        .catch(err => {
          console.error('Failed to load cases:', err);
          setError('Failed to load cases');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user]);

  const paginatedCases = cases.slice(
    currentPage * CASES_PER_PAGE,
    (currentPage + 1) * CASES_PER_PAGE
  );

  const totalPages = Math.ceil(cases.length / CASES_PER_PAGE);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h2>All Cases</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </header>
        
        <div className={styles.modalContent}>
          {isLoading ? (
            <p className={styles.loading}>Loading cases...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : cases.length === 0 ? (
            <p className={styles.emptyState}>No cases found</p>
          ) : (
            <>
              <ul className={styles.casesList}>
                {paginatedCases.map((caseNum) => (
                  <li key={caseNum}>
                    <button
                      className={`${styles.caseItem} ${currentCase === caseNum ? styles.active : ''}`}
                      onClick={() => {
                        onSelectCase(caseNum);
                        onClose();
                      }}
                    >
                      {caseNum}
                    </button>
                  </li>
                ))}
              </ul>
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </button>
                  <span>{currentPage + 1} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};