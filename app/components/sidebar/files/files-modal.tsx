import React, { useState, useContext } from 'react';
import { AuthContext } from '~/contexts/auth.context';
import { deleteFile } from '~/components/actions/image-manage';
import { FileData } from '~/types';
import styles from './files-modal.module.css';

interface FilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (file: FileData) => void;
  currentCase: string | null;
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  isReadOnly?: boolean;
  selectedFileId?: string;
}

const FILES_PER_PAGE = 10;

export const FilesModal = ({ isOpen, onClose, onFileSelect, currentCase, files, setFiles, isReadOnly = false, selectedFileId }: FilesModalProps) => {
  const { user } = useContext(AuthContext);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const totalPages = Math.ceil(files.length / FILES_PER_PAGE);
  const startIndex = currentPage * FILES_PER_PAGE;
  const endIndex = startIndex + FILES_PER_PAGE;
  const currentFiles = files.slice(startIndex, endIndex);

  const handleFileSelect = (file: FileData) => {
    onFileSelect?.(file);
    onClose();
  };

  const handleDeleteFile = async (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent file selection when clicking delete
    
    // Don't allow file deletion for read-only cases
    if (isReadOnly) {
      return;
    }
    
    if (!user || !currentCase || !window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingFileId(fileId);
    
    try {
      await deleteFile(user, currentCase, fileId);
      // Remove the deleted file from the list
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      
      // Adjust page if needed
      const newTotalPages = Math.ceil(updatedFiles.length / FILES_PER_PAGE);
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const formatFileName = (filename: string) => {
    if (filename.length <= 30) return filename;
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return filename.substring(0, 27) + '…';
    }
    const name = filename.substring(0, lastDotIndex);
    const ext = filename.substring(lastDotIndex);
    const maxNameLength = 27 - ext.length;
    if (name.length <= maxNameLength) return filename;
    return name.substring(0, maxNameLength) + '…' + ext;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Files in Case</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalContent}>
          {error ? (
            <div className={styles.errorState}>{error}</div>
          ) : files.length === 0 ? (
            <div className={styles.emptyState}>No files in this case</div>
          ) : (
            <div className={styles.filesList}>
              {currentFiles.map((file) => (
                <div
                  key={file.id}
                  className={`${styles.fileItem} ${selectedFileId === file.id ? styles.active : ''}`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName} title={file.originalFilename}>
                      {formatFileName(file.originalFilename)}
                    </div>
                    <div className={styles.fileDate}>
                      Uploaded: {formatDate(file.uploadedAt)}
                    </div>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    disabled={isReadOnly || deletingFileId === file.id}
                    aria-label={`Delete ${file.originalFilename}`}
                    title={isReadOnly ? "Cannot delete files for read-only cases" : "Delete file"}
                    style={{ opacity: isReadOnly ? 0.5 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                  >
                    {deletingFileId === file.id ? '⏳' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1} of {totalPages} ({files.length} total files)
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
