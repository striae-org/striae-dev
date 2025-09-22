import { useRef } from 'react';
import { resetFileInput } from '../utils/file-validation';
import styles from '../case-import.module.css';

interface FileSelectorProps {
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled: boolean;
  onClear?: () => void;
}

export const FileSelector = ({ 
  selectedFile, 
  onFileSelect, 
  isDisabled,
  onClear
}: FileSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    resetFileInput(fileInputRef);
    onClear?.();
  };

  return (
    <div className={styles.fileSection}>
      <div className={styles.fileInputGroup}>
        <input
          ref={fileInputRef}
          type="file"
          id="zipFile"
          accept=".zip,.json"
          onChange={onFileSelect}
          disabled={isDisabled}
          className={styles.fileInput}
        />
        <label htmlFor="zipFile" className={styles.fileLabel}>
          <span className={styles.fileLabelIcon}>📁</span>
          <span className={styles.fileLabelText}>
            {selectedFile 
              ? selectedFile.name 
              : 'Select ZIP file (case import) or JSON file (confirmation import)...'
            }
          </span>
        </label>
        
        {/* Clear button positioned in upper right corner */}
        {selectedFile && onClear && (
          <button 
            type="button"
            onClick={handleClear}
            className={styles.clearFileButton}
            disabled={isDisabled}
            title="Clear selected file"
          >
            ×
          </button>
        )}
      </div>
      
      {selectedFile && (
        <div className={styles.fileInfo}>
          <span className={styles.fileSize}>
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      )}
    </div>
  );
};