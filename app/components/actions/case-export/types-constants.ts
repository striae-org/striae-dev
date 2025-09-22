export type ExportFormat = 'json' | 'csv';

// Shared CSV headers for all tabular exports
export const CSV_HEADERS = [
  'File ID',
  'Original Filename',
  'Upload Date',
  'Has Annotations',
  'Left Case',
  'Right Case',
  'Left Item',
  'Right Item',
  'Case Font Color',
  'Class Type',
  'Custom Class',
  'Class Note',
  'Index Type',
  'Index Number',
  'Index Color',
  'Support Level',
  'Has Subclass',
  'Include Confirmation',
  'Confirmation Status',
  'Confirming Examiner Name',
  'Confirming Examiner Badge ID',
  'Confirming Examiner Email',
  'Confirming Examiner Company',
  'Confirmation ID',
  'Confirmation Timestamp',
  'Confirmation Date (ISO)',
  'Total Box Annotations',
  'Box ID',
  'Box X',
  'Box Y',
  'Box Width',
  'Box Height',
  'Box Color',
  'Box Label',
  'Box Timestamp',
  'Additional Notes',
  'Last Updated'
];

/**
 * Helper function to format date for filename
 */
export function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}