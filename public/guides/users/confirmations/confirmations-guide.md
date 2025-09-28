# Authenticated Confirmations Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Confirmation System Overview](#confirmation-system-overview)
3. [Roles and Responsibilities](#roles-and-responsibilities)
4. [Complete Confirmation Workflow](#complete-confirmation-workflow)
   - [Phase 1: Original Examination](#phase-1-original-examination)
   - [Phase 2: Export for Review](#phase-2-export-for-review)
   - [Phase 3: Reviewing Examiner Import](#phase-3-reviewing-examiner-import)
   - [Phase 4: Confirmation Process](#phase-4-confirmation-process)
   - [Phase 5: Confirmation Export](#phase-5-confirmation-export)
   - [Phase 6: Confirmation Import](#phase-6-confirmation-import)
   - [Phase 7: Final Documentation](#phase-7-final-documentation)
5. [Technical Implementation](#technical-implementation)
6. [Validation and Security Framework](#validation-and-security-framework)
   - [User Validation](#user-validation)
   - [Hash Validation](#hash-validation)
   - [File Validation Framework](#file-validation-framework)
   - [Data Integrity Monitoring](#data-integrity-monitoring)
7. [Security Features](#security-features)
   - [Authentication and Authorization](#authentication-and-authorization)
   - [Data Integrity and Protection](#data-integrity-and-protection)
   - [Access Controls and Restrictions](#access-controls-and-restrictions)
   - [Audit Trail and Compliance](#audit-trail-and-compliance)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Introduction

The Authenticated Confirmations system in Striae provides a comprehensive workflow for independent verification of firearms identification conclusions. This system ensures forensic integrity through a structured process where reviewing examiners can confirm original findings using authenticated digital signatures and unique confirmation identifiers.

The confirmation process maintains chain of custody requirements while providing digital documentation that can be integrated into official reports. Each confirmation is cryptographically secured and includes examiner credentials, timestamps, and unique identifiers for audit trails.

## Confirmation System Overview

### Core Components

- **Digital Authentication**: Each confirmation requires examiner credentials including badge ID and full name
- **Unique Confirmation IDs**: System-generated identifiers for each confirmation action
- **Forensic Integrity**: Checksums and validation ensure data hasn't been modified
- **Read-Only Review Environment**: Imported cases are protected from modification
- **Bidirectional Data Exchange**: Structured export/import process between examiners
- **PDF Integration**: Confirmations appear in generated reports with full attribution

### Data Structure

```json
{
  "fullName": "Jane Smith",
  "badgeId": "ATF-12345",
  "timestamp": "September 22, 2025 at 3:45 PM",
  "confirmationId": "CONF-a1b2c3d4e5f6",
  "confirmedBy": "user_uid_string",
  "confirmedByEmail": "jane.smith@lab.gov",
  "confirmedByCompany": "Federal Crime Laboratory",
  "confirmedAt": "2025-09-22T19:45:30.123Z"
}
```

## Roles and Responsibilities

### Original Examiner (OE)

- Performs initial firearms examination and comparison
- Creates annotations and analysis in Striae
- Marks images requiring confirmation
- Exports case packages for review
- Imports received confirmation data
- Generates final reports with confirmation information

### Reviewing Examiner (RE)

- Receives case packages for independent review
- Imports packages into read-only Striae environment
- Conducts independent examination of physical evidence
- Provides digital confirmation through Striae interface
- Exports confirmation data back to original examiner
- Signs physical documentation during technical review

## Complete Confirmation Workflow

### Phase 1: Original Examination

1. **Case Setup and Analysis**
   - Original examiner creates new case in Striae
   - Uploads evidence images for comparison analysis
   - Performs detailed examination and creates annotations

2. **Marking for Confirmation**
   - Examiner toggles "Include confirmation" checkbox in Notes sidebar
   - This flags the image for confirmation requirement
   - System tracks which images require independent verification

3. **Annotation Completion**
   - Complete all necessary box annotations and classifications
   - Add detailed notes and observations
   - Ensure all analysis is documented before export

### Phase 2: Export for Review

1. **Case Export Process**
   - Navigate to Case Export in sidebar
   - Select "ZIP Package" export format and JSON data format
   - Ensure "Include Images" option is selected
   - Click "Export Case"

2. **Package Contents**
   - Complete case data in JSON format with forensic protection warnings
   - All associated evidence images
   - Metadata including export timestamp and examiner information
   - Cryptographic SHA-256 hashes for integrity verification

3. **Delivery to Reviewing Examiner**
   - Transfer ZIP package through secure channels
   - Include any necessary chain of custody documentation
   - Provide access to physical evidence for independent examination

### Phase 3: Reviewing Examiner Import

1. **Package Import**
   - Open Striae application with reviewing examiner credentials
   - Navigate to Case Import in sidebar
   - Select received ZIP package file
   - Review import preview showing case details

2. **Import Validation**
   - System validates package integrity using SHA-256 hashes
   - Confirms reviewing examiner is not the original analyst (security check)
   - Imports case data in read-only mode
   - Case appears in read-only cases list

3. **Read-Only Environment**
   - Imported case cannot be modified or edited
   - All annotations and images are view-only
   - Reviewing examiner can examine but not alter original work

### Phase 4: Confirmation Process

1. **Independent Examination**
   - Reviewing examiner accesses physical evidence
   - Conducts independent analysis and comparison
   - Reviews original examiner's conclusions and annotations

2. **Digital Confirmation**
   - If conclusions are confirmed, click "Confirm" button in Striae
   - Confirmation modal opens requiring examiner credentials
   - Enter full name and badge/ID number
   - System generates unique confirmation ID

3. **Confirmation Data Creation**

   ```json
   {
     "fullName": "Entered by examiner",
     "badgeId": "Entered by examiner", 
     "timestamp": "Human-readable timestamp",
     "confirmationId": "System-generated unique ID",
     "confirmedBy": "Reviewing examiner's user ID",
     "confirmedByEmail": "From user profile",
     "confirmedByCompany": "From user profile",
     "confirmedAt": "ISO timestamp"
   }
   ```

4. **Confirmation Validation**
   - System validates examiner credentials
   - Confirmation is linked to specific original image ID
   - Timestamp and unique ID are recorded
   - Confirmation becomes part of case record

### Phase 5: Confirmation Export

1. **Export Confirmation Data**
   - After confirming, navigate to Case Export
   - System detects confirmation data is available
   - Click "Export Confirmations" button
   - Downloads `confirmation-data-[case]-[timestamp].json` file

2. **Confirmation File Contents**

   ```json
   {
     "metadata": {
       "caseNumber": "CASE-2025-001",
       "exportDate": "2025-09-22T19:45:30.123Z",
       "exportedBy": "Reviewing Examiner Name",
       "exportedByUid": "user_uid_string",
       "exportedByCompany": "Federal Crime Laboratory",
       "totalConfirmations": 1,
       "version": "1.0",
       "hash": "SHA256_HASH"
     },
     "confirmations": {
       "original_image_id": [{
         "fullName": "Jane Smith",
         "badgeId": "ATF-12345",
         "confirmationId": "CONF-a1b2c3d4e5f6",
         "timestamp": "September 22, 2025 at 3:45 PM",
         "confirmedAt": "2025-09-22T19:45:30.123Z"
       }]
     }
   }
   ```

3. **Secure Transfer**
   - Transfer confirmation file to original examiner
   - Maintain chain of custody documentation
   - Use secure communication channels

### Phase 6: Confirmation Import

1. **Import Confirmation Data**
   - Original examiner opens Striae
   - Navigate to Case Import in sidebar
   - Select received confirmation JSON file
   - System validates file format and checksum

2. **Validation Process**
   - System verifies confirmation data integrity
   - Confirms case number matches
   - Validates examining credentials
   - Checks for duplicate confirmations

3. **Integration with Case Data**
   - Confirmation data is integrated with original case
   - Images marked as confirmed become read-only
   - No additional confirmations can be added to confirmed images
   - Confirmation information appears in case metadata

### Phase 7: Final Documentation

1. **Confirmed Image Status**
   - Confirmed images show confirmation indicator in UI
   - Edit functions are disabled for confirmed images
   - Box annotations become permanent and uneditable
   - Additional confirmations cannot be added

2. **PDF Report Generation**
   - Generate PDF report including confirmation information
   - Confirmation details appear with examiner credentials
   - Unique confirmation IDs included for audit trail
   - Timestamps and digital signatures documented

3. **Physical Documentation**
   - Reviewing examiner provides wet signature/initials during technical review
   - Physical case documentation includes confirmation details
   - Chain of custody records updated with confirmation information

## Technical Implementation

### Confirmation Data Structure

The system uses structured JSON data for confirmation information:

```typescript
interface ConfirmationData {
  fullName: string;           // Confirming examiner's full name
  badgeId: string;            // Badge/ID number  
  timestamp: string;          // Human-readable timestamp
  confirmationId: string;     // Unique ID
  confirmedBy: string;        // User UID
  confirmedByEmail: string;   // Email address
  confirmedByCompany: string; // Laboratory/Company
  confirmedAt: string;        // ISO timestamp
}
```

### Import/Export Process

- **Case Export**: Complete ZIP packages with images and metadata
- **Confirmation Export**: Specialized JSON files with confirmation data only
- **Integrity Validation**: SHA-256 hashes for data verification
- **Security Checks**: Prevents self-confirmation and duplicate imports

### UI Integration

- **Confirmation Modal**: Captures examiner credentials and generates unique IDs
- **Read-Only Interface**: Prevents modification of imported cases
- **Status Indicators**: Visual confirmation status in interface
- **Export Controls**: Context-aware export options based on confirmation data

## Validation and Security Framework

### User Validation

#### Authentication Requirements

The confirmation system implements multi-layer user validation to ensure only authorized personnel can confirm examinations:

**Primary Authentication**:

- User must be authenticated through Firebase Auth with valid credentials
- Active session required throughout confirmation process
- User profile must include required forensic examiner information

**Examiner Credential Validation**:

```typescript
// Required fields in confirmation modal
{
  fullName: "Reviewing examiner's full name",
  badgeId: "Agency badge or identification number",
  company: "Laboratory or agency affiliation"
}
```

**Authorization Checks**:

- System prevents self-confirmation (original examiner cannot confirm own work)
- User permissions validated against case access rights
- Company/laboratory affiliation verified through user profile

#### User Profile Requirements

For confirmation capabilities, user profiles must contain:

- **Full Legal Name**: Used for official confirmation documentation
- **Badge/Certification ID**: Official examiner identification number
- **Laboratory/Agency**: Official organizational affiliation
- **Email Verification**: Confirmed email address for audit trail
- **Active Status**: Account must be in good standing

### Hash Validation

#### Forensic Data Integrity

The system uses SHA-256 cryptographic hashes to ensure data integrity throughout the confirmation process:

**Export Hash Generation**:

```typescript
// Hash calculated on clean JSON data (without forensic warnings)
const cleanedContent = removeForensicWarning(jsonContent);
const hash = await calculateSHA256(cleanedContent);
```

**Import Validation Process**:

1. Extract expected hash from file metadata
2. Remove forensic protection warnings from content
3. Calculate actual hash on cleaned content
4. Compare expected vs actual hashes
5. Reject import if hashes don't match

**Forensic Warning Handling**:

```typescript
// Forensic warnings are automatically added during export
/* CASE DATA WARNING
 * This file contains evidence data for forensic examination.
 * Any modification may compromise the integrity of the evidence.
 * Handle according to your organization's chain of custody procedures.
 * 
 * File generated: YYYY-MM-DDTHH:mm:ss.sssZ
 */
```

**Hash Verification Details**:

- SHA-256 hashes validate complete case data packages
- Confirmation exports include separate hashes for confirmation data only
- Any modification to exported files invalidates hashes
- Failed hash validation prevents import and logs security event

#### Implementation Example

```typescript
export async function validateConfirmationHash(
  jsonContent: string, 
  expectedHash: string
): Promise<boolean> {
  // Parse confirmation data
  const data = JSON.parse(jsonContent);
  
  // Create data without hash for validation
  const dataWithoutHash = {
    ...data,
    metadata: {
      ...data.metadata,
      hash: undefined
    }
  };
  delete dataWithoutHash.metadata.hash;
  
  // Calculate hash on clean data
  const contentForHash = JSON.stringify(dataWithoutHash, null, 2);
  const actualHash = await calculateSHA256(contentForHash);
  
  // Compare hashes (case-insensitive)
  return actualHash.toUpperCase() === expectedHash.toUpperCase();
}
```

### File Validation Framework

#### File Type Detection

The system automatically detects and validates different file types in the import process:

**Case Package Files (ZIP)**:

- Must contain `data.json` with complete case information
- Image files in supported formats (JPEG, PNG)
- Metadata file with export information
- All files validated for integrity and completeness

**Confirmation Data Files (JSON)**:

```typescript
// Detected by filename pattern
function isConfirmationDataFile(filename: string): boolean {
  return filename.startsWith('confirmation-data') && filename.endsWith('.json');
}
```

**File Structure Validation**:

- ZIP packages: Validated for complete case data structure
- JSON files: Schema validation against expected confirmation format
- Image files: Format verification and integrity checks
- Metadata: Required fields and format validation

#### Import Validation Pipeline

##### Step 1: File Format Validation

```typescript
// Validate file type and basic structure
const isValidZip = await validateZipStructure(file);
const isValidJSON = validateJSONFormat(content);
const isConfirmationFile = isConfirmationDataFile(filename);
```

##### Step 2: Content Validation

- Schema validation against expected data structure
- Required field presence verification
- Data type and format validation
- Range and constraint checks

##### Step 3: Timestamp Validation

- **Confirmation Time Verification**: System validates that confirmation timestamps are not earlier than the last modification time of the associated annotation data
- **Data Integrity Check**: Ensures confirmations were created after the annotations were finalized, preventing confirmations of outdated or modified work
- **Annotation History Protection**: Uses the `updatedAt` timestamp from annotation data to verify confirmation validity

##### Step 4: Security Validation

```typescript
// Security checks during import
const securityChecks = {
  preventSelfConfirmation: validateExporterUid(exporterUid, currentUser),
  hashIntegrity: await validateHash(content, expectedHash),
  userPermissions: validateUserAccess(user, caseData),
  dataIntegrity: validateCaseIntegrity(caseData, imageFiles)
};
```

##### Step 5: Business Logic Validation

- Case number format and uniqueness
- Confirmation data consistency
- Image mapping validation
- Timestamp and version checks

#### Validation Error Handling

**Import Failures with Detailed Messages**:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

// Example validation responses
{
  isValid: false,
  errors: [
    "Hash validation failed - file may have been modified",
    "Cannot import case where you were the original examiner",
    "Required confirmation metadata is missing"
  ],
  warnings: [
    "Case was exported with older version of Striae",
    "Some image files could not be validated"
  ],
  canProceed: false
}
```

**Progressive Validation Approach**:

1. **Critical Errors**: Stop import process immediately
2. **Warnings**: Display to user but allow continuation
3. **Info Messages**: Provide context about import process
4. **Success Confirmation**: Detailed summary of imported data

### Data Integrity Monitoring

#### Audit Trail Generation

Every validation step creates audit trail entries:

**Validation Events Logged**:

- User authentication attempts and results
- File upload and validation attempts
- Hash verification results
- Import success/failure with detailed reasons
- Confirmation creation and validation

**Audit Data Structure**:

```typescript
interface ValidationAuditEntry {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: 'import' | 'export' | 'confirm' | 'validate';
  result: 'success' | 'failure' | 'warning';
  details: {
    fileName: string;
    fileType: 'case-package' | 'confirmation-data';
    hashValid: boolean;
    validationErrors: string[];
    caseNumber?: string;
    confirmationId?: string;
  };
}
```

#### Real-time Validation Feedback

The UI provides immediate feedback during validation:

**Progress Indicators**:

- File upload progress
- Validation step completion
- Import/export status updates
- Error resolution guidance

**User Feedback Mechanisms**:

- Color-coded validation status (green/yellow/red)
- Detailed error messages with resolution steps
- Progress bars for multi-step operations
- Success confirmations with operation summaries

### Security Best Practices

- **File Validation**: All file processing in isolated sandbox environment
- **Access Control**: Role-based permissions and laboratory restrictions
- **Compliance**: OSAC forensic standards alignment¹ with complete audit trails

## Security Features

### Authentication and Authorization

- **Multi-Layer Authentication**: Firebase Auth with active session requirements
- **Examiner Credential Validation**: Badge ID, full name, and company verification
- **Self-Confirmation Prevention**: System blocks original examiners from confirming own work
- **Role-Based Permissions**: Different validation rules by user role and laboratory affiliation
- **Session Management**: Validation state tied to active authenticated sessions

### Data Integrity and Protection

- **Cryptographic Hashes**: SHA-256 validation prevents tampering and detects corruption
- **Forensic Data Warnings**: Automatic warnings on exported files about evidence integrity
- **Immutable Confirmation Records**: Once created, confirmations cannot be modified
- **File Type Restrictions**: Only allowed file types (ZIP, JSON) accepted for security
- **Size Limits**: Maximum file sizes enforced to prevent malicious uploads
- **Content Scanning**: Basic malware detection on all file uploads

### Access Controls and Restrictions

- **Read-Only Import Mode**: Imported cases cannot be modified, only reviewed
- **Edit Restrictions**: Confirmed images become permanently uneditable
- **Time-Based Access**: Validation windows and session expiration handling
- **Laboratory Restrictions**: Cross-laboratory validation controls and permissions
- **Export Controls**: Restricted data handling for sensitive forensic cases

### Audit Trail and Compliance

- **Unique Confirmation IDs**: System-generated identifiers for tracking
- **Complete Timestamp Records**: ISO timestamps and human-readable formats
- **Examiner Credential Logging**: Full authentication details in audit trail
- **Chain of Custody**: Validation events maintain complete custody records
- **Digital Signatures**: Cryptographic verification of authenticity and integrity
- **Regulatory Compliance**: Alignment with OSAC forensic science standards¹
- **Validation Event Logging**: All import/export/confirmation actions recorded with details

## Best Practices

### For Original Examiners

1. **Complete Analysis First**: Finish all annotations before exporting for confirmation
2. **Clear Documentation**: Provide detailed notes and observations
3. **Secure Transfer**: Use established secure channels for case package transfer
4. **Verify Imports**: Check confirmation data carefully before integration

### For Reviewing Examiners

1. **Independent Analysis**: Conduct examination without bias from original conclusions
2. **Physical Evidence**: Always examine actual evidence, not just digital annotations
3. **Accurate Credentials**: Ensure badge ID and name are correctly entered
4. **Timely Response**: Complete confirmations promptly to avoid delays

### Administrative

1. **Chain of Custody**: Maintain proper documentation throughout process
2. **Version Control**: Track confirmation file versions and checksums
3. **Backup Systems**: Ensure confirmation data is properly backed up
4. **Training**: Ensure all examiners understand the complete workflow

## Troubleshooting

### Common Issues

#### Import Failures

- **Invalid Hash**: File may have been corrupted during transfer
- **Wrong Format**: Ensure correct file type (ZIP for cases, JSON for confirmations)
- **Self-Confirmation**: System prevents importing cases where user was original examiner

#### Export Problems

- **Missing Images**: Ensure "Include Images" is selected for case exports
- **No Confirmation Data**: Must have confirmations before exporting confirmation files
- **Permission Errors**: Verify user has appropriate access rights

#### Confirmation Issues

- **Modal Not Opening**: Check for browser popup blockers
- **Invalid Credentials**: Verify badge ID and name format requirements
- **Duplicate Confirmations**: Each image can only be confirmed once

### Resolution Steps

1. **Check File Integrity**: Verify hashes match expected values
2. **Validate User Permissions**: Ensure proper access rights
3. **Review Error Messages**: System provides specific error details
4. **Contact Support**: Include error messages and file details when requesting help

### Data Recovery

- **Backup Confirmation Files**: Keep copies of all confirmation exports
- **Export History**: Maintain records of all case transfers
- **Audit Trail**: Use confirmation IDs to track specific confirmations
- **Version Control**: Track file versions for troubleshooting

---

## References

¹ **OSAC Forensic Science Standards**: The Organization of Scientific Area Committees (OSAC) for Forensic Science, administered by NIST, develops technically sound standards and guidelines for forensic disciplines:

- [NIST OSAC Overview](https://www.nist.gov/adlp/spo/organization-scientific-area-committees-forensic-science) - Organization of Scientific Area Committees for Forensic Science
- [OSAC Registry](https://www.nist.gov/osac/registry) - Registry of approved forensic science standards  
- [NIST Firearms and Toolmarks](https://www.nist.gov/firearms-and-toolmarks) - NIST research and standards for firearms examination
- [OSAC Standards Library](https://www.nist.gov/osac/standards-library) - Complete library of forensic science standards

**Additional Forensic Standards Resources**:

- [NIST Forensic Science Program](https://www.nist.gov/forensic-science) - General forensic science standards and research
- [ASTM Forensic Sciences Standards & Publications](https://store.astm.org/products-services/standards-and-publications.html) - Industry standards for forensic practices
- [ISO/IEC 17025](https://www.iso.org/ISO-IEC-17025-testing-and-calibration-laboratories.html) - General requirements for testing and calibration laboratories

---

*Need additional help? Don't hesitate to reach out to our [support team](https://www.striae.org/support). We're here to ensure you have secure and seamless access to Striae's features.*
