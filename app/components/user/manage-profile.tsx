import { useState, useContext } from 'react';
import { 
  updateProfile, 
  updateEmail,   
  reauthenticateWithCredential, 
  EmailAuthProvider,  
} from 'firebase/auth';
import { PasswordReset } from '~/routes/auth/passwordReset';
import { AuthContext } from '~/contexts/auth.context';
import styles from './manage-profile.module.css';

interface ManageProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageProfile = ({ isOpen, onClose }: ManageProfileProps) => {
  const { user } = useContext(AuthContext);  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (!user) throw new Error('No user logged in');

      if (email !== user.email && password) {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, email);
      }

      await updateProfile(user, {
        displayName
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
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
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          {email !== user?.email && (
            <div className={styles.formGroup}>
              <label htmlFor="password">Current Password (required for email change)</label>
              <input
                id="password"
                type="password"
                value={password}
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
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
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