import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { auditService } from '~/services/audit.service';
import { auditExportService } from '~/services/audit-export.service';
import { AuditTrail, ValidationAuditEntry, AuditAction, AuditResult, WorkflowPhase } from '~/types';
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
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    try {
      // Get entries for this user and case
      const entries = await auditService.getAuditEntriesForUser(user.uid, {
        caseNumber,
        limit: 1000 // Get comprehensive audit trail
      });

      if (entries.length > 0) {
        // Create audit trail structure from entries
        const trail: AuditTrail = {
          caseNumber,
          workflowId: `workflow-${caseNumber}-${user.uid}`,
          entries,
          summary: {
            totalEvents: entries.length,
            successfulEvents: entries.filter(e => e.result === 'success').length,
            failedEvents: entries.filter(e => e.result === 'failure').length,
            warningEvents: entries.filter(e => e.result === 'warning').length,
            workflowPhases: [...new Set(entries.map(e => e.details.workflowPhase).filter(Boolean))] as WorkflowPhase[],
            participatingUsers: [...new Set(entries.map(e => e.userId))],
            startTimestamp: entries[entries.length - 1]?.timestamp || new Date().toISOString(),
            endTimestamp: entries[0]?.timestamp || new Date().toISOString(),
            complianceStatus: entries.every(e => 
              e.result === 'success' || e.result === 'warning'
            ) ? 'compliant' : 'non-compliant',
            securityIncidents: entries.filter(e => 
              e.details.securityChecks && 
              Object.values(e.details.securityChecks).some(check => !check)
            ).length
          }
        };
        setAuditTrail(trail);
      } else {
        setAuditTrail(null);
      }
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
      // Legacy confirmation workflow actions
      case 'export': return '📤';
      case 'import': return '📥';
      case 'confirm': return '✓';
      
      // Case Management Actions
      case 'case-create': return '📂';
      case 'case-rename': return '✏️';
      case 'case-delete': return '🗑️';
      
      // Confirmation Workflow Actions  
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
      
      // User & Session Management
      case 'user-login': return '🔑';
      case 'user-logout': return '🚪';
      case 'user-profile-update': return '👤';
      case 'user-password-reset': return '🔒';
      
      // Document Generation
      case 'pdf-generate': return '📄';
      
      // Security & Monitoring
      case 'security-violation': return '🚨';
      
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

  // Export functions
  const handleExportCSV = () => {
    if (!auditTrail) return;
    
    const filename = auditExportService.generateFilename('case', caseNumber, 'csv');
    const filteredEntries = getFilteredEntries();
    
    if (filteredEntries.length === auditTrail.entries.length) {
      // Export full audit trail with summary
      auditExportService.exportAuditTrailToCSV(auditTrail, filename);
    } else {
      // Export only filtered entries
      auditExportService.exportToCSV(filteredEntries, filename);
    }
  };

  const handleExportJSON = () => {
    if (!auditTrail) return;
    
    const filename = auditExportService.generateFilename('case', caseNumber, 'csv'); // Will be converted to .json
    const filteredEntries = getFilteredEntries();
    
    if (filteredEntries.length === auditTrail.entries.length) {
      // Export full audit trail
      auditExportService.exportAuditTrailToJSON(auditTrail, filename);
    } else {
      // Export only filtered entries
      auditExportService.exportToJSON(filteredEntries, filename);
    }
  };

  const handleGenerateReport = () => {
    if (!auditTrail) return;
    
    const reportText = auditExportService.generateReportSummary(auditTrail);
    const filename = auditExportService.generateFilename('case', caseNumber, 'csv').replace('.csv', '-report.txt');
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Audit Trail - Case {caseNumber}</h2>
          <div className={styles.headerActions}>
            {auditTrail && (
              <div className={styles.exportButtons}>
                <button 
                  onClick={handleExportCSV}
                  className={styles.exportButton}
                  title="Export to CSV for Excel analysis"
                >
                  📊 CSV
                </button>
                <button 
                  onClick={handleExportJSON}
                  className={styles.exportButton}
                  title="Export to JSON for technical analysis"
                >
                  📄 JSON
                </button>
                <button 
                  onClick={handleGenerateReport}
                  className={styles.exportButton}
                  title="Generate summary report"
                >
                  📋 Report
                </button>
              </div>
            )}
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
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
                    <optgroup label="User & Session">
                      <option value="user-login">User Login</option>
                      <option value="user-logout">User Logout</option>
                    </optgroup>
                    <optgroup label="Document Generation">
                      <option value="pdf-generate">PDF Generate</option>
                    </optgroup>
                    <optgroup label="Confirmation Workflow">
                      <option value="case-export">Case Export</option>
                      <option value="case-import">Case Import</option>
                      <option value="confirmation-create">Confirmation Create</option>
                      <option value="confirmation-export">Confirmation Export</option>
                      <option value="confirmation-import">Confirmation Import</option>
                    </optgroup>
                    <optgroup label="Security">
                      <option value="security-violation">Security Violation</option>
                    </optgroup>
                    <optgroup label="Legacy">
                      <option value="export">Export</option>
                      <option value="import">Import</option>
                      <option value="confirm">Confirm</option>
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
                    <option value="pending">Pending</option>
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

                      {/* Annotation Details */}
                      {entry.details.annotationDetails && (
                        <div className={styles.annotationDetails}>
                          <span className={styles.detailLabel}>Annotation Details:</span>
                          <div className={styles.annotationInfo}>
                            {entry.details.annotationDetails.annotationType && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Type:</span>
                                <span className={styles.detailValue}>{entry.details.annotationDetails.annotationType}</span>
                              </div>
                            )}
                            {entry.details.annotationDetails.tool && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Tool:</span>
                                <span className={styles.detailValue}>{entry.details.annotationDetails.tool}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* File Operation Details */}
                      {(entry.action === 'file-upload' || entry.action === 'file-delete' || entry.action === 'file-access') && (
                        <div className={styles.fileDetails}>
                          {/* File ID */}
                          {entry.details.fileDetails?.fileId && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>File ID:</span>
                              <span className={styles.detailValue}>{entry.details.fileDetails.fileId}</span>
                            </div>
                          )}
                          
                          {/* Original Filename */}
                          {entry.details.fileDetails?.originalFileName && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Original Filename:</span>
                              <span className={styles.detailValue}>{entry.details.fileDetails.originalFileName}</span>
                            </div>
                          )}
                          
                          {/* File Size */}
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>File Size:</span>
                            <span className={styles.detailValue}>
                              {entry.details.fileDetails?.fileSize 
                                ? `${(entry.details.fileDetails.fileSize / 1024 / 1024).toFixed(2)} MB`
                                : entry.details.performanceMetrics?.fileSizeBytes 
                                  ? `${(entry.details.performanceMetrics.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`
                                  : 'N/A'}
                            </span>
                          </div>
                          
                          {/* MIME Type */}
                          {entry.details.fileDetails?.mimeType && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>MIME Type:</span>
                              <span className={styles.detailValue}>{entry.details.fileDetails.mimeType}</span>
                            </div>
                          )}
                          
                          {/* Upload Method (for uploads) or Access Method (for access) */}
                          {entry.details.fileDetails?.uploadMethod && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                {entry.action === 'file-access' ? 'Access Method' : 'Upload Method'}:
                              </span>
                              <span className={styles.detailValue}>{entry.details.fileDetails.uploadMethod}</span>
                            </div>
                          )}
                          
                          {/* Delete Reason (for deletions) */}
                          {entry.details.fileDetails?.deleteReason && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Delete Reason:</span>
                              <span className={styles.detailValue}>{entry.details.fileDetails.deleteReason}</span>
                            </div>
                          )}
                          
                          {/* Source Location (for access events) */}
                          {entry.details.fileDetails?.sourceLocation && entry.action === 'file-access' && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Access Source:</span>
                              <span className={styles.detailValue}>{entry.details.fileDetails.sourceLocation}</span>
                            </div>
                          )}
                          
                          {/* Virus Scan Result (for uploads) */}
                          {entry.details.fileDetails?.virusScanResult && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Virus Scan:</span>
                              <span className={styles.detailValue}>
                                {entry.details.fileDetails.virusScanResult === 'clean' ? '✅ Clean' :
                                 entry.details.fileDetails.virusScanResult === 'infected' ? '🦠 Infected' :
                                 entry.details.fileDetails.virusScanResult === 'quarantined' ? '🔒 Quarantined' :
                                 '❌ Failed'}
                              </span>
                            </div>
                          )}
                          
                          {/* Thumbnail Generated (for image uploads) */}
                          {entry.details.fileDetails?.thumbnailGenerated !== undefined && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Thumbnail:</span>
                              <span className={styles.detailValue}>
                                {entry.details.fileDetails.thumbnailGenerated ? '✅ Generated' : '❌ Not Generated'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Session Details */}
                      {(entry.action === 'user-login' || entry.action === 'user-logout') && entry.details.sessionDetails && (
                        <div className={styles.sessionDetails}>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Session ID:</span>
                            <span className={styles.detailValue}>{entry.details.sessionDetails.sessionId}</span>
                          </div>
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
                        </div>
                      )}

                      {/* Security Incident Details */}
                      {entry.action === 'security-violation' && entry.details.securityDetails && (
                        <div className={styles.securityDetails}>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Severity:</span>
                            <span className={`${styles.detailValue} ${styles.severity} ${styles[entry.details.securityDetails.severity || 'low']}`}>
                              {(entry.details.securityDetails.severity || 'low').toUpperCase()}
                            </span>
                          </div>
                          {entry.details.securityDetails.incidentType && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Incident Type:</span>
                              <span className={styles.detailValue}>{entry.details.securityDetails.incidentType}</span>
                            </div>
                          )}
                          {entry.details.securityDetails.sourceIp && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Source IP:</span>
                              <span className={styles.detailValue}>{entry.details.securityDetails.sourceIp}</span>
                            </div>
                          )}
                          {entry.details.securityDetails.attackVector && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Attack Vector:</span>
                              <span className={styles.detailValue}>{entry.details.securityDetails.attackVector}</span>
                            </div>
                          )}
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