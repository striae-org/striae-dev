import { User } from 'firebase/auth';
import { 
  ValidationAuditEntry, 
  AuditTrail, 
  AuditSummary, 
  CreateAuditEntryParams,
  WorkflowPhase,
  AuditAction,
  AuditResult
} from '~/types';
import { getDataApiKey } from '~/utils/auth';
import { AuditMethodsService } from './audit-methods.service';
import { auditQueryService } from './audit-query.service';
import { AUDIT_PERFORMANCE } from './audit-constants';

const DATA_WORKER_URL = 'https://data-worker.striae-org.workers.dev';

/**
 * Core audit service for logging and managing audit events
 * Handles the main logging functionality and coordinates with other services
 */
export class AuditCoreService {
  private auditBuffer: ValidationAuditEntry[] = [];
  private workflowId: string | null = null;
  private auditMethods: AuditMethodsService;

  constructor() {
    this.auditMethods = new AuditMethodsService({
      logEvent: this.logEvent.bind(this)
    });
  }

  /**
   * Initialize audit context for workflow tracking
   */
  public initializeWorkflow(caseNumber: string, userId: string): void {
    this.workflowId = `${caseNumber}-${userId}-${Date.now()}`;
    console.log(`🔍 Audit: Workflow initialized - ${this.workflowId}`);
  }

  /**
   * Start a new workflow session with unique ID
   */
  public startWorkflow(caseNumber: string): string {
    const workflowId = `${caseNumber}-${Date.now()}`;
    this.workflowId = workflowId;
    console.log(`🔍 Audit: Started workflow ${this.workflowId}`);
    return workflowId;
  }

  /**
   * End current workflow session
   */
  public endWorkflow(): void {
    if (this.workflowId) {
      console.log(`🔍 Audit: Ended workflow ${this.workflowId}`);
      this.workflowId = null;
    }
  }

  /**
   * Create and log an audit entry
   */
  public async logEvent(params: CreateAuditEntryParams): Promise<void> {
    const startTime = Date.now();

    try {
      const auditEntry: ValidationAuditEntry = {
        timestamp: new Date().toISOString(),
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        result: params.result,
        details: {
          fileName: params.fileName,
          fileType: params.fileType,
          checksumValid: params.checksumValid,
          validationErrors: params.validationErrors || [],
          caseNumber: params.caseNumber,
          confirmationId: params.confirmationId,
          originalExaminerUid: params.originalExaminerUid,
          reviewingExaminerUid: params.reviewingExaminerUid,
          workflowPhase: params.workflowPhase,
          securityChecks: params.securityChecks,
          performanceMetrics: params.performanceMetrics,
          // Extended detail fields
          caseDetails: params.caseDetails,
          fileDetails: params.fileDetails,
          annotationDetails: params.annotationDetails,
          sessionDetails: params.sessionDetails,
          securityDetails: params.securityDetails
        }
      };

      // Add to buffer for batch processing
      this.auditBuffer.push(auditEntry);

      // Log to console for immediate feedback
      this.logToConsole(auditEntry);

      // Persist to storage asynchronously
      await this.persistAuditEntry(auditEntry);

      const endTime = Date.now();
      console.log(`🔍 Audit: Event logged in ${endTime - startTime}ms`);

    } catch (error) {
      console.error('🚨 Audit: Failed to log event:', error);
      // Don't throw - audit failures shouldn't break the main workflow
    }
  }

  /**
   * Get audit trail for a case
   */
  public async getAuditTrail(caseNumber: string): Promise<AuditTrail | null> {
    try {
      const entries = await auditQueryService.getAuditEntriesForUser('', { caseNumber });
      if (!entries || entries.length === 0) {
        return null;
      }

      const summary = this.generateAuditSummary(entries);
      const workflowId = this.workflowId || `${caseNumber}-archived`;

      return {
        caseNumber,
        workflowId,
        entries,
        summary
      };
    } catch (error) {
      console.error('🚨 Audit: Failed to get audit trail:', error);
      return null;
    }
  }

  /**
   * Generate audit summary from entries
   */
  private generateAuditSummary(entries: ValidationAuditEntry[]): AuditSummary {
    const successCount = entries.filter(e => e.result === 'success').length;
    const failureCount = entries.filter(e => e.result === 'failure').length;
    const warningCount = entries.filter(e => e.result === 'warning').length;
    
    const phases = [...new Set(entries
      .map(e => e.details.workflowPhase)
      .filter(Boolean))] as WorkflowPhase[];
    
    const users = [...new Set(entries.map(e => e.userId))];
    
    const timestamps = entries.map(e => e.timestamp).sort();
    const securityIncidents = entries.filter(e => 
      e.result === 'failure' && 
      (e.details.securityChecks?.selfConfirmationPrevented === false ||
       !e.details.securityChecks?.fileIntegrityValid)
    ).length;

    return {
      totalEvents: entries.length,
      successfulEvents: successCount,
      failedEvents: failureCount,
      warningEvents: warningCount,
      workflowPhases: phases,
      participatingUsers: users,
      startTimestamp: timestamps[0] || new Date().toISOString(),
      endTimestamp: timestamps[timestamps.length - 1] || new Date().toISOString(),
      complianceStatus: failureCount === 0 ? 'compliant' : 'non-compliant',
      securityIncidents
    };
  }

  /**
   * Persist audit entry to storage
   */
  private async persistAuditEntry(entry: ValidationAuditEntry): Promise<void> {
    try {
      const apiKey = await getDataApiKey();
      const url = new URL(`${DATA_WORKER_URL}/audit/`);
      url.searchParams.set('userId', entry.userId);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🚨 Audit: Failed to persist entry:', response.status, errorData);
      } else {
        const result = await response.json() as { success: boolean; entryCount: number; filename: string };
        console.log(`🔍 Audit: Entry persisted (${result.entryCount} total entries)`);
      }
    } catch (error) {
      console.error('🚨 Audit: Storage error:', error);
    }
  }

  /**
   * Log audit entry to console for development
   */
  private logToConsole(entry: ValidationAuditEntry): void {
    const icon = entry.result === 'success' ? '✅' : 
                 entry.result === 'failure' ? '❌' : '⚠️';
    
    console.log(
      `${icon} Audit [${entry.action.toUpperCase()}]: ${entry.details.fileName} ` +
      `(Case: ${entry.details.caseNumber || 'N/A'}) - ${entry.result.toUpperCase()}`
    );

    if (entry.details.validationErrors.length > 0) {
      console.log('   Errors:', entry.details.validationErrors);
    }

    if (entry.details.securityChecks) {
      const securityIssues = Object.entries(entry.details.securityChecks)
        .filter(([_, value]) => value === false)
        .map(([key, _]) => key);
      
      if (securityIssues.length > 0) {
        console.warn('   Security Issues:', securityIssues);
      }
    }
  }

  /**
   * Clear audit buffer (for testing)
   */
  public clearBuffer(): void {
    this.auditBuffer = [];
  }

  /**
   * Get current buffer size (for monitoring)
   */
  public getBufferSize(): number {
    return this.auditBuffer.length;
  }

  // Expose audit methods through delegation
  public get methods() {
    return this.auditMethods;
  }

  // Expose query service
  public get query() {
    return auditQueryService;
  }
}

// Export singleton instance
export const auditCoreService = new AuditCoreService();