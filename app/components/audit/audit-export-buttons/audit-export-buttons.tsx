import styles from '../user-audit.module.css';

interface AuditExportButtonsProps {
  hasEntries: boolean;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onGenerateReport: () => void;
}

export const AuditExportButtons = ({
  hasEntries,
  onExportCSV,
  onExportJSON,
  onGenerateReport
}: AuditExportButtonsProps) => {
  if (!hasEntries) return null;

  return (
    <div className={styles.exportButtons}>
      <button 
        onClick={onExportCSV}
        className={styles.exportButton}
        title="Export to CSV for Excel analysis"
      >
        📊 CSV
      </button>
      <button 
        onClick={onExportJSON}
        className={styles.exportButton}
        title="Export to JSON for technical analysis"
      >
        📄 JSON
      </button>
      <button 
        onClick={onGenerateReport}
        className={styles.exportButton}
        title="Generate comprehensive audit report"
      >
        📋 Report
      </button>
    </div>
  );
};