import { ValidationAuditEntry, AuditAction, AuditResult, WorkflowPhase } from '~/types';
import { getDataApiKey } from '~/utils/auth';
import { AUDIT_PAGINATION } from './audit-constants';

const DATA_WORKER_URL = 'https://data-worker.striae-org.workers.dev';

export interface AuditQueryParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
  caseNumber?: string;
  action?: AuditAction;
  result?: AuditResult;
  workflowPhase?: WorkflowPhase;
  offset?: number;
  limit?: number;
}

export class AuditQueryService {
  /**
   * Get audit entries for display (public method for components)
   */
  public async getAuditEntriesForUser(userId: string, params?: {
    startDate?: string;
    endDate?: string;
    caseNumber?: string;
    action?: AuditAction;
    result?: AuditResult;
    workflowPhase?: WorkflowPhase;
    offset?: number;
    limit?: number;
  }): Promise<ValidationAuditEntry[]> {
    const queryParams: AuditQueryParams = {
      userId,
      ...params
    };
    return await this.getAuditEntries(queryParams);
  }

  /**
   * Get audit entries based on query parameters
   */
  private async getAuditEntries(params: AuditQueryParams): Promise<ValidationAuditEntry[]> {
    try {
      // If userId is provided, fetch from server
      if (params.userId) {
        const apiKey = await getDataApiKey();
        const url = new URL(`${DATA_WORKER_URL}/audit/`);
        url.searchParams.set('userId', params.userId);
        
        if (params.startDate) {
          url.searchParams.set('startDate', params.startDate);
        }
        
        if (params.endDate) {
          url.searchParams.set('endDate', params.endDate);
        }
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-Custom-Auth-Key': apiKey
          }
        });

        if (response.ok) {
          const result = await response.json() as { entries: ValidationAuditEntry[]; total: number };
          let entries = result.entries;

          // Apply client-side filters
          if (params.caseNumber) {
            entries = entries.filter(e => e.details.caseNumber === params.caseNumber);
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

          // Apply pagination
          if (params.offset || params.limit) {
            const offset = params.offset || 0;
            const limit = params.limit || AUDIT_PAGINATION.DEFAULT_LIMIT;
            entries = entries.slice(offset, offset + limit);
          }

          return entries;
        } else {
          console.error('🚨 Audit: Failed to fetch entries from server');
        }
      }

      return [];
    } catch (error) {
      console.error('🚨 Audit: Query failed:', error);
      return [];
    }
  }

  /**
   * Get summary statistics for audit entries
   */
  public generateSummaryStats(entries: ValidationAuditEntry[]) {
    const totalEntries = entries.length;
    const successfulEntries = entries.filter(e => e.result === 'success').length;
    const failedEntries = entries.filter(e => e.result === 'failure').length;
    const securityIncidents = entries.filter(e => e.action === 'security-violation').length;
    const loginSessions = entries.filter(e => e.action === 'user-login').length;

    const actionCounts = entries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dateRange = entries.length > 0 ? {
      earliest: new Date(Math.min(...entries.map(e => new Date(e.timestamp).getTime()))),
      latest: new Date(Math.max(...entries.map(e => new Date(e.timestamp).getTime())))
    } : null;

    return {
      totalEntries,
      successfulEntries,
      failedEntries,
      securityIncidents,
      loginSessions,
      actionCounts,
      dateRange,
      successRate: totalEntries > 0 ? ((successfulEntries / totalEntries) * 100).toFixed(1) : '0'
    };
  }
}

// Export singleton instance
export const auditQueryService = new AuditQueryService();