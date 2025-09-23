import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { auditService } from '~/services/audit.service';
import { ValidationAuditEntry, AuditAction, AuditResult } from '~/types';
import styles from './user-audit.module.css';

interface UserAuditViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAuditViewer = ({ isOpen, onClose }: UserAuditViewerProps) => {
  const { user } = useContext(AuthContext);
  const [auditEntries, setAuditEntries] = useState<ValidationAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
  const [filterResult, setFilterResult] = useState<AuditResult | 'all'>('all');
  const [dateRange, setDateRange] = useState<'1d' | '7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    if (isOpen && user) {
      loadUserAuditTrail();
    }
  }, [isOpen, user, dateRange]);

  const loadUserAuditTrail = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    try {
      // Calculate date range
      let startDate: string | undefined;
      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('d', ''));
        const date = new Date();
        date.setDate(date.getDate() - days);
        startDate = date.toISOString();
      }

      // Get user-specific audit entries
      const entries = await auditService.getAuditEntriesForUser(user.uid, {
        startDate,
        limit: 500
      });

      setAuditEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = (): ValidationAuditEntry[] => {
    return auditEntries.filter(entry => {
      const actionMatch = filterAction === 'all' || entry.action === filterAction;
      const resultMatch = filterResult === 'all' || entry.result === filterResult;
      return actionMatch && resultMatch;
    });
  };

  const getActionIcon = (action: AuditAction): string => {
    switch (action) {
      // User & Session Management
      case 'user-login': return '🔑';
      case 'user-logout': return '🚪';
      
      // Case Management
      case 'case-create': return '📂';
      case 'case-rename': return '✏️';
      case 'case-delete': return '🗑️';
      
      // Confirmation Workflow
      case 'case-export': return '📤';
      case 'case-import': return '📥';
      case 'confirmation-create': return '✅';
      case 'confirmation-export': return '📤';
      case 'confirmation-import': return '📥';
      
      // File Operations
      case 'file-upload': return '⬆️';
      case 'file-delete': return '🗑️';
      case 'file-access': return '👁️';
      
      // Annotation Operations
      case 'annotation-create': return '✨';
      case 'annotation-edit': return '✏️';
      case 'annotation-delete': return '❌';
      
      // Document Generation
      case 'pdf-generate': return '📄';
      
      // Security & Monitoring
      case 'security-violation': return '🚨';
      
      // Legacy Actions
      case 'export': return '📤';
      case 'import': return '📥';
      case 'confirm': return '✓';
      
      default: return '📄';
    }
  };

  const getStatusIcon = (result: AuditResult): string => {
    switch (result) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'warning': return '⚠️';
      case 'blocked': return '🛑';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get summary statistics
  const totalEntries = auditEntries.length;
  const successfulEntries = auditEntries.filter(e => e.result === 'success').length;
  const failedEntries = auditEntries.filter(e => e.result === 'failure').length;
  const securityIncidents = auditEntries.filter(e => 
    e.action === 'security-violation'
  ).length;
  const loginSessions = auditEntries.filter(e => e.action === 'user-login').length;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>My Audit Trail</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading your audit trail...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Error: {error}</p>
              <button onClick={loadUserAuditTrail} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Section */}
              <div className={styles.summary}>
                <h3>Activity Summary ({dateRange === 'all' ? 'All Time' : `Last ${dateRange}`})</h3>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Total Activities:</span>
                    <span className={styles.value}>{totalEntries}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Successful:</span>
                    <span className={styles.value}>{successfulEntries}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Failed:</span>
                    <span className={styles.value}>{failedEntries}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Login Sessions:</span>
                    <span className={styles.value}>{loginSessions}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Security Incidents:</span>
                    <span className={`${styles.value} ${securityIncidents > 0 ? styles.warning : ''}`}>
                      {securityIncidents}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className={styles.filters}>
                <div className={styles.filterGroup}>
                  <label htmlFor="dateRange">Time Period:</label>
                  <select 
                    id="dateRange"
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value as '1d' | '7d' | '30d' | 'all')}
                    className={styles.filterSelect}
                  >
                    <option value="1d">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="actionFilter">Activity Type:</label>
                  <select 
                    id="actionFilter"
                    value={filterAction} 
                    onChange={(e) => setFilterAction(e.target.value as AuditAction | 'all')}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Activities</option>
                    <optgroup label="User Sessions">
                      <option value="user-login">Login</option>
                      <option value="user-logout">Logout</option>
                    </optgroup>
                    <optgroup label="Case Management">
                      <option value="case-create">Case Create</option>
                      <option value="case-rename">Case Rename</option>
                      <option value="case-delete">Case Delete</option>
                    </optgroup>
                    <optgroup label="File Operations">
                      <option value="file-upload">File Upload</option>
                      <option value="file-access">File Access</option>
                      <option value="file-delete">File Delete</option>
                    </optgroup>
                    <optgroup label="Annotations">
                      <option value="annotation-create">Annotation Create</option>
                      <option value="annotation-edit">Annotation Edit</option>
                      <option value="annotation-delete">Annotation Delete</option>
                    </optgroup>
                    <optgroup label="Confirmation Workflow">
                      <option value="case-export">Case Export</option>
                      <option value="case-import">Case Import</option>
                      <option value="confirmation-create">Confirmation Create</option>
                      <option value="confirmation-export">Confirmation Export</option>
                      <option value="confirmation-import">Confirmation Import</option>
                    </optgroup>
                    <optgroup label="Documents">
                      <option value="pdf-generate">PDF Generate</option>
                    </optgroup>
                    <optgroup label="Security">
                      <option value="security-violation">Security Violation</option>
                    </optgroup>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="resultFilter">Result:</label>
                  <select 
                    id="resultFilter"
                    value={filterResult} 
                    onChange={(e) => setFilterResult(e.target.value as AuditResult | 'all')}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Results</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="warning">Warning</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Entries List */}
              <div className={styles.entriesList}>
                <h3>Activity Log ({getFilteredEntries().length} entries)</h3>
                {getFilteredEntries().length === 0 ? (
                  <div className={styles.noEntries}>
                    <p>No activities match the current filters.</p>
                  </div>
                ) : (
                  getFilteredEntries().map((entry, index) => (
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
                            {entry.details.sessionDetails.ipAddress && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>IP Address:</span>
                                <span className={styles.detailValue}>{entry.details.sessionDetails.ipAddress}</span>
                              </div>
                            )}
                            {entry.details.sessionDetails.location && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Location:</span>
                                <span className={styles.detailValue}>{entry.details.sessionDetails.location}</span>
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
                                  {(entry.details.fileDetails.fileSize / 1024 / 1024).toFixed(2)} MB
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {auditEntries.length === 0 && !loading && !error && (
            <div className={styles.noData}>
              <p>No audit trail available. Your activities will appear here as you use Striae.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};