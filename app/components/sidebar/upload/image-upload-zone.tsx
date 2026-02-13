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
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateAndUploadFile = async (file: File, currentFilesList: FileData[]) => {
    if (!file || !currentCase) return { success: false, files: currentFilesList };

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(`${file.name}: Only PNG, GIF, JPEG, WEBP, or SVG files are allowed`);
      return { success: false, files: currentFilesList };
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`${file.name}: File size must be less than 10 MB`);
      return { success: false, files: currentFilesList };
    }

    try {
      setCurrentFileName(file.name);
      const uploadedFile = await uploadFile(user, currentCase, file, (progress) => {
        setUploadProgress(progress);
      });
      const updatedFiles = [...currentFilesList, uploadedFile];
      onFilesChanged(updatedFiles);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh file upload permissions after successful upload
      if (onUploadPermissionCheck) {
        await onUploadPermissionCheck(updatedFiles.length);
      }
      return { success: true, files: updatedFiles };
    } catch (err) {
      setFileError(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`);
      return { success: false, files: currentFilesList };
    }
  };

  // Process files sequentially
  const processFileQueue = async (filesToProcess: File[]) => {
    setUploadQueue(filesToProcess);
    setCurrentFileIndex(0);
    setIsUploadingFile(true);
    setFileError('');

    let accumulatedFiles = currentFiles;

    for (let i = 0; i < filesToProcess.length; i++) {
      setCurrentFileIndex(i);
      setUploadProgress(0);
      const file = filesToProcess[i];
      const result = await validateAndUploadFile(file, accumulatedFiles);
      
      if (result.success) {
        accumulatedFiles = result.files;
      } else { 
        // Auto-dismiss error after 3 seconds for any failed upload
        setTimeout(() => setFileError(''), 3000);
      }
    }

    setIsUploadingFile(false);
    setUploadProgress(0);
    setCurrentFileName('');
    setUploadQueue([]);
    setCurrentFileIndex(0);
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0 || !currentCase) return;

    // Convert FileList to Array
    const filesToUpload = Array.from(files);
    await processFileQueue(filesToUpload);
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

    // Convert FileList to Array and process all files
    const filesToUpload = Array.from(files);
    await processFileQueue(filesToUpload);
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
      <label htmlFor="file-upload">Upload Images:</label>
      <div className={styles.dragDropHint}>
        <p className={styles.dragDropText}>
          Drag & drop image files here or click below to select
        </p>
      </div>
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept="image/png, image/gif, image/jpeg, image/webp, image/svg+xml"
        multiple
        onChange={handleFileInputChange}
        disabled={isUploadingFile || !canUploadNewFile || isReadOnly}
        className={styles.fileInput}
        aria-label="Upload image files"
        title={!canUploadNewFile ? uploadFileError : undefined}
      />
      {isUploadingFile && (
        <>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgress}
            aria-label="Image upload progress"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div
            className={styles.uploadStatusContainer}
            aria-live="polite"
            aria-label="Current upload status"
          >
            <span className={styles.uploadingText}>
              {uploadProgress === 100 ? 'Processing...' : `${uploadProgress}%`}
            </span>
            {uploadQueue.length > 1 && (
              <span className={styles.fileCountText}>
                {currentFileIndex + 1} of {uploadQueue.length}
              </span>
            )}
          </div>
          {currentFileName && (
            <p className={styles.currentFileName}>{currentFileName}</p>
          )}
        </>
      )}
      {fileError && <p className={styles.error}>{fileError}</p>}
      {!canUploadNewFile && uploadFileError && (
        <p className={styles.error}>{uploadFileError}</p>
      )}
    </div>
  );
};
