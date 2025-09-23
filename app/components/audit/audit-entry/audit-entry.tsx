import { ValidationAuditEntry } from '~/types';
import { getActionIcon, getStatusIcon, formatTimestamp, formatFileSize } from '~/services/audit/audit-utils';
import styles from '../user-audit.module.css';

interface AuditEntryProps {
  entry: ValidationAuditEntry;
  index: number;
}

export const AuditEntry = ({ entry, index }: AuditEntryProps) => {
  return (
    <div key={index} className={`${styles.entry} ${styles[entry.result]}`}>
      <div className={styles.entryHeader}>
        <div className={styles.entryIcons}>
          <span className={styles.actionIcon}>{getActionIcon(entry.action)}</span>
          <span className={styles.statusIcon}>{getStatusIcon(entry.result)}</span>
        </div>
        <div className={styles.entryTitle}>
          <span className={styles.action}>{entry.action.toUpperCase().replace(/-/g, ' ')}</span>
          <span className={styles.fileName}>{entry.details.fileName}</span>
        </div>
        <div className={styles.entryTimestamp}>
          {formatTimestamp(entry.timestamp)}
        </div>
      </div>

      {/* Basic Details */}
      <div className={styles.entryDetails}>
        {entry.details.caseNumber && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Case:</span>
            <span className={styles.detailValue}>{entry.details.caseNumber}</span>
          </div>
        )}

        {entry.result === 'failure' && entry.details.validationErrors.length > 0 && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Error:</span>
            <span className={styles.detailValue}>{entry.details.validationErrors[0]}</span>
          </div>
        )}

        {/* Session Details for Login/Logout */}
        {(entry.action === 'user-login' || entry.action === 'user-logout') && entry.details.sessionDetails && (
          <>
            {entry.details.sessionDetails.userAgent && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>User Agent:</span>
                <span className={styles.detailValue}>{entry.details.sessionDetails.userAgent}</span>
              </div>
            )}
          </>
        )}

        {/* Security Details */}
        {entry.action === 'security-violation' && entry.details.securityDetails && (
          <>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Severity:</span>
              <span className={`${styles.detailValue} ${styles.severity} ${styles[entry.details.securityDetails.severity || 'low']}`}>
                {(entry.details.securityDetails.severity || 'low').toUpperCase()}
              </span>
            </div>
            {entry.details.securityDetails.incidentType && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Type:</span>
                <span className={styles.detailValue}>{entry.details.securityDetails.incidentType}</span>
              </div>
            )}
          </>
        )}

        {/* File Operation Details */}
        {(entry.action === 'file-upload' || entry.action === 'file-delete' || entry.action === 'file-access') && entry.details.fileDetails && (
          <>
            {/* File ID */}
            {entry.details.fileDetails.fileId && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>File ID:</span>
                <span className={styles.detailValue}>{entry.details.fileDetails.fileId}</span>
              </div>
            )}
            
            {/* Original Filename */}
            {entry.details.fileDetails.originalFileName && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Original Filename:</span>
                <span className={styles.detailValue}>{entry.details.fileDetails.originalFileName}</span>
              </div>
            )}
            
            {/* File Size */}
            {entry.details.fileDetails.fileSize > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>File Size:</span>
                <span className={styles.detailValue}>
                  {formatFileSize(entry.details.fileDetails.fileSize)}
                </span>
              </div>
            )}
            
            {/* Access Method/Upload Method */}
            {entry.details.fileDetails.uploadMethod && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  {entry.action === 'file-access' ? 'Access Method' : 'Upload Method'}:
                </span>
                <span className={styles.detailValue}>{entry.details.fileDetails.uploadMethod}</span>
              </div>
            )}
            
            {/* Delete Reason */}
            {entry.details.fileDetails.deleteReason && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reason:</span>
                <span className={styles.detailValue}>{entry.details.fileDetails.deleteReason}</span>
              </div>
            )}
            
            {/* Access Source */}
            {entry.details.fileDetails.sourceLocation && entry.action === 'file-access' && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Access Source:</span>
                <span className={styles.detailValue}>{entry.details.fileDetails.sourceLocation}</span>
              </div>
            )}
          </>
        )}

        {/* Annotation Details */}
        {(entry.action === 'annotation-create' || entry.action === 'annotation-edit' || entry.action === 'annotation-delete') && entry.details.fileDetails && (
          <>
            {/* File ID */}
            {entry.details.fileDetails.fileId && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>File ID:</span>
                <span className={styles.detailValue}>{entry.details.fileDetails.fileId}</span>
              </div>
            )}
            
            {/* Original Filename */}
            {entry.details.fileDetails.originalFileName && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Original Filename:</span>
                <span className={styles.detailValue}>{entry.details.fileDetails.originalFileName}</span>
              </div>
            )}
            
            {/* Annotation Type */}
            {entry.details.annotationDetails?.annotationType && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Annotation Type:</span>
                <span className={styles.detailValue}>{entry.details.annotationDetails.annotationType}</span>
              </div>
            )}
            
            {/* Tool Used */}
            {entry.details.annotationDetails?.tool && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tool:</span>
                <span className={styles.detailValue}>{entry.details.annotationDetails.tool}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};