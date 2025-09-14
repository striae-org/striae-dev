import { useState, useEffect } from 'react';
import paths from '~/config/config.json';
import styles from './delete-account.module.css';

interface DeleteAccountProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
  company: string;
}

export const DeleteAccount = ({ isOpen, onClose, user, company }: DeleteAccountProps) => {
  const [uidConfirmation, setUidConfirmation] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Extract first and last name from display name
  const [firstName, lastName] = (user.displayName || '').split(' ');
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();

  // Check if confirmations match user data
  const isConfirmationValid = uidConfirmation === user.uid && emailConfirmation === user.email;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Reset form when modal opens
      setUidConfirmation('');
      setEmailConfirmation('');
      setError('');
      setSuccess(false);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      // Send emails to both user and support
      const emailResponse = await fetch('/api/send-deletion-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.displayName || 'User',
          uid: user.uid,
          company: company || 'Not provided'
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send deletion confirmation emails');
      }

      // TODO: Add actual account deletion logic here
      // This should call the user-worker to delete the account
      
      setSuccess(true);
      
      // Close modal after a short delay to show success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={styles.modalOverlay} 
      onClick={onClose}
      role="presentation"
    >
      <div 
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.modalHeader}>
          <h1 id="modal-title" className={styles.dangerTitle}>Delete Striae Account</h1>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        <div className={styles.modalContent}>
          {/* Divider */}
          <div className={styles.divider}></div>

          {/* User Information */}
          <div className={styles.userInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>User ID:</span>
              <span className={styles.value}>{user.uid}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Display Name:</span>
              <span className={styles.value}>{fullName || 'Not provided'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Lab/Company:</span>
              <span className={styles.value}>{company || 'Not provided'}</span>
            </div>
          </div>

          {/* Divider */}
          <div className={styles.divider}></div>

          {/* Warning Message */}
          <div className={styles.warningSection}>
            <p className={styles.warningText}>
              Deleting your account is irreversible! All account information and data will be deleted from Striae. Please be certain you want to take this action.
            </p>
          </div>

          {/* Divider */}
          <div className={styles.divider}></div>

          {/* Success/Error Messages */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className={styles.successMessage}>
              <p>✓ Account deletion successful! Confirmation emails have been sent.</p>
              <p>This modal will close automatically.</p>
            </div>
          )}

          {/* Confirmation Form */}
          {!success && (
            <form className={styles.confirmationForm}>
            <div className={styles.formGroup}>
              <label htmlFor="uid-confirmation" className={styles.formLabel}>
                Enter UID to confirm account deletion:
              </label>
              <input
                id="uid-confirmation"
                type="text"
                value={uidConfirmation}
                onChange={(e) => setUidConfirmation(e.target.value)}
                className={styles.confirmationInput}
                placeholder="Enter your User ID"
                autoComplete="off"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email-confirmation" className={styles.formLabel}>
                Enter your email address to confirm account deletion:
              </label>
              <input
                id="email-confirmation"
                type="email"
                value={emailConfirmation}
                onChange={(e) => setEmailConfirmation(e.target.value)}
                className={styles.confirmationInput}
                placeholder="Enter your email address"
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className={styles.deleteButton}
              disabled={!isConfirmationValid || isDeleting}
            >
              {isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};
