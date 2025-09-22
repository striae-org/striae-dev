import styles from '../case-import.module.css';

interface ProgressState {
  stage: string;
  progress: number;
  details?: string;
}

interface ProgressSectionProps {
  importProgress: ProgressState | null;
}

export const ProgressSection = ({ importProgress }: ProgressSectionProps) => {
  if (!importProgress) return null;

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressText}>
        {importProgress.stage}
        {importProgress.details && (
          <span className={styles.progressDetails}> - {importProgress.details}</span>
        )}
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${importProgress.progress}%` }}
        />
      </div>
      <div className={styles.progressPercent}>
        {Math.round(importProgress.progress)}%
      </div>
    </div>
  );
};