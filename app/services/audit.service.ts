import { User } from 'firebase/auth';
import { 
  ValidationAuditEntry, 
  CreateAuditEntryParams, 
  AuditTrail, 
  AuditQueryParams,
  AuditSummary,
  WorkflowPhase,
  AuditAction,
  AuditResult,
  SecurityCheckResults,
  PerformanceMetrics
} from '~/types';
import paths from '~/config/config.json';
import { getDataApiKey } from '~/utils/auth';
import { generateWorkflowId } from '~/utils/id-generator';

const DATA_WORKER_URL = paths.data_worker_url;

/**
 * Audit Service for ValidationAuditEntry system
 * Provides comprehensive audit logging throughout the confirmation workflow
 */
export class AuditService {
  private static instance: AuditService;
  private auditBuffer: ValidationAuditEntry[] = [];
  private workflowId: string | null = null;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Initialize a new workflow session with unique ID
   */
  public startWorkflow(caseNumber: string): string {
    const workflowId = generateWorkflowId(caseNumber);
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
          performanceMetrics: params.performanceMetrics
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
   * Log case export event
   */
  public async logCaseExport(
    user: User,
    caseNumber: string,
    fileName: string,
    result: AuditResult,
    errors: string[] = [],
    performanceMetrics?: PerformanceMetrics
  ): Promise<void> {
    const securityChecks: SecurityCheckResults = {
      selfConfirmationPrevented: false, // Not applicable for exports
      userAuthenticationValid: true,
      fileIntegrityValid: result === 'success',
      timestampValidationPassed: true,
      permissionChecksPassed: true
    };

    await this.logEvent({
      userId: user.uid,
      userEmail: user.email || 'unknown@example.com',
      action: 'export',
      result,
      fileName,
      fileType: 'case-package',
      checksumValid: result === 'success',
      validationErrors: errors,
      caseNumber,
      workflowPhase: 'case-export',
      securityChecks,
      performanceMetrics,
      originalExaminerUid: user.uid
    });
  }

  /**
   * Log case import event
   */
  public async logCaseImport(
    user: User,
    caseNumber: string,
    fileName: string,
    result: AuditResult,
    checksumValid: boolean,
    errors: string[] = [],
    originalExaminerUid?: string,
    performanceMetrics?: PerformanceMetrics
  ): Promise<void> {
    const securityChecks: SecurityCheckResults = {
      selfConfirmationPrevented: originalExaminerUid ? originalExaminerUid !== user.uid : false,
      userAuthenticationValid: true,
      fileIntegrityValid: checksumValid,
      timestampValidationPassed: result !== 'failure',
      permissionChecksPassed: result !== 'failure',
      exporterUidValidated: !!originalExaminerUid
    };

    await this.logEvent({
      userId: user.uid,
      userEmail: user.email || 'unknown@example.com',
      action: 'import',
      result,
      fileName,
      fileType: 'case-package',
      checksumValid,
      validationErrors: errors,
      caseNumber,
      workflowPhase: 'case-import',
      securityChecks,
      performanceMetrics,
      originalExaminerUid,
      reviewingExaminerUid: user.uid
    });
  }

  /**
   * Log confirmation creation event
   */
  public async logConfirmationCreation(
    user: User,
    caseNumber: string,
    confirmationId: string,
    result: AuditResult,
    errors: string[] = [],
    originalExaminerUid?: string,
    performanceMetrics?: PerformanceMetrics
  ): Promise<void> {
    const securityChecks: SecurityCheckResults = {
      selfConfirmationPrevented: originalExaminerUid ? originalExaminerUid !== user.uid : false,
      userAuthenticationValid: true,
      fileIntegrityValid: true,
      timestampValidationPassed: true,
      permissionChecksPassed: true
    };

    await this.logEvent({
      userId: user.uid,
      userEmail: user.email || 'unknown@example.com',
      action: 'confirm',
      result,
      fileName: `confirmation-${confirmationId}`,
      fileType: 'confirmation-data',
      checksumValid: true,
      validationErrors: errors,
      caseNumber,
      confirmationId,
      workflowPhase: 'confirmation-creation',
      securityChecks,
      performanceMetrics,
      originalExaminerUid,
      reviewingExaminerUid: user.uid
    });
  }

  /**
   * Log confirmation export event
   */
  public async logConfirmationExport(
    user: User,
    caseNumber: string,
    fileName: string,
    confirmationCount: number,
    result: AuditResult,
    errors: string[] = [],
    originalExaminerUid?: string,
    performanceMetrics?: PerformanceMetrics
  ): Promise<void> {
    const securityChecks: SecurityCheckResults = {
      selfConfirmationPrevented: false, // Not applicable for exports
      userAuthenticationValid: true,
      fileIntegrityValid: result === 'success',
      timestampValidationPassed: true,
      permissionChecksPassed: true
    };

    await this.logEvent({
      userId: user.uid,
      userEmail: user.email || 'unknown@example.com',
      action: 'export',
      result,
      fileName,
      fileType: 'confirmation-data',
      checksumValid: result === 'success',
      validationErrors: errors,
      caseNumber,
      workflowPhase: 'confirmation-export',
      securityChecks,
      performanceMetrics,
      originalExaminerUid,
      reviewingExaminerUid: user.uid
    });
  }

  /**
   * Log confirmation import event
   */
  public async logConfirmationImport(
    user: User,
    caseNumber: string,
    fileName: string,
    result: AuditResult,
    checksumValid: boolean,
    confirmationsImported: number,
    errors: string[] = [],
    reviewingExaminerUid?: string,
    performanceMetrics?: PerformanceMetrics
  ): Promise<void> {
    const securityChecks: SecurityCheckResults = {
      selfConfirmationPrevented: reviewingExaminerUid ? reviewingExaminerUid !== user.uid : false,
      userAuthenticationValid: true,
      fileIntegrityValid: checksumValid,
      timestampValidationPassed: result !== 'failure',
      permissionChecksPassed: result !== 'failure',
      exporterUidValidated: !!reviewingExaminerUid
    };

    await this.logEvent({
      userId: user.uid,
      userEmail: user.email || 'unknown@example.com',
      action: 'import',
      result,
      fileName,
      fileType: 'confirmation-data',
      checksumValid,
      validationErrors: errors,
      caseNumber,
      workflowPhase: 'confirmation-import',
      securityChecks,
      performanceMetrics,
      originalExaminerUid: user.uid,
      reviewingExaminerUid
    });
  }

  /**
   * Get audit trail for a case
   */
  public async getAuditTrail(caseNumber: string): Promise<AuditTrail | null> {
    try {
      // Implement retrieval from storage
      const entries = await this.getAuditEntries({ caseNumber });
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
       !e.details.securityChecks?.userAuthenticationValid ||
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
   * Get audit entries based on query parameters
   */
  private async getAuditEntries(params: AuditQueryParams): Promise<ValidationAuditEntry[]> {
    try {
      // For now, return from buffer (in production, this would query storage)
      let entries = [...this.auditBuffer];

      if (params.caseNumber) {
        entries = entries.filter(e => e.details.caseNumber === params.caseNumber);
      }

      if (params.userId) {
        entries = entries.filter(e => e.userId === params.userId);
      }

      if (params.action) {
        entries = entries.filter(e => e.action === params.action);
      }

      if (params.result) {
        entries = entries.filter(e => e.result === params.result);
      }

      if (params.workflowPhase) {
        entries = entries.filter(e => e.details.workflowPhase === params.workflowPhase);
      }

      // Sort by timestamp (newest first)
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      if (params.offset || params.limit) {
        const offset = params.offset || 0;
        const limit = params.limit || 100;
        entries = entries.slice(offset, offset + limit);
      }

      return entries;
    } catch (error) {
      console.error('🚨 Audit: Failed to get audit entries:', error);
      return [];
    }
  }

  /**
   * Persist audit entry to storage
   */
  private async persistAuditEntry(entry: ValidationAuditEntry): Promise<void> {
    try {
      // In production, this would store to R2, KV, or a database
      // For now, we'll use the data worker to store audit entries
      const apiKey = await getDataApiKey();
      
      const response = await fetch(`${DATA_WORKER_URL}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        console.error('🚨 Audit: Failed to persist entry:', response.status);
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
}

// Export singleton instance
export const auditService = AuditService.getInstance();