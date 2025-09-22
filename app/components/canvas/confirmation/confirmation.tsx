import { useState, useEffect, useContext } from 'react';
import { BasicConfirmationData } from '~/types/annotations';
import { AuthContext } from '~/contexts/auth.context';
import styles from './confirmation.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (confirmationData: {
    fullName: string;
    badgeId: string;
    timestamp: string;
    confirmationId: string;
  }) => void;
  company?: string;
  existingConfirmation?: BasicConfirmationData | null;
}

// Generate a 10-character alphanumeric ID
const generateConfirmationId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format current date and time in readable format
const formatTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, company, existingConfirmation }: ConfirmationModalProps) => {
  const { user } = useContext(AuthContext);
  const [badgeId, setBadgeId] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  const fullName = user?.displayName || user?.email || 'Unknown User';
  const userEmail = user?.email || 'No email available';
  const labCompany = company || 'Not specified';
  const timestamp = formatTimestamp();
  const confirmationId = generateConfirmationId();

  // Check if this is an existing confirmation
  const hasExistingConfirmation = !!existingConfirmation;

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingConfirmation) {
        setBadgeId(existingConfirmation.badgeId);
      } else {
        setBadgeId('');
      }
      setError('');
      setIsConfirming(false);
    }
  }, [isOpen, existingConfirmation]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!badgeId.trim()) {
      setError('Badge/ID is required');
      return;
    }

    setIsConfirming(true);
    setError('');

    try {
      const confirmationData = {
        fullName,
        badgeId: badgeId.trim(),
        timestamp,
        confirmationId
      };

      onConfirm?.(confirmationData);
      onClose();
    } catch (error) {
      console.error('Confirmation failed:', error);
      setError('Confirmation failed. Please try again.');
    } finally {
      setIsConfirming(false);
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
          <h2 className={styles.title}>
            {hasExistingConfirmation ? 'Confirmation Details' : 'Confirm Identification'}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        {hasExistingConfirmation && (
          <div className={styles.existingConfirmationBanner}>
            ✓ This image has already been confirmed
          </div>
        )}
        
        <div className={styles.content}>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Name:</label>
              <div className={styles.readOnlyValue}>
                {hasExistingConfirmation ? existingConfirmation.fullName : fullName}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="badgeId">Badge/ID: *</label>
              <input
                id="badgeId"
                type="text"
                className={styles.input}
                value={badgeId}
                onChange={(e) => {
                  setBadgeId(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your badge or ID number"
                disabled={isConfirming || hasExistingConfirmation}
                autoFocus={!hasExistingConfirmation}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email:</label>
              <div className={styles.readOnlyValue}>{userEmail}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Lab/Company:</label>
              <div className={styles.readOnlyValue}>{labCompany}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Timestamp:</label>
              <div className={styles.readOnlyValue}>
                {hasExistingConfirmation ? existingConfirmation.timestamp : timestamp}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirmation ID:</label>
              <div className={styles.readOnlyValue}>
                {hasExistingConfirmation ? existingConfirmation.confirmationId : confirmationId}
              </div>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isConfirming}
          >
            {hasExistingConfirmation ? 'Close' : 'Cancel'}
          </button>
          {!hasExistingConfirmation && (
            <button
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={isConfirming || !badgeId.trim()}
            >
              {isConfirming ? 'Confirming...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
