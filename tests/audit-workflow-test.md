# Audit Workflow Testing Guide

This guide provides comprehensive testing steps to verify that the ValidationAuditEntry system correctly persists audit trails throughout the complete confirmation workflow chain.

## Test Scenario Overview

**Workflow Chain:** Export Case → Import Case → Create Confirmation → Export Confirmation → Import Confirmation

**Expected Audit Entries:** 5 total entries with unique workflow chain tracking

## Prerequisites

1. Development server running (`npm run dev`)
2. Data worker running locally
3. Firebase Auth emulator active
4. At least one test case with images loaded

## Test Steps

### Phase 1: Initial Case Export (Examiner A)

1. **Login** as the original examiner (Examiner A)
2. **Load a test case** with images
3. **Open Case Actions** → Click "Export Case Data"
4. **Select format** (JSON/CSV) and export
5. **Verify audit logging** in browser console:
   ```
   ✅ Audit [CASE_EXPORT]: test-case.json (Case: TEST-001) - SUCCESS
   🔍 Audit: Entry persisted (1 total entries)
   ```

### Phase 2: Case Import (Examiner B)

1. **Logout** and login as a different examiner (Examiner B)
2. **Import the exported case** via "Import/Clear Case"
3. **Verify case loads** as read-only
4. **Check audit logging** in console:
   ```
   ✅ Audit [CASE_IMPORT]: test-case.json (Case: TEST-001) - SUCCESS
   🔍 Audit: Entry persisted (2 total entries)
   ```

### Phase 3: Confirmation Creation (Examiner B)

1. **Create annotations** on the imported case images
2. **Generate confirmation** using the toolbar
3. **Verify confirmation creation** succeeds
4. **Check audit logging** for confirmation creation:
   ```
   ✅ Audit [CONFIRMATION_CREATION]: confirmation-12345 (Case: TEST-001) - SUCCESS
   🔍 Audit: Entry persisted (3 total entries)
   ```

### Phase 4: Confirmation Export (Examiner B)

1. **Export the confirmation** via Case Actions → Export Case Data
2. **Select confirmation format** and download
3. **Verify audit logging**:
   ```
   ✅ Audit [CONFIRMATION_EXPORT]: confirmation-12345.json (Case: TEST-001) - SUCCESS
   🔍 Audit: Entry persisted (4 total entries)
   ```

### Phase 5: Confirmation Import (Examiner A)

1. **Switch back** to original examiner (Examiner A)
2. **Import the confirmation** using the import modal
3. **Verify confirmation displays** correctly
4. **Check final audit logging**:
   ```
   ✅ Audit [CONFIRMATION_IMPORT]: confirmation-12345.json (Case: TEST-001) - SUCCESS
   🔍 Audit: Entry persisted (5 total entries)
   ```

### Phase 6: Audit Trail Verification

1. **Open Case Actions** → Click "Audit Trail"
2. **Verify audit trail viewer** displays all 5 entries
3. **Check audit summary**:
   - Total Events: 5
   - Successful Events: 5
   - Failed Events: 0
   - Compliance Status: COMPLIANT
   - Workflow Phases: All 5 phases represented

### Phase 7: Cross-User Audit Verification

1. **Switch between users** (Examiner A and Examiner B)
2. **Check audit trails** for each user show their respective actions
3. **Verify workflow linking** - same case number appears across all entries
4. **Test filtering** by action type and result status

## Expected Results

### Audit Entry Structure
Each audit entry should contain:
- Unique timestamp
- User ID and email
- Action type (CASE_EXPORT, CASE_IMPORT, etc.)
- Result status (success/failure)
- Case number for workflow linking
- Security validation results
- Performance metrics

### Audit Persistence
- Entries stored in R2 bucket as daily files per user
- Server-side retrieval works correctly
- Client-side buffer backup functions
- Real-time audit trail updates

### Compliance Validation
- Complete audit chain from start to finish
- No missing workflow phases
- Proper user attribution
- Security checks logged
- Performance metrics captured

## Troubleshooting

### No Audit Entries Appearing
1. Check browser console for audit service errors
2. Verify data worker is running and accessible
3. Check API key configuration
4. Verify user authentication

### Missing Workflow Phases
1. Ensure all workflow integration points are active
2. Check audit service method calls in relevant components
3. Verify case number consistency across actions

### Audit Trail Viewer Issues
1. Check AuditTrailViewer component props
2. Verify server-side endpoint responses
3. Check user context availability

## Success Criteria

✅ **Complete Workflow Tracking** - All 5 phases logged
✅ **Cross-User Audit Chain** - Workflow visible across users
✅ **Server-Side Persistence** - Audit entries survive page refresh
✅ **Real-Time Updates** - Audit trail updates immediately
✅ **Security Validation** - All entries include security checks
✅ **Performance Metrics** - Timing data captured
✅ **Compliance Status** - Proper compliance calculation
✅ **User Interface** - Audit trail viewer displays correctly

## Test Data Template

```json
{
  "testCase": "TEST-AUDIT-001",
  "examinerA": "examiner1@striae.org",
  "examinerB": "examiner2@striae.org",
  "expectedAuditCount": 5,
  "workflowPhases": [
    "case-export",
    "case-import", 
    "confirmation-creation",
    "confirmation-export",
    "confirmation-import"
  ]
}
```

This comprehensive test ensures the ValidationAuditEntry system provides complete forensic audit trails for compliance and security monitoring.