import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { auditService } from '~/services/audit.service';
import { auditExportService } from '~/services/audit-export.service';
import { ValidationAuditEntry, AuditAction, AuditResult, AuditTrail, UserData } from '~/types';
import { getUserData } from '~/utils/permissions';
import { getDateRangeDisplay, calculateDateRange } from '~/services/audit/audit-utils';
import { AuditFilters } from './audit-filters/audit-filters';
import { AuditEntryList } from './audit-entry-list/audit-entry-list';
import { AuditExportButtons } from './audit-export-buttons/audit-export-buttons';
import { AuditSummaryStats } from './audit-summary-stats/audit-summary-stats';
import styles from './user-audit.module.css';

interface UserAuditViewerProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string; // Optional: filter by specific case
  title?: string; // Optional: custom title
}

export const UserAuditViewer = ({ isOpen, onClose, caseNumber, title }: UserAuditViewerProps) => {
  const { user } = useContext(AuthContext);
  const [auditEntries, setAuditEntries] = useState<ValidationAuditEntry[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
  const [filterResult, setFilterResult] = useState<AuditResult | 'all'>('all');
  const [filterCaseNumber, setFilterCaseNumber] = useState<string>('');
  const [caseNumberInput, setCaseNumberInput] = useState<string>('');
  const [dateRange, setDateRange] = useState<'1d' | '7d' | '30d' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customStartDateInput, setCustomStartDateInput] = useState<string>('');
  const [customEndDateInput, setCustomEndDateInput] = useState<string>('');
  const [auditTrail, setAuditTrail] = useState<AuditTrail | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadAuditData();
      loadUserData();
    }
  }, [isOpen, user, dateRange, customStartDate, customEndDate, filterCaseNumber, caseNumber]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const data = await getUserData(user);
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadAuditData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    try {
      // Calculate date range
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (dateRange === 'custom') {
        if (customStartDate) {
          startDate = new Date(customStartDate + 'T00:00:00').toISOString();
        }
        if (customEndDate) {
          endDate = new Date(customEndDate + 'T23:59:59').toISOString();
        }
      } else if (dateRange !== 'all') {
        const range = calculateDateRange(dateRange);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      // Get audit entries (filtered by case if specified)
      const effectiveCaseNumber = caseNumber || (filterCaseNumber.trim() || undefined);
      const entries = await auditService.getAuditEntriesForUser(user.uid, {
        caseNumber: effectiveCaseNumber,
        startDate,
        endDate,
        limit: effectiveCaseNumber ? 1000 : 500 // More entries for case-specific view
      });

      setAuditEntries(entries);

      // If case-specific, create audit trail for enhanced export functionality
      if (effectiveCaseNumber && entries.length > 0) {
        const trail: AuditTrail = {
          caseNumber: effectiveCaseNumber,
          workflowId: `workflow-${effectiveCaseNumber}-${user.uid}`,
          entries,
          summary: {
            totalEvents: entries.length,
            successfulEvents: entries.filter(e => e.result === 'success').length,
            failedEvents: entries.filter(e => e.result === 'failure').length,
            warningEvents: entries.filter(e => e.result === 'warning').length,
            workflowPhases: [...new Set(entries
              .map(e => e.details.workflowPhase)
              .filter(Boolean))] as any[],
            participatingUsers: [...new Set(entries.map(e => e.userId))],
            startTimestamp: entries[entries.length - 1]?.timestamp || new Date().toISOString(),
            endTimestamp: entries[0]?.timestamp || new Date().toISOString(),
            complianceStatus: entries.some(e => e.result === 'failure') ? 'non-compliant' : 'compliant',
            securityIncidents: entries.filter(e => e.action === 'security-violation').length
          }
        };
        setAuditTrail(trail);
      } else {
        setAuditTrail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCaseFilter = () => {
    setFilterCaseNumber(caseNumberInput.trim());
  };

  const handleClearCaseFilter = () => {
    setCaseNumberInput('');
    setFilterCaseNumber('');
  };

  const handleApplyCustomDateRange = () => {
    setCustomStartDate(customStartDateInput);
    setCustomEndDate(customEndDateInput);
  };

  const handleClearCustomDateRange = () => {
    setCustomStartDateInput('');
    setCustomEndDateInput('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Export functions
  const handleExportCSV = async () => {
    if (!user) return;
    
    const effectiveCaseNumber = caseNumber || filterCaseNumber.trim();
    const identifier = effectiveCaseNumber || user.uid;
    const type = effectiveCaseNumber ? 'case' : 'user';
    const filename = auditExportService.generateFilename(type, identifier, 'csv');
    
    try {
      if (auditTrail && effectiveCaseNumber) {
        auditExportService.exportAuditTrailToCSV(auditTrail, filename);
      } else {
        auditExportService.exportToCSV(auditEntries, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export audit trail to CSV');
    }
  };

  const handleExportJSON = async () => {
    if (!user) return;
    
    const effectiveCaseNumber = caseNumber || filterCaseNumber.trim();
    const identifier = effectiveCaseNumber || user.uid;
    const type = effectiveCaseNumber ? 'case' : 'user';
    const filename = auditExportService.generateFilename(type, identifier, 'csv').replace('.csv', '.json');
    
    try {
      if (auditTrail && effectiveCaseNumber) {
        auditExportService.exportAuditTrailToJSON(auditTrail, filename);
      } else {
        auditExportService.exportToJSON(auditEntries, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export audit trail to JSON');
    }
  };

  const handleGenerateReport = async () => {
    if (!user) return;
    
    const effectiveCaseNumber = caseNumber || filterCaseNumber.trim();
    const identifier = effectiveCaseNumber || user.uid;
    const type = effectiveCaseNumber ? 'case' : 'user';
    const filename = `${type}-audit-report-${identifier}-${new Date().toISOString().split('T')[0]}.txt`;
    
    try {
      let reportContent: string;
      
      if (auditTrail && effectiveCaseNumber) {
        reportContent = auditExportService.generateReportSummary(auditTrail);
      } else {
        // Generate user-specific report
        const totalEntries = auditEntries.length;
        const successfulActions = auditEntries.filter(e => e.result === 'success').length;
        const failedActions = auditEntries.filter(e => e.result === 'failure').length;
        
        const actionCounts = auditEntries.reduce((acc, entry) => {
          acc[entry.action] = (acc[entry.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dateRange = auditEntries.length > 0 ? {
          earliest: new Date(Math.min(...auditEntries.map(e => new Date(e.timestamp).getTime()))),
          latest: new Date(Math.max(...auditEntries.map(e => new Date(e.timestamp).getTime())))
        } : null;

        reportContent = `${caseNumber ? 'CASE' : 'USER'} AUDIT REPORT
Generated: ${new Date().toISOString()}
${caseNumber ? `Case: ${caseNumber}` : `User: ${user.email}`}
${caseNumber ? '' : `User ID: ${user.uid}`}

=== SUMMARY ===
Total Actions: ${totalEntries}
Successful: ${successfulActions}
Failed: ${failedActions}
Success Rate: ${totalEntries > 0 ? ((successfulActions / totalEntries) * 100).toFixed(1) : 0}%

${dateRange ? `Date Range: ${dateRange.earliest.toLocaleDateString()} - ${dateRange.latest.toLocaleDateString()}` : 'No entries found'}

=== ACTION BREAKDOWN ===
${Object.entries(actionCounts)
  .sort(([,a], [,b]) => b - a)
  .map(([action, count]) => `${action}: ${count}`)
  .join('\n')}

=== RECENT ACTIVITIES ===
${auditEntries.slice(0, 10).map(entry => 
  `${new Date(entry.timestamp).toLocaleString()} | ${entry.action} | ${entry.result}${entry.details.caseNumber ? ` | Case: ${entry.details.caseNumber}` : ''}`
).join('\n')}

Generated by Striae Forensic Annotation System
`;
      }
      
      // Create and download the report file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Report generation failed:', error);
      setError('Failed to generate audit report');
    }
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
          <h2 className={styles.title}>
            {title || (caseNumber ? `Audit Trail - Case ${caseNumber}` : 'My Audit Trail')}
          </h2>
          <div className={styles.headerActions}>
            <AuditExportButtons
              hasEntries={auditEntries.length > 0}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              onGenerateReport={handleGenerateReport}
            />
            <button onClick={onClose} className={styles.closeButton}>×</button>
          </div>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading audit data...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <>
              <div className={styles.sidebar}>
                <AuditSummaryStats
                  totalEntries={totalEntries}
                  successfulEntries={successfulEntries}
                  failedEntries={failedEntries}
                  securityIncidents={securityIncidents}
                  loginSessions={loginSessions}
                />
                
                <AuditFilters
                  filterAction={filterAction}
                  filterResult={filterResult}
                  dateRange={dateRange}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  customStartDateInput={customStartDateInput}
                  customEndDateInput={customEndDateInput}
                  filterCaseNumber={filterCaseNumber}
                  caseNumberInput={caseNumberInput}
                  caseNumber={caseNumber}
                  onFilterActionChange={setFilterAction}
                  onFilterResultChange={setFilterResult}
                  onDateRangeChange={setDateRange}
                  onCustomStartDateInputChange={setCustomStartDateInput}
                  onCustomEndDateInputChange={setCustomEndDateInput}
                  onCaseNumberInputChange={setCaseNumberInput}
                  onApplyCaseFilter={handleApplyCaseFilter}
                  onClearCaseFilter={handleClearCaseFilter}
                  onApplyCustomDateRange={handleApplyCustomDateRange}
                  onClearCustomDateRange={handleClearCustomDateRange}
                />
              </div>

              <div className={styles.main}>
                <AuditEntryList
                  entries={auditEntries}
                  filterAction={filterAction}
                  filterResult={filterResult}
                />
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