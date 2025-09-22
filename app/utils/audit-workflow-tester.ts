/**
 * Audit Workflow Test Utility
 * Provides helper functions to test and verify the complete audit workflow
 */

import { auditService } from '~/services/audit.service';
import { ValidationAuditEntry, WorkflowPhase } from '~/types';

export class AuditWorkflowTester {
  private testCaseNumber: string;
  private testUserId: string;

  constructor(caseNumber: string, userId: string) {
    this.testCaseNumber = caseNumber;
    this.testUserId = userId;
  }

  /**
   * Verify the current audit trail for the test case
   */
  async verifyAuditTrail(): Promise<{
    success: boolean;
    totalEntries: number;
    phasesCovered: string[];
    missingPhases: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    
    console.log('🔍 Verifying Audit Trail');
    console.log(`📝 Case: ${this.testCaseNumber}`);
    console.log(`👤 User: ${this.testUserId}`);
    
    try {
      // Get audit entries for this user and case
      const auditEntries = await auditService.getAuditEntriesForUser(this.testUserId, {
        caseNumber: this.testCaseNumber,
        limit: 100
      });
      
      console.log(`📊 Found ${auditEntries.length} audit entries`);
      
      // Expected workflow phases
      const expectedPhases: WorkflowPhase[] = [
        'case-export',
        'case-import', 
        'confirmation-creation',
        'confirmation-export',
        'confirmation-import'
      ];
      
      // Get phases from audit entries (filter out undefined values)
      const phasesCovered = auditEntries
        .map(entry => entry.details.workflowPhase)
        .filter((phase): phase is WorkflowPhase => phase !== undefined)
        .filter((phase, index, array) => array.indexOf(phase) === index); // Remove duplicates
      
      const missingPhases = expectedPhases.filter(phase => !phasesCovered.includes(phase));
      
      console.log('✅ Phases covered:', phasesCovered);
      console.log('❌ Missing phases:', missingPhases);
      
      // Analyze audit entries
      this.analyzeAuditEntries(auditEntries, errors);
      
      const success = errors.length === 0 && missingPhases.length === 0;
      
      console.log(success ? '✅ Audit trail verification PASSED' : '❌ Audit trail verification FAILED');
      
      return {
        success,
        totalEntries: auditEntries.length,
        phasesCovered,
        missingPhases,
        errors
      };
      
    } catch (error) {
      const errorMsg = `Audit trail verification failed: ${error}`;
      errors.push(errorMsg);
      console.error('🚨', errorMsg);
      
      return {
        success: false,
        totalEntries: 0,
        phasesCovered: [],
        missingPhases: [],
        errors
      };
    }
  }

  private analyzeAuditEntries(entries: ValidationAuditEntry[], errors: string[]): void {
    console.log('🔍 Analyzing audit entries...');
    
    // Check for correct case number
    const wrongCaseEntries = entries.filter(
      entry => entry.details.caseNumber !== this.testCaseNumber
    );
    
    if (wrongCaseEntries.length > 0) {
      errors.push(`Found ${wrongCaseEntries.length} entries with wrong case number`);
    }
    
    // Check for failed entries
    const failedEntries = entries.filter(entry => entry.result === 'failure');
    if (failedEntries.length > 0) {
      console.warn(`⚠️ Found ${failedEntries.length} failed audit entries`);
      failedEntries.forEach(entry => {
        console.warn(`   - ${entry.action}: ${entry.details.validationErrors.join(', ')}`);
      });
    }
    
    // Check for entries with security issues
    const securityIssueEntries = entries.filter(entry => {
      if (!entry.details.securityChecks) return false;
      return Object.values(entry.details.securityChecks).some(check => !check);
    });
    
    if (securityIssueEntries.length > 0) {
      console.warn(`⚠️ Found ${securityIssueEntries.length} entries with security issues`);
    }
    
    // Check timestamp order (should be chronological)
    const timestamps = entries.map(entry => new Date(entry.timestamp).getTime());
    const isChronological = timestamps.every((time, index) => 
      index === 0 || time <= timestamps[index - 1]
    );
    
    if (!isChronological) {
      errors.push('Audit entries are not in chronological order');
    }
    
    // Summary statistics
    const successCount = entries.filter(e => e.result === 'success').length;
    const warningCount = entries.filter(e => e.result === 'warning').length;
    const failureCount = entries.filter(e => e.result === 'failure').length;
    
    console.log(`📈 Audit Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️ Warning: ${warningCount}`);
    console.log(`   ❌ Failure: ${failureCount}`);
    
    // Check if we have performance metrics
    const entriesWithMetrics = entries.filter(e => e.details.performanceMetrics);
    console.log(`⏱️ Entries with performance metrics: ${entriesWithMetrics.length}/${entries.length}`);
    
    // Check if we have security checks
    const entriesWithSecurity = entries.filter(e => e.details.securityChecks);
    console.log(`🔒 Entries with security checks: ${entriesWithSecurity.length}/${entries.length}`);
  }

  /**
   * Test the audit trail viewer functionality
   */
  async testAuditTrailViewer(): Promise<boolean> {
    console.log('🧪 Testing Audit Trail Viewer functionality');
    
    try {
      // This would test the React component in a real environment
      // For now, we'll just verify the data retrieval works
      const entries = await auditService.getAuditEntriesForUser(this.testUserId, {
        caseNumber: this.testCaseNumber
      });
      
      console.log(`✅ Audit Trail Viewer data retrieval: ${entries.length} entries`);
      return true;
      
    } catch (error) {
      console.error('❌ Audit Trail Viewer test failed:', error);
      return false;
    }
  }

  /**
   * Display test instructions for manual testing
   */
  displayTestInstructions(): void {
    console.log(`
🧪 MANUAL AUDIT WORKFLOW TEST INSTRUCTIONS

📝 Case Number: ${this.testCaseNumber}
👤 User ID: ${this.testUserId}

Follow these steps to test the complete audit workflow:

1️⃣ CASE EXPORT (Examiner A)
   • Load case: ${this.testCaseNumber}
   • Case Actions → Export Case Data
   • Choose format and export
   • Check console for: "✅ Audit [CASE_EXPORT]"

2️⃣ CASE IMPORT (Examiner B) 
   • Login as different user
   • Import/Clear Case → select exported file
   • Check console for: "✅ Audit [CASE_IMPORT]"

3️⃣ CONFIRMATION CREATION (Examiner B)
   • Add annotations to imported case
   • Create confirmation via toolbar
   • Check console for: "✅ Audit [CONFIRMATION_CREATION]"

4️⃣ CONFIRMATION EXPORT (Examiner B)
   • Case Actions → Export Case Data
   • Export confirmation
   • Check console for: "✅ Audit [CONFIRMATION_EXPORT]"

5️⃣ CONFIRMATION IMPORT (Examiner A)
   • Switch back to original user
   • Import confirmation file
   • Check console for: "✅ Audit [CONFIRMATION_IMPORT]"

6️⃣ VERIFY AUDIT TRAIL
   • Case Actions → Audit Trail
   • Verify all 5 phases appear
   • Test filtering by action/result
   • Check summary statistics

Run: auditTester.verifyAuditTrail() after completing steps
    `);
  }
}

/**
 * Quick test function for console use
 */
export function createAuditTester(caseNumber: string, userId: string): AuditWorkflowTester {
  const tester = new AuditWorkflowTester(caseNumber, userId);
  tester.displayTestInstructions();
  return tester;
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).createAuditTester = createAuditTester;
  (window as any).AuditWorkflowTester = AuditWorkflowTester;
}