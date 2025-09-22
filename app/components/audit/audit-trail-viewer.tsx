import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { auditService } from '~/services/audit.service';
import { AuditTrail, ValidationAuditEntry, AuditAction, AuditResult } from '~/types';
import styles from './audit-trail.module.css';

interface AuditTrailViewerProps {
  caseNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailViewer = ({ caseNumber, isOpen, onClose }: AuditTrailViewerProps) => {
  const { user } = useContext(AuthContext);
  const [auditTrail, setAuditTrail] = useState<AuditTrail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
  const [filterResult, setFilterResult] = useState<AuditResult | 'all'>('all');

  useEffect(() => {
    if (isOpen && caseNumber) {
      loadAuditTrail();
    }
  }, [isOpen, caseNumber]);

  const loadAuditTrail = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const trail = await auditService.getAuditTrail(caseNumber);
      setAuditTrail(trail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = (): ValidationAuditEntry[] => {
    if (!auditTrail) return [];

    return auditTrail.entries.filter(entry => {
      const actionMatch = filterAction === 'all' || entry.action === filterAction;
      const resultMatch = filterResult === 'all' || entry.result === filterResult;
      return actionMatch && resultMatch;
    });
  };

  const getStatusIcon = (result: AuditResult): string => {
    switch (result) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const getActionIcon = (action: AuditAction): string => {
    switch (action) {
      case 'export': return '📤';
      case 'import': return '📥';
      case 'confirm': return '✓';
      case 'validate': return '🔍';
      default: return '📄';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Audit Trail - Case {caseNumber}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading audit trail...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Error: {error}</p>
              <button onClick={loadAuditTrail} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {auditTrail && !loading && (
            <>
              {/* Summary Section */}
              <div className={styles.summary}>
                <h3>Audit Summary</h3>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Total Events:</span>
                    <span className={styles.value}>{auditTrail.summary.totalEvents}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Successful:</span>
                    <span className={styles.value}>{auditTrail.summary.successfulEvents}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Failed:</span>
                    <span className={styles.value}>{auditTrail.summary.failedEvents}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Warnings:</span>
                    <span className={styles.value}>{auditTrail.summary.warningEvents}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Compliance:</span>
                    <span className={`${styles.value} ${styles[auditTrail.summary.complianceStatus]}`}>
                      {auditTrail.summary.complianceStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Security Incidents:</span>
                    <span className={styles.value}>{auditTrail.summary.securityIncidents}</span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className={styles.filters}>
                <div className={styles.filterGroup}>
                  <label htmlFor="actionFilter">Action:</label>
                  <select 
                    id="actionFilter"
                    value={filterAction} 
                    onChange={(e) => setFilterAction(e.target.value as AuditAction | 'all')}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Actions</option>
                    <option value="export">Export</option>
                    <option value="import">Import</option>
                    <option value="confirm">Confirm</option>
                    <option value="validate">Validate</option>
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
                  </select>
                </div>
              </div>

              {/* Entries List */}
              <div className={styles.entriesList}>
                <h3>Audit Entries ({getFilteredEntries().length})</h3>
                {getFilteredEntries().map((entry, index) => (
                  <div key={index} className={`${styles.entry} ${styles[entry.result]}`}>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryIcons}>
                        <span className={styles.actionIcon}>{getActionIcon(entry.action)}</span>
                        <span className={styles.statusIcon}>{getStatusIcon(entry.result)}</span>
                      </div>
                      <div className={styles.entryTitle}>
                        <span className={styles.action}>{entry.action.toUpperCase()}</span>
                        <span className={styles.fileName}>{entry.details.fileName}</span>
                      </div>
                      <div className={styles.entryTimestamp}>
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>

                    <div className={styles.entryDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>User:</span>
                        <span className={styles.detailValue}>{entry.userEmail}</span>
                      </div>
                      
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>File Type:</span>
                        <span className={styles.detailValue}>{entry.details.fileType}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Checksum Valid:</span>
                        <span className={styles.detailValue}>
                          {entry.details.checksumValid ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>

                      {entry.details.workflowPhase && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Workflow Phase:</span>
                          <span className={styles.detailValue}>{entry.details.workflowPhase}</span>
                        </div>
                      )}

                      {entry.details.confirmationId && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Confirmation ID:</span>
                          <span className={styles.detailValue}>{entry.details.confirmationId}</span>
                        </div>
                      )}

                      {entry.details.performanceMetrics && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Processing Time:</span>
                          <span className={styles.detailValue}>
                            {formatDuration(entry.details.performanceMetrics.processingTimeMs)}
                          </span>
                        </div>
                      )}

                      {entry.details.validationErrors.length > 0 && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Errors:</span>
                          <div className={styles.errorList}>
                            {entry.details.validationErrors.map((error, i) => (
                              <div key={i} className={styles.errorItem}>{error}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.details.securityChecks && (
                        <div className={styles.securityChecks}>
                          <span className={styles.detailLabel}>Security Checks:</span>
                          <div className={styles.checksList}>
                            {Object.entries(entry.details.securityChecks).map(([check, passed]) => (
                              <div key={check} className={styles.checkItem}>
                                <span className={styles.checkIcon}>{passed ? '✅' : '❌'}</span>
                                <span className={styles.checkName}>{check.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {getFilteredEntries().length === 0 && (
                  <div className={styles.noEntries}>
                    <p>No audit entries match the current filters.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {!auditTrail && !loading && !error && (
            <div className={styles.noData}>
              <p>No audit trail available for this case.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};