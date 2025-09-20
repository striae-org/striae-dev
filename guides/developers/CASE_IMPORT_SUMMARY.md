# Case Import for Read-Only Review - Implementation Summary

## Overview
The case import functionality allows users to import ZIP archives (created by case-export.ts) for read-only viewing. This creates a parallel system where users can review cases without modification capabilities.

## Core Architecture

### Data Flow
1. **ZIP Archive Parsing**: Extract case data (JSON) and image files
2. **User Database Update**: Add read-only case metadata to user profile
3. **R2 Storage**: Create case data structure with read-only flags
4. **Image Upload**: Upload images to Cloudflare Images service
5. **Annotation Import**: Restore all annotations using existing notes system

### Key Components

#### 1. `parseImportZip(zipFile: File)`
- Extracts and validates ZIP archive contents
- Supports forensic-protected exports (removes warnings)
- Maps image files and validates case data structure
- Returns structured data for import process

#### 2. `importCaseForReview(user, zipFile, options, onProgress)`
- Main orchestration function for the import process
- Handles all steps with progress reporting
- Implements error handling and partial cleanup
- Returns detailed import results

#### 3. Read-Only Case Management
- `checkReadOnlyCaseExists()`: Prevent duplicate imports
- `listReadOnlyCases()`: Get user's read-only cases
- `removeReadOnlyCase()`: Remove from user's list (data remains)

## Database Schema Changes

### UserData Extended Interface
```typescript
interface UserData {
  // ... existing fields
  readOnlyCases?: Array<{
    caseNumber: string;
    importedAt: string;
    originalExportDate: string;
    originalExportedBy: string;
    sourceChecksum?: string;
    isReadOnly: true;
  }>;
}
```

### R2 Case Data Structure
```typescript
{
  createdAt: string;
  caseNumber: string;
  files: FileData[];
  // Read-only specific fields
  isReadOnly: true;
  importedAt: string;
  originalMetadata: CaseExportData['metadata'];
  originalSummary?: CaseExportData['summary'];
}
```

## Security & Integrity Features

### 1. Validation
- **Case Number Format**: Enforces existing validation rules
- **File Integrity**: Validates referenced vs. actual image files
- **Metadata Completeness**: Ensures required fields are present
- **Annotation Consistency**: Checks annotation flags vs. data

### 2. Read-Only Enforcement
- **Database Flags**: `isReadOnly: true` in all data structures
- **User Separation**: Read-only cases stored separately from regular cases
- **Import Tracking**: Full provenance and timestamp information

### 3. Forensic Support
- **Checksum Preservation**: Maintains original content checksums
- **Metadata Retention**: Preserves original export information
- **Warning Removal**: Cleanly handles forensic protection warnings

## Import Process Flow

```
1. ZIP File Upload (UI) 
   ↓
2. parseImportZip() - Extract & validate contents
   ↓
3. checkReadOnlyCaseExists() - Prevent duplicates
   ↓
4. Upload Images Loop:
   - uploadImageBlob() for each image
   - Build file mapping (originalName → newFileId)
   ↓
5. storeCaseDataInR2() - Create case structure
   ↓
6. importAnnotations() - Restore all annotations
   ↓
7. addReadOnlyCaseToUser() - Update user profile
   ↓
8. Return ImportResult with detailed status
```

## Error Handling Strategy

### Validation Errors
- Invalid ZIP format or missing data files
- Malformed case data or missing required fields
- Case number format violations

### Import Errors  
- Image upload failures (partial import possible)
- R2 storage failures (rollback required)
- User database update failures

### Recovery Mechanisms
- Detailed error reporting in ImportResult
- Warning system for non-critical issues
- TODO: Cleanup mechanism for partial failures

## Integration Points

### Existing Systems Used
- **case-manage.ts**: `validateCaseNumber()` for validation
- **image-manage.ts**: Upload infrastructure (adapted for blobs)
- **notes-manage.ts**: `saveNotes()` for annotation import
- **auth utils**: API key management for all worker communications

### Worker APIs
- **USER_WORKER_URL**: User profile management
- **DATA_WORKER_URL**: R2 case data storage
- **IMAGE_WORKER_URL**: Image upload and processing

## Options & Configuration

### ImportOptions
```typescript
interface ImportOptions {
  overwriteExisting?: boolean;    // Replace existing read-only case
  validateIntegrity?: boolean;    // Run integrity checks
  preserveTimestamps?: boolean;   // Keep original timestamps
}
```

### Progress Reporting
- Stage-based progress updates
- File-level upload progress
- Detailed status messages for UI feedback

## Next Steps for UI Implementation

### Required Components
1. **ZIP File Upload**: Drag-and-drop or file picker
2. **Import Progress Dialog**: Multi-stage progress indicator
3. **Case Browser**: List read-only vs. regular cases
4. **Import Results Display**: Success/error/warning summary
5. **Read-Only Indicators**: Clear visual distinction in UI

### Integration Requirements
1. **Authentication**: Ensure user is logged in
2. **Permissions**: Check if user can import cases
3. **Storage Limits**: Consider limits for read-only cases
4. **Navigation**: Seamless switching between regular and read-only cases

### Error UI Patterns
1. **Validation Errors**: Clear messages about ZIP format issues
2. **Upload Progress**: Real-time feedback with cancel option
3. **Partial Failures**: Show what succeeded and what failed
4. **Retry Mechanisms**: Allow retrying failed uploads

This implementation provides a robust foundation for case import functionality while maintaining the integrity and security requirements of the forensic application.