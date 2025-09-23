// Re-export all audit functionality from the new modular structure
// This provides backward compatibility while using the new architecture

import { auditCoreService } from './audit/audit-core.service';
import { auditQueryService } from './audit/audit-query.service';
import { auditExportService } from './audit-export.service';

/**
 * Unified audit service that combines all audit functionality
 * Provides backward compatibility with existing code
 */
class AuditService {
  // Core functionality delegation
  public initializeWorkflow = auditCoreService.initializeWorkflow.bind(auditCoreService);
  public logEvent = auditCoreService.logEvent.bind(auditCoreService);
  public getAuditTrail = auditCoreService.getAuditTrail.bind(auditCoreService);
  public clearBuffer = auditCoreService.clearBuffer.bind(auditCoreService);
  public getBufferSize = auditCoreService.getBufferSize.bind(auditCoreService);

  // Query functionality delegation
  public getAuditEntriesForUser = auditQueryService.getAuditEntriesForUser.bind(auditQueryService);

  // Workflow management
  public startWorkflow = auditCoreService.startWorkflow.bind(auditCoreService);
  public endWorkflow = auditCoreService.endWorkflow.bind(auditCoreService);

  // Method delegation - All specific logging methods
  public logAnnotationCreate = auditCoreService.methods.logAnnotationCreate.bind(auditCoreService.methods);
  public logAnnotationEdit = auditCoreService.methods.logAnnotationEdit.bind(auditCoreService.methods);
  public logAnnotationDelete = auditCoreService.methods.logAnnotationDelete.bind(auditCoreService.methods);
  public logCaseExport = auditCoreService.methods.logCaseExport.bind(auditCoreService.methods);
  public logCaseImport = auditCoreService.methods.logCaseImport.bind(auditCoreService.methods);
  public logUserLogin = auditCoreService.methods.logUserLogin.bind(auditCoreService.methods);
  public logUserLogout = auditCoreService.methods.logUserLogout.bind(auditCoreService.methods);
  public logFileUpload = auditCoreService.methods.logFileUpload.bind(auditCoreService.methods);
  public logFileAccess = auditCoreService.methods.logFileAccess.bind(auditCoreService.methods);
  public logFileDelete = auditCoreService.methods.logFileDelete.bind(auditCoreService.methods);
  public logSecurityViolation = auditCoreService.methods.logSecurityViolation.bind(auditCoreService.methods);
  
  // Additional methods
  public logConfirmationCreation = auditCoreService.methods.logConfirmationCreation.bind(auditCoreService.methods);
  public logConfirmationExport = auditCoreService.methods.logConfirmationExport.bind(auditCoreService.methods);
  public logConfirmationImport = auditCoreService.methods.logConfirmationImport.bind(auditCoreService.methods);
  public logCaseCreation = auditCoreService.methods.logCaseCreation.bind(auditCoreService.methods);
  public logCaseRename = auditCoreService.methods.logCaseRename.bind(auditCoreService.methods);
  public logCaseDeletion = auditCoreService.methods.logCaseDeletion.bind(auditCoreService.methods);
  public logPDFGeneration = auditCoreService.methods.logPDFGeneration.bind(auditCoreService.methods);
  public logUserProfileUpdate = auditCoreService.methods.logUserProfileUpdate.bind(auditCoreService.methods);
  public logPasswordReset = auditCoreService.methods.logPasswordReset.bind(auditCoreService.methods);
  public logAccountDeletionSimple = auditCoreService.methods.logAccountDeletionSimple.bind(auditCoreService.methods);
  public logFileDeletion = auditCoreService.methods.logFileDeletion.bind(auditCoreService.methods);
}

// Export singleton instance for backward compatibility
export const auditService = new AuditService();

// Also export the individual services for direct access if needed
export { auditCoreService, auditQueryService, auditExportService };

// Re-export types and constants for convenience
export * from './audit/audit-constants';
export * from './audit/audit-utils';