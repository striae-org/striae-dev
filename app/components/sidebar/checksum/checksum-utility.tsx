import React, { useState, useRef, useEffect } from 'react';
import styles from './checksum-utility.module.css';
import { calculateCRC32Secure, validateCaseIntegritySecure } from '~/utils/CRC32';

interface ChecksumUtilityProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VerificationResult {
  isValid: boolean;
  expectedChecksum: string;
  calculatedChecksum: string;
  fileName: string;
  fileType: 'json' | 'csv' | 'zip' | 'unknown';
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
      handleFileSelect(files[0]);
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
          errorMessage: 'Unsupported file type. Please select a Striae JSON, CSV, or ZIP export file.'
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
      const dataContent = await dataFile!.async('text');
      
      const imageFiles: { [filename: string]: Blob } = {};
      const imageFolder = zipContent.folder('images');
      if (imageFolder) {
        for (const [relativePath, zipObject] of Object.entries(imageFolder.files)) {
          if (!zipObject.dir) {
            const imageFileName = relativePath.split('/').pop()!;
            imageFiles[imageFileName] = await zipObject.async('blob');
          }
        }
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
            Upload a JSON, CSV, or ZIP export to validate that the data hasn't been tampered with or corrupted.
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
                <strong>Click to select</strong> or drag and drop a Striae export file
              </div>
              <div className={styles.uploadSubtext}>
                Supports JSON, CSV, and ZIP export files with embedded checksums
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.zip"
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