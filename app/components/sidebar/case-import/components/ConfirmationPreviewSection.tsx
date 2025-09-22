import styles from '../case-import.module.css';

// Confirmation preview interface
export interface ConfirmationPreview {
  caseNumber: string;
  fullName: string;
  exportDate: string;
  totalConfirmations: number;
  confirmationIds: string[];
}

interface ConfirmationPreviewSectionProps {
  confirmationPreview: ConfirmationPreview | null;
  isLoadingPreview: boolean;
}

export const ConfirmationPreviewSection = ({ confirmationPreview, isLoadingPreview }: ConfirmationPreviewSectionProps) => {
  if (isLoadingPreview) {
    return (
      <div className={styles.previewSection}>
        <div className={styles.previewLoading}>
          Loading confirmation information...
        </div>
      </div>
    );
  }

  if (!confirmationPreview) return null;

  return (
    <div className={styles.previewSection}>
      <h3 className={styles.previewTitle}>Confirmation Data Information</h3>
      <div className={styles.previewGrid}>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Case Number:</span>
          <span className={styles.previewValue}>{confirmationPreview.caseNumber}</span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Exported by:</span>
          <span className={styles.previewValue}>{confirmationPreview.fullName}</span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Export Date:</span>
          <span className={styles.previewValue}>
            {new Date(confirmationPreview.exportDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Total Confirmations:</span>
          <span className={styles.previewValue}>{confirmationPreview.totalConfirmations}</span>
        </div>
        <div className={styles.previewItem}>
          <span className={styles.previewLabel}>Confirmation IDs:</span>
          <span className={styles.previewValue}>
            {confirmationPreview.confirmationIds.length > 0 
              ? confirmationPreview.confirmationIds.join(', ')
              : 'None'
            }
          </span>
        </div>
      </div>
    </div>
  );
};