import { AuditAction, AuditResult } from '~/types';
import { ACTION_ICONS, STATUS_ICONS, DEFAULT_ACTION_ICON, DEFAULT_STATUS_ICON, ACTION_DISPLAY_NAMES } from './audit-constants';

/**
 * Get icon for audit action
 */
export function getActionIcon(action: AuditAction): string {
  return ACTION_ICONS[action] || DEFAULT_ACTION_ICON;
}

/**
 * Get icon for audit result status
 */
export function getStatusIcon(result: AuditResult): string {
  return STATUS_ICONS[result] || DEFAULT_STATUS_ICON;
}

/**
 * Get display name for audit action
 */
export function getActionDisplayName(action: AuditAction): string {
  return ACTION_DISPLAY_NAMES[action] || action.toUpperCase().replace(/-/g, ' ');
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate date range from preset
 */
export function calculateDateRange(preset: '1d' | '7d' | '30d' | 'all'): { startDate?: string; endDate?: string } {
  if (preset === 'all') {
    return {};
  }
  
  const days = parseInt(preset.replace('d', ''));
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return {
    startDate: date.toISOString(),
    endDate: undefined
  };
}

/**
 * Get date range display text
 */
export function getDateRangeDisplay(
  dateRange: '1d' | '7d' | '30d' | 'all' | 'custom',
  customStartDate?: string,
  customEndDate?: string
): string {
  switch (dateRange) {
    case 'all':
      return 'All Time';
    case 'custom':
      if (customStartDate && customEndDate) {
        const startFormatted = new Date(customStartDate).toLocaleDateString();
        const endFormatted = new Date(customEndDate).toLocaleDateString();
        return `${startFormatted} - ${endFormatted}`;
      } else if (customStartDate) {
        return `From ${new Date(customStartDate).toLocaleDateString()}`;
      } else if (customEndDate) {
        return `Until ${new Date(customEndDate).toLocaleDateString()}`;
      } else {
        return 'Custom Range';
      }
    default:
      return `Last ${dateRange}`;
  }
}

/**
 * Generate audit filename for exports
 */
export function generateAuditFilename(
  type: 'case' | 'user',
  identifier: string,
  format: 'csv' | 'json' | 'txt'
): string {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-audit-${identifier}-${date}.${format}`;
}

/**
 * Truncate long text for display
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}

/**
 * Get severity class name for styling
 */
export function getSeverityClassName(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'severity-critical';
    case 'high':
      return 'severity-high';
    case 'medium':
      return 'severity-medium';
    case 'low':
      return 'severity-low';
    default:
      return 'severity-unknown';
  }
}