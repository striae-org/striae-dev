import { useState, useContext } from 'react';
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
          const credential = EmailAuthProvider.credential(user.email!, password);
          await reauthenticateWithCredential(user, credential);
          await updateEmail(user, email);
          await sendEmailVerification(user);
          setVerificationSent(true);
          setSuccess(ERROR_MESSAGES.VERIFICATION_SENT);
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
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
            <header className={styles.modalHeader}>
              <h1>Manage Profile</h1>
              <button onClick={onClose} className={styles.closeButton}>&times;</button>
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
            />
          </div>

          {email !== user?.email && (
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
                <a href="mailto:info@allyforensics.com" className={styles.deleteLink}>
                  info@allyforensics.com
                </a>
              </p>
            </form>
      </div>
    </div>
  );
};