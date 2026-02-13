import { User } from 'firebase/auth';
import { useState, useRef } from 'react';
import styles from './image-upload-zone.module.css';
import { uploadFile } from '~/components/actions/image-manage';
import { FileData } from '~/types';

interface ImageUploadZoneProps {
  user: User;
  currentCase: string | null;
  isReadOnly: boolean;
  canUploadNewFile: boolean;
  uploadFileError: string;
  onFilesChanged: (files: FileData[]) => void;
  onUploadPermissionCheck?: (fileCount: number) => Promise<void>;
  currentFiles: FileData[];
}

const ALLOWED_TYPES = [
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ImageUploadZone = ({
  user,
  currentCase,
  isReadOnly,
  canUploadNewFile,
  uploadFileError,
  onFilesChanged,
  onUploadPermissionCheck,
  currentFiles,
}: ImageUploadZoneProps) => {
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateAndUploadFile = async (file: File) => {
    if (!file || !currentCase) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only PNG, GIF, JPEG, WEBP, or SVG files are allowed');
      setIsUploadingFile(false);
      setUploadProgress(0);
      setTimeout(() => setFileError(''), 3000);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size must be less than 10 MB');
      setIsUploadingFile(false);
      setUploadProgress(0);
      setTimeout(() => setFileError(''), 3000);
      return;
    }

    try {
      const uploadedFile = await uploadFile(user, currentCase, file, (progress) => {
        setUploadProgress(progress);
      });
      const updatedFiles = [...currentFiles, uploadedFile];
      onFilesChanged(updatedFiles);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh file upload permissions after successful upload
      if (onUploadPermissionCheck) {
        await onUploadPermissionCheck(updatedFiles.length);
      }
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Upload failed');
      setTimeout(() => setFileError(''), 3000);
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file || !currentCase) return;

    setFileError('');
    setIsUploadingFile(true);
    setUploadProgress(0);

    await validateAndUploadFile(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setIsDraggingFiles(false);
      }
      return newCount;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDraggingFiles(false);

    if (isReadOnly) {
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length === 0 || !currentCase) return;

    // Process only the first file (consistent with input behavior)
    const file = files[0];

    setFileError('');
    setIsUploadingFile(true);
    setUploadProgress(0);

    await validateAndUploadFile(file);
  };

  return (
    <div
      ref={dropZoneRef}
      className={`${styles.imageUploadZone} ${isDraggingFiles ? styles.dragActive : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <label htmlFor="file-upload">Upload Image:</label>
      <div className={styles.dragDropHint}>
        <p className={styles.dragDropText}>
          Drag & drop image files here or click to select
        </p>
      </div>
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept="image/png, image/gif, image/jpeg, image/webp, image/svg+xml"
        onChange={handleFileInputChange}
        disabled={isUploadingFile || !canUploadNewFile || isReadOnly}
        className={styles.fileInput}
        aria-label="Upload image file"
        title={!canUploadNewFile ? uploadFileError : undefined}
      />
      {isUploadingFile && (
        <>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className={styles.uploadingText}>
            {uploadProgress === 100 ? 'Processing...' : `${uploadProgress}%`}
          </span>
        </>
      )}
      {fileError && <p className={styles.error}>{fileError}</p>}
      {!canUploadNewFile && uploadFileError && (
        <p className={styles.error}>{uploadFileError}</p>
      )}
    </div>
  );
};
