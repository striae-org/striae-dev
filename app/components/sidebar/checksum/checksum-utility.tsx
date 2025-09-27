import React, { useState, useRef, useEffect } from 'react';
import styles from './checksum-utility.module.css';
import { calculateCRC32Secure, validateCaseIntegritySecure } from '~/utils/CRC32';
import { removeForensicWarning } from '~/components/actions/case-import/validation';

interface ChecksumUtilityProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VerificationResult {
  isValid: boolean;
  expectedChecksum: string;
  calculatedChecksum: string;
  fileName: string;
  fileType: 'json' | 'csv' | 'zip' | 'xlsx' | 'txt' | 'unknown';
  errorMessage?: string;
  details?: {
    manifestValid?: boolean;
    dataValid?: boolean;
    imageValidation?: { [filename: string]: boolean };
    totalFiles?: number;
    validFiles?: number;
  };
}

export const ChecksumUtility: React.FC<ChecksumUtilityProps> = ({ isOpen, onClose }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setVerificationResult(null);
      setIsVerifying(false);
      setDragOver(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (file) {
      verifyFileIntegrity(file);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type before processing
      const isValidType = file.name.toLowerCase().endsWith('.json') || 
                         file.name.toLowerCase().endsWith('.csv') ||
                         file.name.toLowerCase().endsWith('.zip') ||
                         file.name.toLowerCase().endsWith('.xlsx') ||
                         file.name.toLowerCase().endsWith('.txt');
      
      if (isValidType) {
        handleFileSelect(file);
      } else {
        // Show error for invalid file type
        setVerificationResult({
          isValid: false,
          expectedChecksum: 'N/A',
          calculatedChecksum: 'N/A',
          fileName: file.name,
          fileType: 'unknown',
          errorMessage: 'Invalid file type. Please drop a Striae JSON, CSV, ZIP, XLSX, or TXT export file.'
        });
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const verifyFileIntegrity = async (file: File) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const fileName = file.name;
      let result: VerificationResult;

      if (fileName.toLowerCase().endsWith('.zip')) {
        result = await verifyZIPFile(file, fileName);
      } else if (fileName.toLowerCase().endsWith('.xlsx')) {
        result = await verifyXLSXFile(file, fileName);
      } else if (fileName.toLowerCase().endsWith('.txt')) {
        const content = await file.text();
        result = await verifyTXTFile(content, fileName);
      } else if (fileName.toLowerCase().endsWith('.json') || await isJSONContent(file)) {
        const content = await file.text();
        result = await verifyJSONFile(content, fileName);
      } else if (fileName.toLowerCase().endsWith('.csv') || await isCSVContent(file)) {
        const content = await file.text();
        result = await verifyCSVFile(content, fileName);
      } else {
        result = {
          isValid: false,
          expectedChecksum: '',
          calculatedChecksum: '',
          fileName,
          fileType: 'unknown',
          errorMessage: 'Unsupported file type. Please select a Striae JSON, CSV, ZIP, XLSX, or TXT export file.'
        };
      }

      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        isValid: false,
        expectedChecksum: '',
        calculatedChecksum: '',
        fileName: file.name,
        fileType: 'unknown',
        errorMessage: error instanceof Error ? error.message : 'Failed to read file'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const isJSONContent = async (file: File): Promise<boolean> => {
    try {
      const content = await file.text();
      return content.trim().startsWith('{');
    } catch {
      return false;
    }
  };

  const isCSVContent = async (file: File): Promise<boolean> => {
    try {
      const content = await file.text();
      return content.includes(',');
    } catch {
      return false;
    }
  };

  const verifyZIPFile = async (file: File, fileName: string): Promise<VerificationResult> => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const manifestFile = zipContent.file('FORENSIC_MANIFEST.json');
      if (!manifestFile) {
        return {
          isValid: false,
          expectedChecksum: '',
          calculatedChecksum: '',
          fileName,
          fileType: 'zip',
          errorMessage: 'No FORENSIC_MANIFEST.json found. This may not be a protected Striae ZIP export.'
        };
      }

      const manifestContent = await manifestFile.async('text');
      const manifest = JSON.parse(manifestContent);
      
      const dataFiles = Object.keys(zipContent.files).filter(name => 
        (name.endsWith('.json') || name.endsWith('.csv')) && name !== 'FORENSIC_MANIFEST.json'
      );
      
      if (dataFiles.length === 0) {
        return {
          isValid: false,
          expectedChecksum: '',
          calculatedChecksum: '',
          fileName,
          fileType: 'zip',
          errorMessage: 'No data file found in ZIP archive.'
        };
      }

      const dataFileName = dataFiles[0];
      const dataFile = zipContent.file(dataFileName);
      const rawDataContent = await dataFile!.async('text');
      
      // Clean the data content by removing forensic warnings (same as import process)
      const dataContent = removeForensicWarning(rawDataContent);
      
      const imageFiles: { [filename: string]: Blob } = {};
      const imageFolder = zipContent.folder('images');
      if (imageFolder) {
        // Use the same logic as the import modal - check for files that start with 'images/' and are not directories
        await Promise.all(Object.keys(imageFolder.files).map(async (path) => {
          if (path.startsWith('images/') && !path.endsWith('/')) {
            const filename = path.replace('images/', '');
            const file = zipContent.file(path);
            if (file) {
              const blob = await file.async('blob');
              imageFiles[filename] = blob;
            }
          }
        }));
      }
      
      const validation = await validateCaseIntegritySecure(dataContent, imageFiles, manifest);
      
      return {
        isValid: validation.isValid,
        expectedChecksum: manifest.manifestChecksum || '',
        calculatedChecksum: '',
        fileName,
        fileType: 'zip',
        errorMessage: validation.isValid ? undefined : validation.errors.join('; '),
        details: {
          manifestValid: validation.manifestValid,
          dataValid: validation.dataValid,
          imageValidation: validation.imageValidation,
          totalFiles: Object.keys(imageFiles).length + 1,
          validFiles: Object.values(validation.imageValidation).filter(v => v).length + (validation.dataValid ? 1 : 0)
        }
      };
    } catch (error) {
      return {
        isValid: false,
        expectedChecksum: '',
        calculatedChecksum: '',
        fileName,
        fileType: 'zip',
        errorMessage: `Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const verifyXLSXFile = async (file: File, fileName: string): Promise<VerificationResult> => {
    try {
      // Import XLSX library
      const XLSX = await import('xlsx');
      
      // Read the XLSX file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Check if there's a Summary sheet (where checksums are stored)
      let summarySheet = null;
      if (workbook.Sheets['Summary']) {
        summarySheet = workbook.Sheets['Summary'];
      } else if (workbook.Sheets['Metadata']) {
        summarySheet = workbook.Sheets['Metadata'];
      } else {
        // Look for any sheet that might contain checksum information
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          
          // Look for checksum information in the sheet
          for (const row of sheetData) {
            if (row && row.length > 0) {
              const cellValue = String(row[0] || '').toLowerCase();
              if (cellValue.includes('checksum') || cellValue.includes('crc32')) {
                summarySheet = sheet;
                break;
              }
            }
          }
          if (summarySheet) break;
        }
      }
      
      if (!summarySheet) {
        return {
          isValid: false,
          expectedChecksum: 'Not found',
          calculatedChecksum: 'N/A',
          fileName,
          fileType: 'xlsx',
          errorMessage: 'No checksum information found in XLSX file. This may not be a Striae export file.'
        };
      }
      
      // Extract checksum from the sheet
      const sheetData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 }) as any[][];
      let expectedChecksum = '';
      
      for (let i = 0; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (row && row.length >= 2) {
          const label = String(row[0] || '').toLowerCase();
          if (label.includes('checksum') || label.includes('crc32')) {
            expectedChecksum = String(row[1] || '').trim();
            break;
          }
        }
      }
      
      if (!expectedChecksum) {
        return {
          isValid: false,
          expectedChecksum: 'Not found',
          calculatedChecksum: 'N/A',
          fileName,
          fileType: 'xlsx',
          errorMessage: 'No checksum value found in XLSX file metadata.'
        };
      }
      
      // Calculate checksum of the data content (excluding the summary/metadata sheet)
      let dataContent = '';
      
      for (const sheetName of workbook.SheetNames) {
        // Skip summary/metadata sheets
        if (sheetName.toLowerCase() === 'summary' || sheetName.toLowerCase() === 'metadata') {
          continue;
        }
        
        const sheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(sheet);
        dataContent += csvData;
      }
      
      // If no data sheets found, include all content
      if (!dataContent) {
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(sheet);
          dataContent += csvData;
        }
      }
      
      const calculatedChecksum = await calculateCRC32Secure(dataContent);
      const isValid = expectedChecksum === calculatedChecksum;
      
      return {
        isValid,
        expectedChecksum,
        calculatedChecksum,
        fileName,
        fileType: 'xlsx',
        errorMessage: isValid ? undefined : 'Checksum mismatch - file may have been modified or corrupted'
      };
      
    } catch (error) {
      return {
        isValid: false,
        expectedChecksum: 'Not found',
        calculatedChecksum: 'Could not calculate',
        fileName,
        fileType: 'xlsx',
        errorMessage: error instanceof Error ? error.message : 'Error reading XLSX file'
      };
    }
  };

  const verifyTXTFile = async (content: string, fileName: string): Promise<VerificationResult> => {
    try {
      // Look for the integrity verification section
      const integritySection = content.indexOf('INTEGRITY VERIFICATION');
      if (integritySection === -1) {
        return {
          isValid: false,
          expectedChecksum: 'Not found',
          calculatedChecksum: 'N/A',
          fileName,
          fileType: 'txt',
          errorMessage: 'No integrity verification section found. This may not be a Striae audit report TXT file.'
        };
      }

      // Extract the report content (everything before the integrity section)
      const reportContent = content.substring(0, integritySection).trim();
      
      // Extract the expected checksum from the integrity section
      const checksumMatch = content.match(/Report Content CRC32 Checksum:\s*([A-F0-9]+)/i);
      if (!checksumMatch) {
        return {
          isValid: false,
          expectedChecksum: 'Not found',
          calculatedChecksum: 'N/A',
          fileName,
          fileType: 'txt',
          errorMessage: 'No CRC32 checksum found in integrity verification section.'
        };
      }

      const expectedChecksum = checksumMatch[1].toUpperCase();
      
      // Calculate the checksum of the report content
      const calculatedChecksum = await calculateCRC32Secure(reportContent);
      const isValid = expectedChecksum === calculatedChecksum.toUpperCase();

      return {
        isValid,
        expectedChecksum,
        calculatedChecksum: calculatedChecksum.toUpperCase(),
        fileName,
        fileType: 'txt',
        errorMessage: isValid ? undefined : 'Checksum mismatch - audit report may have been modified or corrupted'
      };
      
    } catch (error) {
      return {
        isValid: false,
        expectedChecksum: 'Not found',
        calculatedChecksum: 'Could not calculate',
        fileName,
        fileType: 'txt',
        errorMessage: error instanceof Error ? error.message : 'Error processing TXT audit report'
      };
    }
  };

  const verifyJSONFile = async (content: string, fileName: string): Promise<VerificationResult> => {
    try {
      const data = JSON.parse(content);
      let expectedChecksum = '';
      
      if (data.metadata?.checksum) {
        expectedChecksum = data.metadata.checksum;
      } else if (data.auditTrail?.metadata?.checksum) {
        expectedChecksum = data.auditTrail.metadata.checksum;
      } else {
        return {
          isValid: false,
          expectedChecksum: '',
          calculatedChecksum: '',
          fileName,
          fileType: 'json',
          errorMessage: 'No checksum found in file. This may not be a Striae export with integrity protection.'
        };
      }

      const dataForVerification = JSON.parse(content);
      if (dataForVerification.metadata?.checksum) {
        delete dataForVerification.metadata.checksum;
        delete dataForVerification.metadata.integrityNote;
      }
      if (dataForVerification.auditTrail?.metadata?.checksum) {
        delete dataForVerification.auditTrail.metadata.checksum;
        delete dataForVerification.auditTrail.metadata.integrityNote;
      }

      const contentForVerification = JSON.stringify(dataForVerification, null, 2);
      const calculatedChecksum = calculateCRC32Secure(contentForVerification);

      return {
        isValid: calculatedChecksum.toUpperCase() === expectedChecksum.toUpperCase(),
        expectedChecksum: expectedChecksum.toUpperCase(),
        calculatedChecksum: calculatedChecksum.toUpperCase(),
        fileName,
        fileType: 'json'
      };
    } catch (error) {
      return {
        isValid: false,
        expectedChecksum: '',
        calculatedChecksum: '',
        fileName,
        fileType: 'json',
        errorMessage: 'Invalid JSON file or corrupted content'
      };
    }
  };

  const verifyCSVFile = async (content: string, fileName: string): Promise<VerificationResult> => {
    try {
      const lines = content.split('\n');
      let expectedChecksum = '';

      for (const line of lines) {
        if (line.includes('# CRC32 Checksum:')) {
          expectedChecksum = line.split('# CRC32 Checksum:')[1]?.trim() || '';
          break;
        }
      }

      if (!expectedChecksum) {
        return {
          isValid: false,
          expectedChecksum: '',
          calculatedChecksum: '',
          fileName,
          fileType: 'csv',
          errorMessage: 'No CRC32 checksum found in file.'
        };
      }

      const dataStartIndex = lines.findIndex((line: string) => !line.startsWith('#') && line.trim() !== '');
      if (dataStartIndex === -1) {
        return {
          isValid: false,
          expectedChecksum,
          calculatedChecksum: '',
          fileName,
          fileType: 'csv',
          errorMessage: 'No data content found in CSV file'
        };
      }

      const dataContent = lines.slice(dataStartIndex).join('\n');
      const calculatedChecksum = calculateCRC32Secure(dataContent);

      return {
        isValid: calculatedChecksum.toUpperCase() === expectedChecksum.toUpperCase(),
        expectedChecksum: expectedChecksum.toUpperCase(),
        calculatedChecksum: calculatedChecksum.toUpperCase(),
        fileName,
        fileType: 'csv'
      };
    } catch (error) {
      return {
        isValid: false,
        expectedChecksum: '',
        calculatedChecksum: '',
        fileName,
        fileType: 'csv',
        errorMessage: 'Failed to parse CSV file'
      };
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Checksum Utility</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <p className={styles.description}>
            Verify the integrity of Striae export files by checking their embedded checksums. 
            Upload a JSON, CSV, ZIP, XLSX, or TXT export to validate that the data hasn't been tampered with or corrupted.
          </p>

          <div
            className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadContent}>
              <div className={styles.uploadIcon}>📁</div>
              <div className={styles.uploadText}>
                <strong>
                  {dragOver ? 'Drop file here...' : 'Click to select'}
                </strong> 
                {!dragOver && ' or drag and drop a Striae export file'}
              </div>
              <div className={styles.uploadSubtext}>
                Supports JSON, CSV, ZIP, XLSX, and TXT export files with embedded checksums
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.zip,.xlsx,.txt"
              onChange={handleFileInputChange}
              className={styles.hiddenInput}
              aria-label="Select Striae export file for checksum verification"
            />
          </div>

          {isVerifying && (
            <div className={styles.verifyingSection}>
              <div className={styles.spinner}></div>
              <div className={styles.verifyingText}>Verifying file integrity...</div>
            </div>
          )}

          {verificationResult && (
            <div className={`${styles.resultSection} ${verificationResult.isValid ? styles.success : styles.failure}`}>
              <div className={styles.resultHeader}>
                <div className={`${styles.resultIcon} ${verificationResult.isValid ? styles.successIcon : styles.failureIcon}`}>
                  {verificationResult.isValid ? '✅' : '❌'}
                </div>
                <div className={styles.resultTitle}>
                  {verificationResult.isValid ? 'Verification Passed' : 'Verification Failed'}
                </div>
              </div>
              
              <div className={styles.resultDetails}>
                <div className={styles.resultRow}>
                  <span className={styles.resultLabel}>File:</span>
                  <span className={styles.resultValue}>{verificationResult.fileName}</span>
                </div>
                <div className={styles.resultRow}>
                  <span className={styles.resultLabel}>Type:</span>
                  <span className={styles.resultValue}>{verificationResult.fileType.toUpperCase()}</span>
                </div>
                {verificationResult.fileType === 'zip' && verificationResult.details && (
                  <>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Data Valid:</span>
                      <span className={styles.resultValue}>{verificationResult.details.dataValid ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Manifest Valid:</span>
                      <span className={styles.resultValue}>{verificationResult.details.manifestValid ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Valid Files:</span>
                      <span className={styles.resultValue}>{verificationResult.details.validFiles}/{verificationResult.details.totalFiles}</span>
                    </div>
                  </>
                )}
                {verificationResult.expectedChecksum && verificationResult.fileType !== 'zip' && (
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Expected:</span>
                    <span className={styles.resultValue}>{verificationResult.expectedChecksum}</span>
                  </div>
                )}
                {verificationResult.calculatedChecksum && verificationResult.fileType !== 'zip' && (
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Calculated:</span>
                    <span className={styles.resultValue}>{verificationResult.calculatedChecksum}</span>
                  </div>
                )}
                {verificationResult.errorMessage && (
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Error:</span>
                    <span className={styles.resultValue}>{verificationResult.errorMessage}</span>
                  </div>
                )}
              </div>

              <div className={styles.resultMessage}>
                {verificationResult.isValid ? (
                  <span>
                    {verificationResult.fileType === 'zip' 
                      ? 'The ZIP archive integrity is intact. All files passed validation - no tampering or corruption detected.'
                      : 'The file integrity is intact. No tampering or corruption detected.'
                    }
                  </span>
                ) : (
                  <span>
                    {verificationResult.errorMessage || 
                     'The file has been modified or corrupted. Do not trust this data for forensic purposes.'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};