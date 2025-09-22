// Audit trail types for validation and security framework
// Used to track all validation events throughout the confirmation workflow

export type AuditAction = 'import' | 'export' | 'confirm' | 'validate';
export type AuditResult = 'success' | 'failure' | 'warning';
export type AuditFileType = 'case-package' | 'confirmation-data';

/**
 * Core audit entry structure for all validation events
 * Based on the specification in confirmations-guide.md
 */
export interface ValidationAuditEntry {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  result: AuditResult;
  details: AuditDetails;
}

/**
 * Detailed information for each audit entry
 */
export interface AuditDetails {
  fileName: string;
  fileType: AuditFileType;
  checksumValid: boolean;
  validationErrors: string[];
  caseNumber?: string;
  confirmationId?: string;
  // Additional context fields
  originalExaminerUid?: string;
  reviewingExaminerUid?: string;
  workflowPhase?: WorkflowPhase;
  securityChecks?: SecurityCheckResults;
  performanceMetrics?: PerformanceMetrics;
}

/**
 * Workflow phases for tracking progression through confirmation system
 */
export type WorkflowPhase = 
  | 'case-export'           // Phase 2: Original examiner exports case
  | 'case-import'           // Phase 3: Reviewing examiner imports case
  | 'confirmation-creation' // Phase 4: Reviewing examiner creates confirmation
  | 'confirmation-export'   // Phase 5: Reviewing examiner exports confirmation
  | 'confirmation-import';  // Phase 6: Original examiner imports confirmation

/**
 * Security validation results
 */
export interface SecurityCheckResults {
  selfConfirmationPrevented: boolean;
  userAuthenticationValid: boolean;
  fileIntegrityValid: boolean;
  timestampValidationPassed: boolean;
  permissionChecksPassed: boolean;
  exporterUidValidated?: boolean;
  crossLaboratoryRestrictions?: boolean;
}

/**
 * Performance and operational metrics
 */
export interface PerformanceMetrics {
  processingTimeMs: number;
  fileSizeBytes: number;
  validationStepsCompleted: number;
  validationStepsFailed: number;
  retryAttempts?: number;
}

/**
 * Complete audit trail for a case or workflow
 */
export interface AuditTrail {
  caseNumber: string;
  workflowId: string; // Unique identifier linking related audit entries
  entries: ValidationAuditEntry[];
  summary: AuditSummary;
}

/**
 * Summary of audit trail for reporting and compliance
 */
export interface AuditSummary {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  warningEvents: number;
  workflowPhases: WorkflowPhase[];
  participatingUsers: string[]; // User IDs
  startTimestamp: string;
  endTimestamp: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'pending';
  securityIncidents: number;
}

/**
 * Audit entry creation parameters
 */
export interface CreateAuditEntryParams {
  userId: string;
  userEmail: string;
  action: AuditAction;
  result: AuditResult;
  fileName: string;
  fileType: AuditFileType;
  checksumValid: boolean;
  validationErrors?: string[];
  caseNumber?: string;
  confirmationId?: string;
  workflowPhase?: WorkflowPhase;
  securityChecks?: SecurityCheckResults;
  performanceMetrics?: PerformanceMetrics;
  originalExaminerUid?: string;
  reviewingExaminerUid?: string;
}

/**
 * Query parameters for retrieving audit entries
 */
export interface AuditQueryParams {
  caseNumber?: string;
  workflowId?: string;
  userId?: string;
  action?: AuditAction;
  result?: AuditResult;
  workflowPhase?: WorkflowPhase;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit storage configuration
 */
export interface AuditStorageConfig {
  retentionPeriodDays: number;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  complianceLevel: 'standard' | 'high' | 'forensic';
}

/**
 * Audit event subscription for real-time monitoring
 */
export interface AuditEventSubscription {
  eventTypes: AuditAction[];
  resultTypes: AuditResult[];
  userId?: string;
  caseNumber?: string;
  callback: (entry: ValidationAuditEntry) => void;
}