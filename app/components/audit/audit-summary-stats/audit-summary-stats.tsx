import styles from '../user-audit.module.css';

interface AuditSummaryStatsProps {
  totalEntries: number;
  successfulEntries: number;
  failedEntries: number;
  securityIncidents: number;
  loginSessions: number;
}

export const AuditSummaryStats = ({
  totalEntries,
  successfulEntries,
  failedEntries,
  securityIncidents,
  loginSessions
}: AuditSummaryStatsProps) => {
  return (
    <div className={styles.summaryStats}>
      <h3>Activity Summary</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{totalEntries}</span>
          <span className={styles.statLabel}>Total Activities</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statNumber} ${styles.success}`}>{successfulEntries}</span>
          <span className={styles.statLabel}>Successful</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statNumber} ${styles.failure}`}>{failedEntries}</span>
          <span className={styles.statLabel}>Failed</span>
        </div>
        {securityIncidents > 0 && (
          <div className={styles.statItem}>
            <span className={`${styles.statNumber} ${styles.security}`}>{securityIncidents}</span>
            <span className={styles.statLabel}>Security Incidents</span>
          </div>
        )}
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{loginSessions}</span>
          <span className={styles.statLabel}>Login Sessions</span>
        </div>
      </div>
    </div>
  );
};