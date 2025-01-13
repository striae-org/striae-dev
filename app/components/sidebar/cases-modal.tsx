import { useState } from 'react';
import styles from './cases-modal.module.css';

interface CasesModalProps {
  cases: string[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseNum: string) => void;
  currentCase: string;
}

export const CasesModal = ({ cases, isOpen, onClose, onSelectCase, currentCase }: CasesModalProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const CASES_PER_PAGE = 5;

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
          {cases.length === 0 ? (
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