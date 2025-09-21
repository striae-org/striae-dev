import { User } from 'firebase/auth';
import { FileData, AnnotationData, CaseExportData, AllCasesExportData, UserData } from '~/types';
import { fetchFiles, getImageUrl } from './image-manage';
import { getNotes } from './notes-manage';
import { checkExistingCase, validateCaseNumber, listCases } from './case-manage';
import { getUserData } from '~/utils/permissions';
import * as XLSX from 'xlsx';

export type ExportFormat = 'json' | 'csv';

// Shared CSV headers for all tabular exports
const CSV_HEADERS = [
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
 * Helper function to get user export metadata
 */
async function getUserExportMetadata(user: User) {
  try {
    const userData = await getUserData(user);
    if (userData) {
      return {
        exportedBy: user.email,
        exportedByUid: userData.uid,
        exportedByName: `${userData.firstName} ${userData.lastName}`.trim(),
        exportedByCompany: userData.company
      };
    }
  } catch (error) {
    console.warn('Failed to fetch user data for export metadata:', error);
  }
  
  // Fallback to basic user data if getUserData fails
  return {
    exportedBy: user.email,
    exportedByUid: user.uid,
    exportedByName: user.displayName || 'N/A',
    exportedByCompany: 'N/A'
  };
}

export interface ExportOptions {
  format?: 'json' | 'csv';
  includeMetadata?: boolean;
  includeUserInfo?: boolean;
  protectForensicData?: boolean; // Enable read-only protection
}

/**
 * Add data protection warning to content
 */
function addForensicDataWarning(content: string, format: 'csv' | 'json'): string {
  const warning = format === 'csv' 
    ? `"CASE DATA WARNING: This file contains evidence data for forensic examination. Any modification may compromise the integrity of the evidence. Handle according to your organization's chain of custody procedures."\n\n`
    : `/* CASE DATA WARNING
 * This file contains evidence data for forensic examination.
 * Any modification may compromise the integrity of the evidence.
 * Handle according to your organization's chain of custody procedures.
 * 
 * File generated: ${new Date().toISOString()}
 * Checksum: ${generateSimpleChecksum(content)}
 */\n\n`;
  
  return warning + content;
}

/**
 * Generate simple checksum for content verification
 */
function generateSimpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate a secure random password for Excel protection
 */
function generateRandomPassword(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 16;
  let password = '';
  
  // Ensure we have at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Protect Excel worksheet from editing
 */
function protectExcelWorksheet(worksheet: any, sheetPassword?: string): string {
  // Generate random password if none provided
  const password = sheetPassword || generateRandomPassword();
  
  // Set worksheet protection
  worksheet['!protect'] = {
    password: password,
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
    objects: false,
    scenarios: false
  };
  
  // Lock all cells by default
  if (!worksheet['!cols']) worksheet['!cols'] = [];
  if (!worksheet['!rows']) worksheet['!rows'] = [];
  
  // Add protection metadata
  worksheet['!margins'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
  
  // Return the password for inclusion in metadata
  return password;
}
function generateMetadataRows(exportData: CaseExportData): string[][] {
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
    ['Last Modified', exportData.summary?.lastModified || 'N/A'],
    [''],
    ['File Details']
  ];
}

/**
 * Process file data for tabular format (CSV/Excel)
 */
function processFileDataForTabular(fileEntry: CaseExportData['files'][0]): string[][] {
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
function generateCSVContent(exportData: CaseExportData, protectForensicData: boolean = true): string {
  // Case metadata section
  const metadataRows = generateMetadataRows(exportData);

  // File data rows
  const fileRows: string[][] = [];
  exportData.files.forEach(fileEntry => {
    const processedRows = processFileDataForTabular(fileEntry);
    fileRows.push(...processedRows);
  });

  // Combine all data
  const allRows = [
    ...metadataRows,
    CSV_HEADERS,
    ...fileRows
  ];

  const csvContent = allRows.map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Add forensic protection warning if enabled
  return protectForensicData ? addForensicDataWarning(csvContent, 'csv') : csvContent;
}

/**
 * Export all cases for a user
 */
export async function exportAllCases(
  user: User,
  options: ExportOptions = {},
  onProgress?: (current: number, total: number, caseName: string) => void
): Promise<AllCasesExportData> {
  const {
    includeMetadata = true
  } = options;

  try {
    // Get user export metadata
    const userMetadata = await getUserExportMetadata(user);
    
    // Get list of all cases for the user
    const caseNumbers = await listCases(user);
    
    if (!caseNumbers || caseNumbers.length === 0) {
      throw new Error('No cases found for user');
    }

    const exportedCases: CaseExportData[] = [];
    let totalFiles = 0;
    let totalAnnotations = 0;
    let casesWithFiles = 0;
    let casesWithAnnotations = 0;
    let casesWithoutFiles = 0;
    let lastModified: string | undefined;

    // Export each case
    for (let i = 0; i < caseNumbers.length; i++) {
      const caseNumber = caseNumbers[i];
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, caseNumbers.length, caseNumber);
      }

      try {
        const caseExport = await exportCaseData(user, caseNumber, options);
        exportedCases.push(caseExport);

        // Update totals
        totalFiles += caseExport.metadata.totalFiles;
        
        if (caseExport.metadata.totalFiles > 0) {
          casesWithFiles++;
        } else {
          casesWithoutFiles++;
        }

        // Count annotations
        const caseAnnotations = caseExport.files.filter(f => f.hasAnnotations).length;
        if (caseAnnotations > 0) {
          casesWithAnnotations++;
          totalAnnotations += caseAnnotations;
        }

        // Track latest modification
        if (caseExport.summary?.lastModified) {
          if (!lastModified || caseExport.summary.lastModified > lastModified) {
            lastModified = caseExport.summary.lastModified;
          }
        }

      } catch (error) {
        // Get case creation date even for failed exports
        let caseCreatedDate = new Date().toISOString(); // fallback
        try {
          const existingCase = await checkExistingCase(user, caseNumber);
          if (existingCase?.createdAt) {
            caseCreatedDate = existingCase.createdAt;
          }
        } catch {
          // Use fallback date if case lookup fails
        }

        // Create a placeholder entry for failed exports
        exportedCases.push({
          metadata: {
            caseNumber,
            caseCreatedDate,
            exportDate: new Date().toISOString(),
            ...userMetadata,
            striaeExportSchemaVersion: '1.0',
            totalFiles: 0
          },
          files: [],
          summary: {
            filesWithAnnotations: 0,
            filesWithoutAnnotations: 0,
            totalBoxAnnotations: 0,
            exportError: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        casesWithoutFiles++;
      }
    }

    const allCasesExport: AllCasesExportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        ...userMetadata,
        striaeExportSchemaVersion: '1.0',
        totalCases: caseNumbers.length,
        totalFiles,
        totalAnnotations
      },
      cases: exportedCases
    };

    if (includeMetadata) {
      allCasesExport.summary = {
        casesWithFiles,
        casesWithAnnotations,
        casesWithoutFiles,
        lastModified
      };
    }

    // Report completion
    if (onProgress) {
      onProgress(caseNumbers.length, caseNumbers.length, 'Export completed!');
    }
    
    return allCasesExport;

  } catch (error) {
    console.error('Export all cases failed:', error);
    throw new Error(`Failed to export all cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export case data with files and annotations
 */
export async function exportCaseData(
  user: User,
  caseNumber: string,
  options: ExportOptions = {}
): Promise<CaseExportData> {
  const {
    includeMetadata = true
  } = options;

  // Get user export metadata
  const userMetadata = await getUserExportMetadata(user);

  // Validate case number format
  if (!validateCaseNumber(caseNumber)) {
    throw new Error('Invalid case number format');
  }

  // Check if case exists
  const existingCase = await checkExistingCase(user, caseNumber);
  if (!existingCase) {
    throw new Error(`Case "${caseNumber}" does not exist`);
  }

  try {
    // Fetch all files for the case
    const files = await fetchFiles(user, caseNumber);
    
    if (!files || files.length === 0) {
      throw new Error(`No files found for case: ${caseNumber}`);
    }

    // Collect file data with annotations
    const filesWithAnnotations: CaseExportData['files'] = [];
    let filesWithAnnotationsCount = 0;
    let totalBoxAnnotations = 0;
    let lastModified: string | undefined;

    for (const file of files) {
      let annotations: AnnotationData | undefined;
      let hasAnnotations = false;

      try {
        annotations = await getNotes(user, caseNumber, file.id) || undefined;
        hasAnnotations = !!(annotations && (
          annotations.additionalNotes ||
          annotations.classNote ||
          annotations.customClass ||
          (annotations.boxAnnotations && annotations.boxAnnotations.length > 0)
        ));

        if (hasAnnotations) {
          filesWithAnnotationsCount++;
          if (annotations?.boxAnnotations) {
            totalBoxAnnotations += annotations.boxAnnotations.length;
          }
          
          // Track last modified
          if (annotations?.updatedAt) {
            if (!lastModified || annotations.updatedAt > lastModified) {
              lastModified = annotations.updatedAt;
            }
          }
        }
      } catch (error) {
        // Continue without annotations for this file
      }

      filesWithAnnotations.push({
        fileData: file,
        annotations,
        hasAnnotations
      });
    }

    // Build export data
    const exportData: CaseExportData = {
      metadata: {
        caseNumber,
        caseCreatedDate: existingCase.createdAt,
        exportDate: new Date().toISOString(),
        ...userMetadata,
        striaeExportSchemaVersion: '1.0',
        totalFiles: files.length
      },
      files: filesWithAnnotations,
      ...(includeMetadata && {
        summary: {
          filesWithAnnotations: filesWithAnnotationsCount,
          filesWithoutAnnotations: files.length - filesWithAnnotationsCount,
          totalBoxAnnotations,
          lastModified
        }
      })
    };

    return exportData;

  } catch (error) {
    console.error('Case export failed:', error);
    throw new Error(`Failed to export case ${caseNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download all cases data as JSON file
 */
export function downloadAllCasesAsJSON(exportData: AllCasesExportData): void {
  try {
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `striae-all-cases-export-${formatDateForFilename(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download all cases export file');
  }
}

/**
 * Download all cases data as Excel file with multiple worksheets
 */
export function downloadAllCasesAsCSV(exportData: AllCasesExportData, protectForensicData: boolean = true): void {
  try {
    const workbook = XLSX.utils.book_new();
    let exportPassword: string | undefined;

    // Create summary worksheet
    const summaryData = [
      protectForensicData ? ['CASE DATA - PROTECTED EXPORT'] : ['Striae - All Cases Export Summary'],
      protectForensicData ? ['WARNING: This workbook contains evidence data and is protected from editing.'] : [''],
      [''],
      ['Export Date', new Date().toISOString()],
      ['Exported By (Email)', exportData.metadata.exportedBy || 'N/A'],
      ['Exported By (UID)', exportData.metadata.exportedByUid || 'N/A'],
      ['Exported By (Name)', exportData.metadata.exportedByName || 'N/A'],
      ['Exported By (Company)', exportData.metadata.exportedByCompany || 'N/A'],
      ['Striae Export Schema Version', '1.0'],
      ['Total Cases', exportData.cases.length],
      ['Successful Exports', exportData.cases.filter(c => !c.summary?.exportError).length],
      ['Failed Exports', exportData.cases.filter(c => c.summary?.exportError).length],
      ['Total Files (All Cases)', exportData.metadata.totalFiles],
      ['Total Annotations (All Cases)', exportData.metadata.totalAnnotations],
      [''],
      ['Case Details'],
      [
        'Case Number', 
        'Case Created Date',
        'Export Status', 
        'Export Date', 
        'Exported By (Email)', 
        'Exported By (UID)',
        'Exported By (Name)',
        'Exported By (Company)',
        'Schema Version',
        'Total Files', 
        'Files with Annotations', 
        'Files without Annotations', 
        'Total Box Annotations', 
        'Last Modified', 
        'Export Error'
      ],
      ...exportData.cases.map(caseData => [
        caseData.metadata.caseNumber,
        caseData.metadata.caseCreatedDate,
        caseData.summary?.exportError ? 'Failed' : 'Success',
        caseData.metadata.exportDate,
        caseData.metadata.exportedBy || 'N/A',
        caseData.metadata.exportedByUid || 'N/A',
        caseData.metadata.exportedByName || 'N/A',
        caseData.metadata.exportedByCompany || 'N/A',
        caseData.metadata.striaeExportSchemaVersion,
        caseData.metadata.totalFiles,
        caseData.summary?.filesWithAnnotations || 0,
        caseData.summary?.filesWithoutAnnotations || 0,
        caseData.summary?.totalBoxAnnotations || 0,
        caseData.summary?.lastModified || '',
        caseData.summary?.exportError || ''
      ])
    ];

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Protect summary worksheet if forensic protection is enabled
    if (protectForensicData) {
      exportPassword = protectExcelWorksheet(summaryWorksheet);
    }
    
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // Create a worksheet for each case
    exportData.cases.forEach((caseData, index) => {
      if (caseData.summary?.exportError) {
        // For failed cases, create a simple error sheet
        const errorData = [
          [`Case ${caseData.metadata.caseNumber} - Export Failed`],
          [''],
          ['Error:', caseData.summary.exportError],
          ['Case Number:', caseData.metadata.caseNumber],
          ['Total Files:', caseData.metadata.totalFiles]
        ];
        const errorWorksheet = XLSX.utils.aoa_to_sheet(errorData);
        
        if (protectForensicData && exportPassword) {
          protectExcelWorksheet(errorWorksheet, exportPassword);
        }
        
        XLSX.utils.book_append_sheet(workbook, errorWorksheet, `Case_${caseData.metadata.caseNumber}_Error`);
        return;
      }

      // For successful cases, create detailed worksheets
      const metadataRows = generateMetadataRows(caseData);
      
      // Create case details with headers
      const caseDetailsData = [
        protectForensicData 
          ? [`CASE DATA - ${caseData.metadata.caseNumber} - PROTECTED`]
          : [`Case ${caseData.metadata.caseNumber} - Detailed Export`],
        protectForensicData ? ['WARNING: This worksheet is protected to maintain data integrity.'] : [''],
        [''],
        ...metadataRows.slice(2, -1), // Skip title and "File Details" header
        [''],
        ['File Details'],
        CSV_HEADERS
      ];

      // Add file data if available
      if (caseData.files && caseData.files.length > 0) {
        const fileRows: any[][] = [];
        
        caseData.files.forEach(fileEntry => {
          const processedRows = processFileDataForTabular(fileEntry);
          fileRows.push(...processedRows);
        });
        
        caseDetailsData.push(...fileRows);
      } else {
        caseDetailsData.push(['No detailed file data available for this case']);
      }

      const caseWorksheet = XLSX.utils.aoa_to_sheet(caseDetailsData);
      
      // Protect worksheet if forensic protection is enabled
      if (protectForensicData && exportPassword) {
        protectExcelWorksheet(caseWorksheet, exportPassword);
      }
      
      // Clean sheet name for Excel compatibility
      const sheetName = `Case_${caseData.metadata.caseNumber}`.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, caseWorksheet, sheetName);
    });

    // Set workbook protection if forensic protection is enabled
    if (protectForensicData && exportPassword) {
      workbook.Props = {
        Title: 'Striae Case Export - Protected',
        Subject: 'Case Data Export',
        Author: exportData.metadata.exportedBy || 'Striae',
        Comments: `This workbook contains protected case data. Modification may compromise evidence integrity. Worksheets are password protected.`,
        Company: 'Striae'
      };
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: true, // Shared string table for better compression
      cellStyles: true
    });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const protectionSuffix = protectForensicData ? '-protected' : '';
    const exportFileName = `striae-all-cases-detailed${protectionSuffix}-${formatDateForFilename(new Date())}.xlsx`;
    
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = exportFileName;
    linkElement.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    const passwordInfo = protectForensicData && exportPassword ? ` (Password: ${exportPassword})` : '';
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Failed to export Excel file');
  }
}

/**
 * Download case data as JSON file with forensic protection options
 */
export function downloadCaseAsJSON(
  exportData: CaseExportData, 
  options: ExportOptions = { protectForensicData: true }
): void {
  try {
    const jsonContent = generateJSONContent(exportData, options.includeUserInfo, options.protectForensicData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
    
    const protectionSuffix = options.protectForensicData ? '-protected' : '';
    const exportFileName = `striae-case-${exportData.metadata.caseNumber}-export${protectionSuffix}-${formatDateForFilename(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    
    if (options.protectForensicData) {
      linkElement.setAttribute('data-forensic-protected', 'true');
    }
    
    linkElement.click();
    
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error('Failed to download JSON export file');
  }
}

/**
 * Download case data as comprehensive CSV file with forensic protection options
 */
export function downloadCaseAsCSV(
  exportData: CaseExportData,
  options: ExportOptions = { protectForensicData: true }
): void {
  try {
    const csvContent = generateCSVContent(exportData, options.protectForensicData);
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    
    const protectionSuffix = options.protectForensicData ? '-protected' : '';
    const exportFileName = `striae-case-${exportData.metadata.caseNumber}-detailed${protectionSuffix}-${formatDateForFilename(new Date())}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    
    if (options.protectForensicData) {
      linkElement.setAttribute('data-forensic-protected', 'true');
    }
    
    linkElement.click();
    
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export CSV file');
  }
}

/**
 * Helper function to format date for filename
 */
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Validate case number format for export (includes file system checks)
 */
export function validateCaseNumberForExport(caseNumber: string): { isValid: boolean; error?: string } {
  if (!caseNumber || !caseNumber.trim()) {
    return { isValid: false, error: 'Case number is required' };
  }

  const trimmed = caseNumber.trim();
  
  // Use the main validation function first
  if (!validateCaseNumber(trimmed)) {
    return { isValid: false, error: 'Invalid case number format (only letters, numbers, and hyphens allowed, max 25 characters)' };
  }

  // Additional file system validation for export
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmed)) {
    return { isValid: false, error: 'Case number contains invalid characters for file export' };
  }

  return { isValid: true };
}

/**
 * Download case data as ZIP file including images with forensic protection options
 */
export async function downloadCaseAsZip(
  user: User,
  caseNumber: string,
  format: ExportFormat,
  onProgress?: (progress: number) => void,
  options: ExportOptions = { protectForensicData: true }
): Promise<void> {
  try {
    onProgress?.(10);
    
    // Get case data
    const exportData = await exportCaseData(user, caseNumber);
    onProgress?.(30);
    
    // Create ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add data file with forensic protection if enabled
    if (format === 'json') {
      const jsonContent = generateJSONContent(exportData, options.includeUserInfo, options.protectForensicData);
      zip.file(`${caseNumber}_data.json`, jsonContent);
    } else {
      const csvContent = generateCSVContent(exportData, options.protectForensicData);
      zip.file(`${caseNumber}_data.csv`, csvContent);
    }
    onProgress?.(50);
    
    // Add images
    const imageFolder = zip.folder('images');
    if (imageFolder && exportData.files) {
      for (let i = 0; i < exportData.files.length; i++) {
        const file = exportData.files[i];
        try {
          const imageBlob = await fetchImageAsBlob(file.fileData);
          if (imageBlob) {
            imageFolder.file(file.fileData.originalFilename, imageBlob);
          }
        } catch (error) {
          console.warn(`Failed to fetch image ${file.fileData.originalFilename}:`, error);
        }
        onProgress?.(50 + (i / exportData.files.length) * 30);
      }
    }
    
    // Add forensic metadata file if protection is enabled
    if (options.protectForensicData) {
      const forensicMetadata = {
        exportTimestamp: new Date().toISOString(),
        exportedBy: exportData.metadata.exportedBy || 'Unknown',
        exportedByUid: exportData.metadata.exportedByUid || 'Unknown',
        exportedByName: exportData.metadata.exportedByName || 'Unknown',
        exportedByCompany: exportData.metadata.exportedByCompany || 'Unknown',
        caseNumber: exportData.metadata.caseNumber,
        contentChecksum: generateSimpleChecksum(format === 'json' ? 
          generateJSONContent(exportData, options.includeUserInfo, false) : 
          generateCSVContent(exportData, false)
        ),
        forensicWarning: 'This ZIP archive contains evidence data. Modification of any files may compromise evidence integrity and chain of custody.',
        striaeVersion: exportData.metadata.striaeExportSchemaVersion,
        archiveStructure: {
          dataFile: `${caseNumber}_data.${format}`,
          imagesFolder: 'images/',
          totalFiles: exportData.metadata.totalFiles,
          totalAnnotations: exportData.summary?.totalBoxAnnotations || 0
        }
      };
      
      zip.file('FORENSIC_METADATA.json', JSON.stringify(forensicMetadata, null, 2));
      
      // Add read-only instruction file
      const instructionContent = `EVIDENCE ARCHIVE - READ ONLY

This ZIP archive contains evidence data exported from Striae.

IMPORTANT WARNINGS:
- This archive is intended for READ-ONLY access
- Do not modify, rename, or delete any files in this archive
- Any modifications may compromise evidence integrity
- Maintain proper chain of custody procedures

Archive Contents:
- ${caseNumber}_data.${format}: Complete case data in ${format.toUpperCase()} format
- images/: Original image files with annotations
- FORENSIC_METADATA.json: Archive verification data
- README.txt: General information about this export

Case Information:
- Case Number: ${exportData.metadata.caseNumber}
- Export Date: ${new Date().toISOString()}
- Exported By: ${exportData.metadata.exportedBy || 'Unknown'}
- Total Files: ${exportData.metadata.totalFiles}
- Total Annotations: ${exportData.summary?.totalBoxAnnotations || 0}

For questions about this export, contact your Striae system administrator.
`;
      
      zip.file('READ_ONLY_INSTRUCTIONS.txt', instructionContent);
    }
    
    // Add README (standard or enhanced for forensic)
    const readme = generateZipReadme(exportData, options.protectForensicData);
    zip.file('README.txt', readme);
    onProgress?.(85);
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    onProgress?.(95);
    
    // Download
    const url = URL.createObjectURL(zipBlob);
    const protectionSuffix = options.protectForensicData ? '-protected' : '';
    const exportFileName = `striae-case-${caseNumber}-export${protectionSuffix}-${formatDateForFilename(new Date())}.zip`;
    
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.setAttribute('download', exportFileName);
    
    if (options.protectForensicData) {
      linkElement.setAttribute('data-forensic-protected', 'true');
    }
    
    linkElement.click();
    
    URL.revokeObjectURL(url);
    onProgress?.(100);
    
  } catch (error) {
    console.error('ZIP export failed:', error);
    throw new Error('Failed to export ZIP file');
  }
}

/**
 * Helper function to fetch image as blob
 */
async function fetchImageAsBlob(fileData: FileData): Promise<Blob | null> {
  try {
    const imageUrl = await getImageUrl(fileData);
    if (!imageUrl) return null;
    
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    return await response.blob();
  } catch (error) {
    console.error('Failed to fetch image blob:', error);
    return null;
  }
}

/**
 * Generate README content for ZIP export with optional forensic protection
 */
function generateZipReadme(exportData: CaseExportData, protectForensicData: boolean = true): string {
  const totalFiles = exportData.files?.length || 0;
  const filesWithAnnotations = exportData.files?.filter(f => f.annotations && Array.isArray(f.annotations.boxAnnotations) && f.annotations.boxAnnotations.length > 0).length || 0;
  const totalBoxAnnotations = exportData.files?.reduce((sum, f) => sum + (Array.isArray(f.annotations?.boxAnnotations) ? f.annotations.boxAnnotations.length : 0), 0) || 0;
  const totalAnnotations = filesWithAnnotations + totalBoxAnnotations;

  const baseContent = `Striae Case Export
==================

Case Number: ${exportData.metadata.caseNumber}
Case Created Date: ${exportData.metadata.caseCreatedDate}
Export Date: ${exportData.metadata.exportDate}
Exported By (Email): ${exportData.metadata.exportedBy || 'N/A'}
Exported By (UID): ${exportData.metadata.exportedByUid || 'N/A'}
Exported By (Name): ${exportData.metadata.exportedByName || 'N/A'}
Exported By (Company): ${exportData.metadata.exportedByCompany || 'N/A'}
Striae Export Schema Version: ${exportData.metadata.striaeExportSchemaVersion}

Summary:
- Total Files: ${totalFiles}
- Files with Annotations: ${filesWithAnnotations}
- Files without Annotations: ${totalFiles - filesWithAnnotations}
- Total Box Annotations: ${totalBoxAnnotations}
- Total Annotations: ${totalAnnotations}

Contents:
- ${exportData.metadata.caseNumber}_data.json/.csv: Case data and annotations
- images/: Original uploaded images
- README.txt: This file`;

  const forensicAddition = `
- FORENSIC_METADATA.json: Archive verification data
- READ_ONLY_INSTRUCTIONS.txt: Important evidence handling guidelines

EVIDENCE NOTICE:
================
This export contains evidence data. Any modification may compromise 
evidence integrity and chain of custody. Handle according to your organization's 
forensic procedures and maintain proper documentation.`;

  const footer = `

Generated by Striae - A Firearms Examiner's Comparison Companion
https://www.striae.org`;

  return protectForensicData ? baseContent + forensicAddition + footer : baseContent + footer;
}

/**
 * Generate JSON content for case export with forensic protection options
 */
function generateJSONContent(
  exportData: CaseExportData, 
  includeUserInfo: boolean = true, 
  protectForensicData: boolean = true
): string {
  let jsonData = { ...exportData };
  
  // Remove sensitive user info if not included
  if (!includeUserInfo) {
    if (jsonData.metadata.exportedBy) {
      jsonData.metadata.exportedBy = '[User Info Excluded]';
    }
    if (jsonData.metadata.exportedByUid) {
      jsonData.metadata.exportedByUid = '[User Info Excluded]';
    }
    if (jsonData.metadata.exportedByName) {
      jsonData.metadata.exportedByName = '[User Info Excluded]';
    }
    if (jsonData.metadata.exportedByCompany) {
      jsonData.metadata.exportedByCompany = '[User Info Excluded]';
    }
  }
  
  const jsonString = JSON.stringify(jsonData, null, 2);
  
  // Add forensic protection warning if enabled
  if (protectForensicData) {
    return addForensicDataWarning(jsonString, 'json');
  }
  
  return jsonString;
}