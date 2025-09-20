# Case Import Component Integration Guide

## Component Overview
The CaseImport component provides a modal interface for importing ZIP files containing exported case data for read-only review.

## Key Features

### 🔄 Single Case Management
- Automatically checks for existing read-only cases
- Enforces "one case at a time" rule
- Provides clear UI to remove existing cases before importing new ones

### 📁 File Handling
- ZIP file validation with drag-and-drop interface
- File size display
- Clear error messages for invalid files

### 📊 Progress Tracking
- Real-time import progress with stage descriptions
- Detailed progress bar and percentage
- Status updates during each import phase

### 🛡️ Error Handling
- Comprehensive error reporting
- Success confirmations
- Automatic cleanup on failures

## Integration Example

```tsx
import { useState } from 'react';
import { CaseImport } from '~/components/sidebar/case-import';
import { ImportResult } from '~/components/actions/case-review';

export const SidebarWithImport = () => {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImportComplete = (result: ImportResult) => {
    if (result.success) {
      console.log(`Successfully imported: ${result.caseNumber}`);
      console.log(`Files imported: ${result.filesImported}`);
      console.log(`Annotations imported: ${result.annotationsImported}`);
      
      // Refresh case list or navigate to imported case
      // refreshCaseList();
    } else {
      console.error('Import failed:', result.errors);
    }
  };

  return (
    <div>
      <button onClick={() => setIsImportOpen(true)}>
        Import Case for Review
      </button>
      
      <CaseImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};
```

## Props Interface

```tsx
interface CaseImportProps {
  isOpen: boolean;                                    // Controls modal visibility
  onClose: () => void;                               // Called when modal closes
  onImportComplete?: (result: ImportResult) => void; // Called after successful import
}
```

## ImportResult Structure

```tsx
interface ImportResult {
  success: boolean;           // Import success status
  caseNumber: string;         // Imported case number
  isReadOnly: boolean;        // Always true for imports
  filesImported: number;      // Number of images imported
  annotationsImported: number; // Number of annotation sets imported
  errors?: string[];          // Error messages if any
  warnings?: string[];        // Warning messages if any
}
```

## User Experience Flow

1. **Open Modal**: User clicks import button
2. **Check Existing**: Component checks for existing read-only cases
3. **Clear if Needed**: If case exists, user must clear it first
4. **Select File**: User selects ZIP file (validated automatically)
5. **Import Process**: 
   - Parse ZIP contents
   - Upload images
   - Create case structure
   - Import annotations
   - Update user profile
6. **Completion**: Success message and auto-close

## Styling

The component uses the same design system as case-export:
- Modal overlay with backdrop blur
- Consistent button styling with hover effects
- Progress indicators with smooth animations
- Color-coded status messages (success=green, error=red, warning=orange)
- Responsive design with proper spacing

## Error Scenarios Handled

- **Invalid Files**: Non-ZIP files rejected with clear message
- **Malformed Archives**: Missing or corrupted data files
- **Duplicate Cases**: Existing read-only case prevention
- **Network Failures**: Upload or API communication errors
- **Permission Issues**: Authentication or authorization problems
- **Storage Limits**: File size or quota exceeded

## Security Features

- **File Validation**: ZIP format verification
- **Content Validation**: Case data structure verification
- **Authentication**: User session validation
- **Read-Only Enforcement**: Imported cases marked as non-editable
- **Audit Trail**: Full import tracking with timestamps

## Performance Considerations

- **Lazy Loading**: JSZip imported dynamically to reduce bundle size
- **Progress Feedback**: Real-time updates prevent UI freeze perception
- **Memory Management**: Files processed in chunks where possible
- **Auto-cleanup**: Failed imports don't leave partial data

## Next Steps for Integration

1. Add import button to your sidebar/toolbar
2. Handle the onImportComplete callback to refresh UI
3. Update case listing to distinguish read-only cases
4. Consider adding import history or audit log
5. Implement case switching between regular and read-only modes