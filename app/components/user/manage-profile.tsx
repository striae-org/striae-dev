import { useState, useContext, useEffect } from 'react';
import { 
  updateProfile, 
  updateEmail,   
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendEmailVerification  
} from 'firebase/auth';
import { PasswordReset } from '~/routes/auth/passwordReset';
import { AuthContext } from '~/contexts/auth.context';
import { getUserApiKey } from '~/utils/auth';
import paths from '~/config/config.json';
import { handleAuthError, ERROR_MESSAGES } from '~/services/firebase-errors';
import styles from './manage-profile.module.css';

interface ManageProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const USER_WORKER_URL = paths.user_worker_url;

export const ManageProfile = ({ isOpen, onClose }: ManageProfileProps) => {
  const { user } = useContext(AuthContext);  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Check if user has Google provider
  const hasGoogleProvider = user?.providerData.some(provider => provider.providerId === 'google.com');

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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

  const handleUpdateProfile = async (e: React.FormEvent) => {    
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setVerificationSent(false);
    
    try {
      if (!user) throw new Error(ERROR_MESSAGES.NO_USER);

      if (email !== user.email && password) {
        try {
          // Step 1: Reauthenticate the user
          const credential = EmailAuthProvider.credential(user.email!, password);
          await reauthenticateWithCredential(user, credential);
          
          // Step 2: Update email (this changes the user's email immediately)
          await updateEmail(user, email);
          
          // Step 3: Send verification email to the new address
          await sendEmailVerification(user);
          
          setVerificationSent(true);
          setSuccess('Email updated! Please check your new email address for verification.');
          return;
        } catch (err) {
          const { message } = handleAuthError(err);
          setError(message);
          return;
        }
      }

       // Update Firebase profile
      await updateProfile(user, {
        displayName
      });

      // Update KV store
      const apiKey = await getUserApiKey();
      const [firstName, lastName] = displayName.split(' ');
      
      const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify({
          email,
          firstName: firstName || '',
          lastName: lastName || '',
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile in database');
      }

      setSuccess(ERROR_MESSAGES.PROFILE_UPDATED);
    } catch (err) {
      const { message } = handleAuthError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showResetForm) {
    return <PasswordReset isModal={true} onBack={() => setShowResetForm(false)} />;
  }

  return (
    <div 
      className={styles.modalOverlay} 
      onClick={onClose}
      role="presentation"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div 
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
            <header className={styles.modalHeader}>
              <h1 id="modal-title">Manage Profile</h1>
              <button 
                onClick={onClose} 
                className={styles.closeButton}
                aria-label="Close modal"
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleUpdateProfile} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              autoComplete="name"
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              disabled={hasGoogleProvider}
            />
            {hasGoogleProvider && (
              <p className={styles.helpText}>
                Email changes are not allowed for Google-linked accounts. Please manage your email through your Google account.
              </p>
            )}
          </div>

          {email !== user?.email && !hasGoogleProvider && (
            <div className={styles.formGroup}>
              <label htmlFor="password">Current Password (required for email change)</label>
              <input
                id="password"
                type="password"
                value={password}
                required={email !== user?.email}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <div className={styles.buttonGroup}>
                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={isLoading || verificationSent}
                >
                  {isLoading ? 'Updating...' : 
                  verificationSent ? 'Verification Email Sent' : 
                  'Update Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className={styles.secondaryButton}
                >
                  Reset Password
                </button>
              </div>
              <p className={styles.deleteNotice}>
                To delete your account, please contact{' '}
                <a href="mailto:info@striae.org" className={styles.deleteLink}>
                  info@striae.org
                </a>
              </p>
            </form>
      </div>
    </div>
  );
};