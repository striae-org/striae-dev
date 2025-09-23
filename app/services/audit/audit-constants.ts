import { AuditAction, AuditResult, WorkflowPhase } from '~/types';

/**
 * Action icons for audit entries
 */
export const ACTION_ICONS: Record<AuditAction, string> = {
  // User & Session Management
  'user-login': '🔑',
  'user-logout': '🚪',
  'user-profile-update': '👤',
  'user-password-reset': '🔒',
  'user-account-delete': '🗑️',
  
  // Case Management
  'case-create': '📂',
  'case-rename': '✏️',
  'case-delete': '🗑️',
  
  // Confirmation Workflow
  'case-export': '📤',
  'case-import': '📥',
  'confirmation-create': '✅',
  'confirmation-export': '📤',
  'confirmation-import': '📥',
  
  // File Operations
  'file-upload': '⬆️',
  'file-delete': '🗑️',
  'file-access': '👁️',
  
  // Annotation Operations
  'annotation-create': '✨',
  'annotation-edit': '✏️',
  'annotation-delete': '❌',
  
  // Document Generation
  'pdf-generate': '📄',
  
  // Security & Monitoring
  'security-violation': '🚨',
  
  // Legacy Actions
  'export': '📤',
  'import': '📥',
  'confirm': '✓',
  'validate': '✔️'
} as const;

/**
 * Status icons for audit results
 */
export const STATUS_ICONS: Record<AuditResult, string> = {
  success: '✅',
  failure: '❌',
  warning: '⚠️',
  blocked: '🛑',
  pending: '⏳'
} as const;

/**
 * Default action icon for unknown actions
 */
export const DEFAULT_ACTION_ICON = '📄';

/**
 * Default status icon for unknown results
 */
export const DEFAULT_STATUS_ICON = '❓';

/**
 * Action display names (for UI)
 */
export const ACTION_DISPLAY_NAMES: Record<AuditAction, string> = {
  // User & Session Management
  'user-login': 'Login',
  'user-logout': 'Logout',
  'user-profile-update': 'Profile Update',
  'user-password-reset': 'Password Reset',
  'user-account-delete': 'Account Delete',
  
  // Case Management
  'case-create': 'Case Create',
  'case-rename': 'Case Rename',
  'case-delete': 'Case Delete',
  
  // Confirmation Workflow
  'case-export': 'Case Export',
  'case-import': 'Case Import',
  'confirmation-create': 'Confirmation Create',
  'confirmation-export': 'Confirmation Export',
  'confirmation-import': 'Confirmation Import',
  
  // File Operations
  'file-upload': 'File Upload',
  'file-delete': 'File Delete',
  'file-access': 'File Access',
  
  // Annotation Operations
  'annotation-create': 'Annotation Create',
  'annotation-edit': 'Annotation Edit',
  'annotation-delete': 'Annotation Delete',
  
  // Document Generation
  'pdf-generate': 'PDF Generate',
  
  // Security & Monitoring
  'security-violation': 'Security Violation',
  
  // Legacy Actions
  'export': 'Export',
  'import': 'Import',
  'confirm': 'Confirm',
  'validate': 'Validate'
} as const;

/**
 * Filter groups for audit actions (for UI dropdowns)
 */
export const ACTION_FILTER_GROUPS = {
  'User Sessions': ['user-login', 'user-logout'] as AuditAction[],
  'Case Management': ['case-create', 'case-rename', 'case-delete'] as AuditAction[],
  'File Operations': ['file-upload', 'file-access', 'file-delete'] as AuditAction[],
  'Annotations': ['annotation-create', 'annotation-edit', 'annotation-delete'] as AuditAction[],
  'Confirmation Workflow': ['case-export', 'case-import', 'confirmation-create', 'confirmation-export', 'confirmation-import'] as AuditAction[],
  'Documents': ['pdf-generate'] as AuditAction[],
  'Security': ['security-violation'] as AuditAction[]
} as const;

/**
 * Result display names (for UI)
 */
export const RESULT_DISPLAY_NAMES: Record<AuditResult, string> = {
  success: 'Success',
  failure: 'Failure',
  warning: 'Warning',
  blocked: 'Blocked',
  pending: 'Pending'
} as const;

/**
 * Date range options for audit filtering
 */
export const DATE_RANGE_OPTIONS = {
  '1d': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  'all': 'All Time',
  'custom': 'Custom Range'
} as const;

/**
 * Default pagination limits
 */
export const AUDIT_PAGINATION = {
  DEFAULT_LIMIT: 500,
  CASE_SPECIFIC_LIMIT: 1000,
  MAX_LIMIT: 2000
} as const;

/**
 * Performance and timing constants
 */
export const AUDIT_PERFORMANCE = {
  BUFFER_FLUSH_INTERVAL: 30000, // 30 seconds
  MAX_BUFFER_SIZE: 100,
  BATCH_SIZE: 50
} as const;