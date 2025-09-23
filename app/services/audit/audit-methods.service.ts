import { User } from 'firebase/auth';
import { 
  AuditResult, 
  PerformanceMetrics, 
  SecurityCheckResults,
  CreateAuditEntryParams
} from '~/types';

export interface AuditMethodsServiceDependencies {
  logEvent: (params: CreateAuditEntryParams) => Promise<void>;
}

export class AuditMethodsService {
  constructor(private deps: AuditMethodsServiceDependencies) {}

  /**
   * Log annotation creation event
   */
  public async logAnnotationCreate(
    user: User,
    annotationId: string,
    annotationType: 'measurement' | 'identification' | 'comparison' | 'note' | 'region',
    annotationData: any,
    caseNumber: string,
    tool?: string,
    imageFileId?: string,
    originalImageFileName?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'annotation-create',
      result: 'success',
      fileName: `annotation-${annotationId}.json`,
      fileType: 'json-data',
      validationErrors: [],
      caseNumber,
      workflowPhase: 'casework',
      annotationDetails: {
        annotationId,
        annotationType,
        annotationData,
        tool,
        canvasPosition: annotationData?.position,
        annotationSize: annotationData?.size
      },
      fileDetails: imageFileId || originalImageFileName ? {
        fileId: imageFileId,
        originalFileName: originalImageFileName,
        fileSize: 0, // Not available for image annotations
        mimeType: 'image/*', // Generic image type
        uploadMethod: 'api'
      } : undefined
    });
  }

  /**
   * Log annotation edit event
   */
  public async logAnnotationEdit(
    user: User,
    annotationId: string,
    previousValue: any,
    newValue: any,
    caseNumber: string,
    tool?: string,
    imageFileId?: string,
    originalImageFileName?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'annotation-edit',
      result: 'success',
      fileName: `annotation-${annotationId}.json`,
      fileType: 'json-data',
      validationErrors: [],
      caseNumber,
      workflowPhase: 'casework',
      annotationDetails: {
        annotationId,
        annotationType: newValue?.type,
        annotationData: newValue,
        previousValue,
        tool
      },
      fileDetails: imageFileId || originalImageFileName ? {
        fileId: imageFileId,
        originalFileName: originalImageFileName,
        fileSize: 0, // Not available for image annotations
        mimeType: 'image/*', // Generic image type
        uploadMethod: 'api'
      } : undefined
    });
  }

  /**
   * Log annotation deletion event
   */
  public async logAnnotationDelete(
    user: User,
    annotationId: string,
    annotationData: any,
    caseNumber: string,
    deleteReason?: string,
    imageFileId?: string,
    originalImageFileName?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'annotation-delete',
      result: 'success',
      fileName: `annotation-${annotationId}.json`,
      fileType: 'json-data',
      validationErrors: [],
      caseNumber,
      workflowPhase: 'casework',
      annotationDetails: {
        annotationId,
        annotationType: annotationData?.type,
        annotationData,
        tool: deleteReason
      },
      fileDetails: imageFileId || originalImageFileName ? {
        fileId: imageFileId,
        originalFileName: originalImageFileName,
        fileSize: 0,
        mimeType: 'image/*',
        uploadMethod: 'api'
      } : undefined
    });
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
      fileIntegrityValid: result === 'success'
    };

    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'export',
      result,
      fileName,
      fileType: 'case-package',
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
    errors: string[] = [],
    performanceMetrics?: PerformanceMetrics
  ): Promise<void> {
    const securityChecks: SecurityCheckResults = {
      selfConfirmationPrevented: false, // Not applicable for imports
      fileIntegrityValid: result === 'success'
    };

    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'import',
      result,
      fileName,
      fileType: 'case-package',
      validationErrors: errors,
      caseNumber,
      workflowPhase: 'case-import',
      securityChecks,
      performanceMetrics,
      originalExaminerUid: user.uid
    });
  }

  /**
   * Log user login event
   */
  public async logUserLogin(
    user: User,
    result: AuditResult,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'user-login',
      result,
      fileName: 'session.log',
      fileType: 'log-file',
      validationErrors: [],
      workflowPhase: 'user-management',
      sessionDetails: {
        userAgent,
        loginMethod: 'firebase'
      }
    });
  }

  /**
   * Log user logout event
   */
  public async logUserLogout(
    user: User,
    sessionDuration?: number
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'user-logout',
      result: 'success',
      fileName: 'session.log',
      fileType: 'log-file',
      validationErrors: [],
      workflowPhase: 'user-management',
      sessionDetails: {
        sessionDuration,
        logoutReason: 'user-initiated'
      }
    });
  }

  /**
   * Log file upload event
   */
  public async logFileUpload(
    user: User,
    fileName: string,
    fileSize: number,
    mimeType: string,
    caseNumber: string,
    result: AuditResult,
    errors: string[] = [],
    fileId?: string,
    uploadMethod: string = 'browser'
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'file-upload',
      result,
      fileName,
      fileType: 'image-file',
      validationErrors: errors,
      caseNumber,
      workflowPhase: 'casework',
      fileDetails: {
        fileId,
        originalFileName: fileName,
        fileSize,
        mimeType,
        uploadMethod: uploadMethod as 'import' | 'drag-drop' | 'file-picker' | 'api'
      }
    });
  }

  /**
   * Log file access event
   */
  public async logFileAccess(
    user: User,
    fileName: string,
    caseNumber: string,
    result: AuditResult = 'success',
    fileId?: string,
    accessMethod: string = 'viewer'
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'file-access',
      result,
      fileName,
      fileType: 'image-file',
      validationErrors: result === 'failure' ? ['File access failed'] : [],
      caseNumber,
      workflowPhase: 'casework',
      fileDetails: {
        fileId,
        originalFileName: fileName,
        fileSize: 0,
        uploadMethod: 'api'
      }
    });
  }

  /**
   * Log file deletion event
   */
  public async logFileDelete(
    user: User,
    fileName: string,
    caseNumber: string,
    result: AuditResult,
    deleteReason?: string,
    fileId?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'file-delete',
      result,
      fileName,
      fileType: 'image-file',
      validationErrors: result === 'failure' ? ['File deletion failed'] : [],
      caseNumber,
      workflowPhase: 'casework',
      fileDetails: {
        fileId,
        originalFileName: fileName,
        fileSize: 0,
        deleteReason
      }
    });
  }

  /**
   * Log security violation
   */
  public async logSecurityViolation(
    user: User,
    violationType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    caseNumber?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'security-violation',
      result: 'failure',
      fileName: 'security.log',
      fileType: 'log-file',
      validationErrors: [description],
      caseNumber,
      workflowPhase: 'user-management',
      securityDetails: {
        incidentType: violationType as 'unauthorized-access' | 'data-breach' | 'malware' | 'injection' | 'brute-force' | 'privilege-escalation',
        severity
      }
    });
  }

  /**
   * Log confirmation creation event
   */
  public async logConfirmationCreation(
    user: User,
    caseNumber: string,
    confirmationType: string,
    result: AuditResult,
    duration: number,
    description: string,
    fileName?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'confirmation-create',
      result,
      fileName: fileName || `confirmation-${caseNumber}.pdf`,
      fileType: 'pdf-document',
      validationErrors: result === 'failure' ? [description] : [],
      caseNumber,
      workflowPhase: 'confirmation',
      performanceMetrics: {
        processingTimeMs: duration,
        fileSizeBytes: 0
      }
    });
  }

  /**
   * Log confirmation export event
   */
  public async logConfirmationExport(
    user: User,
    caseNumber: string,
    result: AuditResult,
    duration: number,
    description: string,
    fileName?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'confirmation-export',
      result,
      fileName: fileName || `confirmation-export-${caseNumber}.zip`,
      fileType: 'case-package',
      validationErrors: result === 'failure' ? [description] : [],
      caseNumber,
      workflowPhase: 'confirmation',
      performanceMetrics: {
        processingTimeMs: duration,
        fileSizeBytes: 0
      }
    });
  }

  /**
   * Log confirmation import event
   */
  public async logConfirmationImport(
    user: User,
    caseNumber: string,
    result: AuditResult,
    duration: number,
    description: string,
    fileName?: string,
    fileSize?: number,
    validationErrors?: string[]
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'confirmation-import',
      result,
      fileName: fileName || `confirmation-import-${caseNumber}.zip`,
      fileType: 'case-package',
      validationErrors: validationErrors || (result === 'failure' ? [description] : []),
      caseNumber,
      workflowPhase: 'confirmation',
      performanceMetrics: {
        processingTimeMs: duration,
        fileSizeBytes: fileSize || 0
      },
      fileDetails: fileSize ? {
        fileSize
      } : undefined
    });
  }

  /**
   * Log case creation event
   */
  public async logCaseCreation(
    user: User,
    caseNumber: string,
    result: AuditResult,
    description: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'case-create',
      result,
      fileName: `case-${caseNumber}.json`,
      fileType: 'json-data',
      validationErrors: result === 'failure' ? [description] : [],
      caseNumber,
      workflowPhase: 'casework'
    });
  }

  /**
   * Log case rename event
   */
  public async logCaseRename(
    user: User,
    oldCaseNumber: string,
    newCaseNumber: string,
    result: AuditResult,
    description: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'case-rename',
      result,
      fileName: `case-${newCaseNumber}.json`,
      fileType: 'json-data',
      validationErrors: result === 'failure' ? [description] : [],
      caseNumber: newCaseNumber,
      workflowPhase: 'casework'
    });
  }

  /**
   * Log case deletion event
   */
  public async logCaseDeletion(
    user: User,
    caseNumber: string,
    result: AuditResult,
    description: string,
    filesDeleted?: number
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'case-delete',
      result,
      fileName: `case-${caseNumber}.json`,
      fileType: 'json-data',
      validationErrors: result === 'failure' ? [description] : [],
      caseNumber,
      workflowPhase: 'casework'
    });
  }

  /**
   * Log PDF generation event
   */
  public async logPDFGeneration(
    user: User,
    caseNumber: string,
    result: AuditResult,
    duration: number,
    description: string,
    fileName?: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'pdf-generate',
      result,
      fileName: fileName || `report-${caseNumber}.pdf`,
      fileType: 'pdf-document',
      validationErrors: result === 'failure' ? [description] : [],
      caseNumber,
      workflowPhase: 'casework',
      performanceMetrics: {
        processingTimeMs: duration,
        fileSizeBytes: 0
      }
    });
  }

  /**
   * Log user profile update event
   */
  public async logUserProfileUpdate(
    user: User,
    result: AuditResult,
    description: string,
    changedFields?: string[]
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'user-profile-update',
      result,
      fileName: `profile-${user.uid}.json`,
      fileType: 'json-data',
      validationErrors: result === 'failure' ? [description] : [],
      workflowPhase: 'user-management'
    });
  }

  /**
   * Log password reset event
   */
  public async logPasswordReset(
    user: User,
    result: AuditResult,
    description: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'user-password-reset',
      result,
      fileName: 'password-reset.log',
      fileType: 'log-file',
      validationErrors: result === 'failure' ? [description] : [],
      workflowPhase: 'user-management'
    });
  }

  /**
   * Log account deletion event (simple version)
   */
  public async logAccountDeletionSimple(
    user: User,
    result: AuditResult,
    description: string
  ): Promise<void> {
    await this.deps.logEvent({
      userId: user.uid,
      userEmail: user.email || '',
      action: 'user-account-delete',
      result,
      fileName: 'account-deletion.log',
      fileType: 'log-file',
      validationErrors: result === 'failure' ? [description] : [],
      workflowPhase: 'user-management'
    });
  }

  /**
   * Log file deletion event (alias for logFileDelete)
   */
  public async logFileDeletion(
    user: User,
    fileName: string,
    caseNumber: string,
    result: AuditResult,
    deleteReason?: string,
    fileId?: string
  ): Promise<void> {
    return this.logFileDelete(user, fileName, caseNumber, result, deleteReason, fileId);
  }
}