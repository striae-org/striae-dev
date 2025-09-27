import { CaseExportData } from '~/types';
import { calculateCRC32Secure } from '~/utils/CRC32';
import { CSV_HEADERS } from './types-constants';
import { addForensicDataWarning } from './metadata-helpers';

/**
 * Generate metadata rows for tabular format
 */
export function generateMetadataRows(exportData: CaseExportData): string[][] {
  return [
    ['Case Export Report'],
    [''],
    ['Case Number', exportData.metadata.caseNumber],
    ['Case Created Date', exportData.metadata.caseCreatedDate],
    ['Export Date', exportData.metadata.exportDate],
    ['Exported By (Email)', exportData.metadata.exportedBy || 'N/A'],
    ['Exported By (UID)', exportData.metadata.exportedByUid || 'N/A'],
    ['Exported By (Name)', exportData.metadata.exportedByName || 'N/A'],
    ['Exported By (Company)', exportData.metadata.exportedByCompany || 'N/A'],
    ['Striae Export Schema Version', exportData.metadata.striaeExportSchemaVersion],
    ['Total Files', exportData.metadata.totalFiles.toString()],
    [''],
    ['Summary'],
    ['Files with Annotations', (exportData.summary?.filesWithAnnotations || 0).toString()],
    ['Files without Annotations', (exportData.summary?.filesWithoutAnnotations || 0).toString()],
    ['Total Box Annotations', (exportData.summary?.totalBoxAnnotations || 0).toString()],
    ['Files with Confirmations', (exportData.summary?.filesWithConfirmations || 0).toString()],
    ['Files with Confirmations Requested', (exportData.summary?.filesWithConfirmationsRequested || 0).toString()],
    ['Last Modified', exportData.summary?.lastModified || 'N/A'],
    ['Earliest Annotation Date', exportData.summary?.earliestAnnotationDate || 'N/A'],
    ['Latest Annotation Date', exportData.summary?.latestAnnotationDate || 'N/A'],
    [''],
    ['File Details']
  ];
}

/**
 * Process file data for tabular format (CSV/Excel)
 */
export function processFileDataForTabular(fileEntry: CaseExportData['files'][0]): string[][] {
  // Full file data for the first row (excluding Additional Notes and Last Updated)
  const fullFileData = [
    fileEntry.fileData.id,
    fileEntry.fileData.originalFilename,
    fileEntry.fileData.uploadedAt,
    fileEntry.hasAnnotations ? 'Yes' : 'No',
    fileEntry.annotations?.leftCase || '',
    fileEntry.annotations?.rightCase || '',
    fileEntry.annotations?.leftItem || '',
    fileEntry.annotations?.rightItem || '',
    fileEntry.annotations?.caseFontColor || '',
    fileEntry.annotations?.classType || '',
    fileEntry.annotations?.customClass || '',
    fileEntry.annotations?.classNote || '',
    fileEntry.annotations?.indexType || '',
    fileEntry.annotations?.indexNumber || '',
    fileEntry.annotations?.indexColor || '',
    fileEntry.annotations?.supportLevel || '',
    fileEntry.annotations?.hasSubclass ? 'Yes' : 'No',
    fileEntry.annotations?.includeConfirmation ? 'Yes' : 'No',
    fileEntry.annotations?.confirmationData ? 'Confirmed' : (fileEntry.annotations?.includeConfirmation ? 'Requested' : 'Not Requested'),
    fileEntry.annotations?.confirmationData?.fullName || '',
    fileEntry.annotations?.confirmationData?.badgeId || '',
    fileEntry.annotations?.confirmationData?.confirmedByEmail || '',
    fileEntry.annotations?.confirmationData?.confirmedByCompany || '',
    fileEntry.annotations?.confirmationData?.confirmationId || '',
    fileEntry.annotations?.confirmationData?.timestamp || '',
    fileEntry.annotations?.confirmationData?.confirmedAt || '',
    (fileEntry.annotations?.boxAnnotations?.length || 0).toString()
  ];

  // Additional Notes and Last Updated (at the end)
  const additionalFileData = [
    fileEntry.annotations?.additionalNotes || '',
    fileEntry.annotations?.updatedAt || ''
  ];

  // Calculate array sizes programmatically from CSV_HEADERS
  const fileDataColumnCount = fullFileData.length; // Dynamic count based on actual data
  const additionalDataColumnCount = additionalFileData.length; // Dynamic count based on actual data

  // Empty row template for subsequent box annotations (file info columns empty)
  const emptyFileData = Array(fileDataColumnCount).fill('');
  const emptyAdditionalData = Array(additionalDataColumnCount).fill('');

  const rows: string[][] = [];

  // If there are box annotations, create a row for each one
  if (fileEntry.annotations?.boxAnnotations && fileEntry.annotations.boxAnnotations.length > 0) {
    fileEntry.annotations.boxAnnotations.forEach((box, index) => {
      const rowData = index === 0 ? fullFileData : emptyFileData;
      const additionalData = index === 0 ? additionalFileData : emptyAdditionalData;
      
      rows.push([
        ...rowData,
        box.id,
        box.x.toString(),
        box.y.toString(),
        box.width.toString(),
        box.height.toString(),
        box.color || '',
        box.label || '',
        box.timestamp || '',
        ...additionalData
      ]);
    });
  } else {
    // If no box annotations, still include one row with empty box data
    rows.push([
      ...fullFileData,
      '', // Box ID
      '', // Box X
      '', // Box Y
      '', // Box Width
      '', // Box Height
      '', // Box Color
      '', // Box Label
      '', // Box Timestamp
      ...additionalFileData
    ]);
  }

  return rows;
}

/**
 * Generate CSV content from export data
 */
export function generateCSVContent(exportData: CaseExportData, protectForensicData: boolean = true): string {
  // Case metadata section
  const metadataRows = generateMetadataRows(exportData);

  // File data rows
  const fileRows: string[][] = [];
  exportData.files.forEach(fileEntry => {
    const processedRows = processFileDataForTabular(fileEntry);
    fileRows.push(...processedRows);
  });

  // Combine data rows for checksum calculation (excluding header comments)
  const dataRows = [
    ...metadataRows,
    CSV_HEADERS,
    ...fileRows
  ];

  const csvDataContent = dataRows.map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Calculate checksum for integrity verification
  const checksum = calculateCRC32Secure(csvDataContent);
  
  // Create final CSV with checksum header
  const csvWithChecksum = [
    `# Striae Case Export - Generated: ${new Date().toISOString()}`,
    `# Case: ${exportData.metadata.caseNumber}`,
    `# Total Files: ${exportData.metadata.totalFiles}`,
    `# CRC32 Checksum: ${checksum.toUpperCase()}`,
    '# Verification: Recalculate CRC32 of data rows only (excluding these comment lines)',
    '',
    csvDataContent
  ].join('\n');

  // Add forensic protection warning if enabled
  return protectForensicData ? addForensicDataWarning(csvWithChecksum, 'csv') : csvWithChecksum;
}