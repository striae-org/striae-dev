import { ValidationAuditEntry, AuditAction, AuditResult } from '~/types';
import { AuditEntry } from '../audit-entry/audit-entry';
import styles from '../user-audit.module.css';

interface AuditEntryListProps {
  entries: ValidationAuditEntry[];
  filterAction: AuditAction | 'all';
  filterResult: AuditResult | 'all';
}

export const AuditEntryList = ({ entries, filterAction, filterResult }: AuditEntryListProps) => {
  const getFilteredEntries = (): ValidationAuditEntry[] => {
    return entries.filter(entry => {
      const actionMatch = filterAction === 'all' || entry.action === filterAction;
      const resultMatch = filterResult === 'all' || entry.result === filterResult;
      return actionMatch && resultMatch;
    });
  };

  const filteredEntries = getFilteredEntries();

  return (
    <div className={styles.entriesList}>
      <h3>Activity Log ({filteredEntries.length} entries)</h3>
      {filteredEntries.length === 0 ? (
        <div className={styles.noEntries}>
          <p>No activities match the current filters.</p>
        </div>
      ) : (
        filteredEntries.map((entry, index) => (
          <AuditEntry key={index} entry={entry} index={index} />
        ))
      )}
    </div>
  );
};