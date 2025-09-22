import { User } from 'firebase/auth';
import { FileData, AllCasesExportData, CaseExportData, ExportOptions } from '~/types';
import { getImageUrl } from '../image-manage';
import { generateForensicManifest } from '~/utils/CRC32';
import { ExportFormat, formatDateForFilename, CSV_HEADERS } from './types-constants';
import { protectExcelWorksheet, addForensicDataWarning } from './metadata-helpers';
import { generateMetadataRows, generateCSVContent, processFileDataForTabular } from './data-processing';
import { exportCaseData } from './core-export';

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
export async function downloadAllCasesAsCSV(exportData: AllCasesExportData, protectForensicData: boolean = true): Promise<void> {
  try {
    // Dynamic import of XLSX to avoid bundle size issues
    const XLSX = await import('xlsx');
    
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
      ['Total Confirmations (All Cases)', exportData.metadata.totalConfirmations || 0],
      ['Total Confirmations Requested (All Cases)', exportData.metadata.totalConfirmationsRequested || 0],
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
        'Files with Confirmations',
        'Files with Confirmations Requested',
        'Last Modified',
        'Earliest Annotation Date',
        'Latest Annotation Date', 
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
        caseData.summary?.filesWithConfirmations || 0,
        caseData.summary?.filesWithConfirmationsRequested || 0,
        caseData.summary?.lastModified || '',
        caseData.summary?.earliestAnnotationDate || '',
        caseData.summary?.latestAnnotationDate || '',
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
    
    // Add images and collect them for manifest generation
    const imageFolder = zip.folder('images');
    const imageFiles: { [filename: string]: Blob } = {};
    if (imageFolder && exportData.files) {
      for (let i = 0; i < exportData.files.length; i++) {
        const file = exportData.files[i];
        try {
          const imageBlob = await fetchImageAsBlob(file.fileData);
          if (imageBlob) {
            imageFolder.file(file.fileData.originalFilename, imageBlob);
            imageFiles[file.fileData.originalFilename] = imageBlob;
          }
        } catch (error) {
          console.warn(`Failed to fetch image ${file.fileData.originalFilename}:`, error);
        }
        onProgress?.(50 + (i / exportData.files.length) * 30);
      }
    }
    
    // Add forensic metadata file if protection is enabled
    if (options.protectForensicData) {
      // Get the content that will be used for checksum calculation
      const contentForChecksum = format === 'json' 
        ? generateJSONContent(exportData, options.includeUserInfo, false) // Raw content without warnings
        : generateCSVContent(exportData, false); // Raw content without warnings
      
      // Generate comprehensive forensic manifest with individual file checksums
      const forensicManifest = await generateForensicManifest(contentForChecksum, imageFiles);
      
      // Add dedicated forensic manifest file for validation
      zip.file('FORENSIC_MANIFEST.json', JSON.stringify(forensicManifest, null, 2));
      
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
- FORENSIC_MANIFEST.json: File integrity validation manifest
- README.txt: General information about this export

Case Information:
- Case Number: ${exportData.metadata.caseNumber}
- Export Date: ${new Date().toISOString()}
- Exported By: ${exportData.metadata.exportedBy || 'Unknown'}
- Total Files: ${exportData.metadata.totalFiles}
- Total Annotations: ${exportData.summary?.totalBoxAnnotations || 0}
- Total Confirmations: ${exportData.summary?.filesWithConfirmations || 0}
- Confirmations Requested: ${exportData.summary?.filesWithConfirmationsRequested || 0}

For questions about this export, contact your Striae system administrator.
`;
      
      zip.file('READ_ONLY_INSTRUCTIONS.txt', instructionContent);
      
      // Add README 
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
        linkElement.setAttribute('title', 'Evidence archive with forensic protection enabled');
      }
      
      linkElement.click();
      
      URL.revokeObjectURL(url);
      onProgress?.(100);
      
      return; // Exit early as we've handled the forensic case
    }

    // Add README (standard or enhanced for forensic)
    const readme = generateZipReadme(exportData, options.protectForensicData);
    zip.file('README.txt', readme);
    onProgress?.(85);
    
    // Generate ZIP blob for non-forensic case
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    onProgress?.(95);    // Download
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
  const filesWithConfirmations = exportData.summary?.filesWithConfirmations || 0;
  const filesWithConfirmationsRequested = exportData.summary?.filesWithConfirmationsRequested || 0;

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
- Files with Confirmations: ${filesWithConfirmations}
- Files with Confirmations Requested: ${filesWithConfirmationsRequested}
- Earliest Annotation Date: ${exportData.summary?.earliestAnnotationDate || 'N/A'}
- Latest Annotation Date: ${exportData.summary?.latestAnnotationDate || 'N/A'}

Contents:
- ${exportData.metadata.caseNumber}_data.json/.csv: Case data and annotations
- images/: Original uploaded images
- README.txt: This file`;

  const forensicAddition = `
- FORENSIC_MANIFEST.json: File integrity validation manifest
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