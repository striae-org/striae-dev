import { AuditAction, AuditResult } from '~/types';
import { ACTION_FILTER_GROUPS, DATE_RANGE_OPTIONS, RESULT_DISPLAY_NAMES } from '~/services/audit/audit-constants';
import styles from '../user-audit.module.css';

interface AuditFiltersProps {
  filterAction: AuditAction | 'all';
  filterResult: AuditResult | 'all';
  dateRange: '1d' | '7d' | '30d' | 'all' | 'custom';
  customStartDate: string;
  customEndDate: string;
  customStartDateInput: string;
  customEndDateInput: string;
  filterCaseNumber: string;
  caseNumberInput: string;
  caseNumber?: string; // Props case number (disables input)
  onFilterActionChange: (action: AuditAction | 'all') => void;
  onFilterResultChange: (result: AuditResult | 'all') => void;
  onDateRangeChange: (range: '1d' | '7d' | '30d' | 'all' | 'custom') => void;
  onCustomStartDateInputChange: (date: string) => void;
  onCustomEndDateInputChange: (date: string) => void;
  onCaseNumberInputChange: (caseNumber: string) => void;
  onApplyCaseFilter: () => void;
  onClearCaseFilter: () => void;
  onApplyCustomDateRange: () => void;
  onClearCustomDateRange: () => void;
}

export const AuditFilters = ({
  filterAction,
  filterResult,
  dateRange,
  customStartDate,
  customEndDate,
  customStartDateInput,
  customEndDateInput,
  filterCaseNumber,
  caseNumberInput,
  caseNumber,
  onFilterActionChange,
  onFilterResultChange,
  onDateRangeChange,
  onCustomStartDateInputChange,
  onCustomEndDateInputChange,
  onCaseNumberInputChange,
  onApplyCaseFilter,
  onClearCaseFilter,
  onApplyCustomDateRange,
  onClearCustomDateRange
}: AuditFiltersProps) => {
  return (
    <div className={styles.filters}>
      <h3>Filters</h3>
      
      {/* Date Range Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="dateRange">Time Period:</label>
        <select
          id="dateRange"
          value={dateRange}
          onChange={(e) => {
            const newRange = e.target.value as '1d' | '7d' | '30d' | 'all' | 'custom';
            onDateRangeChange(newRange);
            // When switching to custom, populate inputs with current applied values
            if (newRange === 'custom') {
              onCustomStartDateInputChange(customStartDate);
              onCustomEndDateInputChange(customEndDate);
            }
          }}
          className={styles.filterSelect}
        >
          {Object.entries(DATE_RANGE_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Custom Date Range Inputs */}
      {dateRange === 'custom' && (
        <div className={styles.customDateRange}>
          <div className={styles.customDateInputs}>
            <div className={styles.filterGroup}>
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                value={customStartDateInput}
                onChange={(e) => onCustomStartDateInputChange(e.target.value)}
                className={styles.filterInput}
                max={customEndDateInput || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={customEndDateInput}
                onChange={(e) => onCustomEndDateInputChange(e.target.value)}
                className={styles.filterInput}
                min={customStartDateInput}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className={styles.dateRangeButtons}>
              {(customStartDateInput || customEndDateInput) && (
                <button
                  type="button"
                  onClick={onApplyCustomDateRange}
                  className={styles.filterButton}
                  title="Apply custom date range"
                >
                  Apply Dates
                </button>
              )}
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={onClearCustomDateRange}
                  className={styles.clearButton}
                  title="Clear custom date range"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
          {(customStartDate || customEndDate) && (
            <div className={styles.activeFilter}>
              <small>
                Custom range: 
                {customStartDate && <strong> from {new Date(customStartDate).toLocaleDateString()}</strong>}
                {customEndDate && <strong> to {new Date(customEndDate).toLocaleDateString()}</strong>}
              </small>
            </div>
          )}
        </div>
      )}

      {/* Case Number Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="caseFilter">Case Number:</label>
        <div className={styles.inputWithButton}>
          <input
            type="text"
            id="caseFilter"
            value={caseNumberInput}
            onChange={(e) => onCaseNumberInputChange(e.target.value)}
            className={styles.filterInput}
            placeholder="Enter case number..."
            disabled={!!caseNumber} // Disable if already viewing a specific case
            title={caseNumber ? "Case filter disabled - viewing specific case" : "Enter complete case number and click Filter"}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && caseNumberInput.trim() && !caseNumber) {
                onApplyCaseFilter();
              }
            }}
          />
          {!caseNumber && (
            <div className={styles.caseFilterButtons}>
              {caseNumberInput.trim() && (
                <button
                  type="button"
                  onClick={onApplyCaseFilter}
                  className={styles.filterButton}
                  title="Apply case filter"
                >
                  Filter
                </button>
              )}
              {filterCaseNumber && (
                <button
                  type="button"
                  onClick={onClearCaseFilter}
                  className={styles.clearButton}
                  title="Clear case filter"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
        {filterCaseNumber && !caseNumber && (
          <div className={styles.activeFilter}>
            <small>Filtering by case: <strong>{filterCaseNumber}</strong></small>
          </div>
        )}
      </div>

      {/* Activity Type Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="actionFilter">Activity Type:</label>
        <select 
          id="actionFilter"
          value={filterAction} 
          onChange={(e) => onFilterActionChange(e.target.value as AuditAction | 'all')}
          className={styles.filterSelect}
        >
          <option value="all">All Activities</option>
          {Object.entries(ACTION_FILTER_GROUPS).map(([groupName, actions]) => (
            <optgroup key={groupName} label={groupName}>
              {actions.map(action => (
                <option key={action} value={action}>
                  {action.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Result Filter */}
      <div className={styles.filterGroup}>
        <label htmlFor="resultFilter">Result:</label>
        <select 
          id="resultFilter"
          value={filterResult} 
          onChange={(e) => onFilterResultChange(e.target.value as AuditResult | 'all')}
          className={styles.filterSelect}
        >
          <option value="all">All Results</option>
          {Object.entries(RESULT_DISPLAY_NAMES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};