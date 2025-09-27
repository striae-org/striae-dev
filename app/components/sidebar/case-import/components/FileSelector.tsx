import { useRef, useState } from 'react';
import { resetFileInput } from '../utils/file-validation';
import styles from '../case-import.module.css';

interface FileSelectorProps {
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled: boolean;
  onClear?: () => void;
  onFileSelectDirect?: (file: File) => void; // For drag and drop
}

export const FileSelector = ({ 
  selectedFile, 
  onFileSelect, 
  isDisabled,
  onClear,
  onFileSelectDirect
}: FileSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClear = () => {
    resetFileInput(fileInputRef);
    onClear?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isDisabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Check file type (same as input accept attribute)
      const isValidType = file.name.toLowerCase().endsWith('.zip') || 
                         file.name.toLowerCase().endsWith('.json');
      
      if (isValidType) {
        if (onFileSelectDirect) {
          onFileSelectDirect(file);
        } else {
          // Fallback: simulate file input change event
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            const event = new Event('change', { bubbles: true }) as any;
            Object.defineProperty(event, 'target', { value: fileInputRef.current });
            onFileSelect(event);
          }
        }
      } else {
        // Could show an error, but the parent component will handle validation
        console.warn('Invalid file type dropped:', file.name);
      }
    }
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
        <label 
          htmlFor="zipFile" 
          className={`${styles.fileLabel} ${isDragOver ? styles.fileLabelDragOver : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className={styles.fileLabelIcon}>📁</span>
          <span className={styles.fileLabelText}>
            {selectedFile 
              ? selectedFile.name 
              : isDragOver 
                ? 'Drop file here...' 
                : 'Select ZIP file (case import) or JSON file (confirmation import)... or drag & drop'
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