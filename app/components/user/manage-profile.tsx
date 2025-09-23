import { useState, useContext, useEffect } from 'react';
import { 
  updateProfile
} from 'firebase/auth';
import { PasswordReset } from '~/routes/auth/passwordReset';
import { DeleteAccount } from './delete-account';
import { UserAuditViewer } from '../audit/user-audit-viewer';
import { AuthContext } from '~/contexts/auth.context';
import { getUserApiKey } from '~/utils/auth';
import { getUserData } from '~/utils/permissions';
import { auditService } from '~/services/audit.service';
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
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [permitted, setPermitted] = useState(false); // Default to false for safety - will be updated after data loads
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuditViewer, setShowAuditViewer] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const loadUserData = async () => {
        try {
          // Use the same getUserData function as case-sidebar
          const userData = await getUserData(user);
          
          if (userData) {
            setCompany(userData.company || '');
            setEmail(userData.email || '');
            setPermitted(userData.permitted === true);
          } else {
            // Keep permitted as false if we can't load data
          }
        } catch (err) {
          console.error('Failed to load user data:', err);
        }
      };
      
      loadUserData();
    }
  }, [isOpen, user]);

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
    
    const oldDisplayName = user?.displayName || '';
    
    try {
      if (!user) throw new Error(ERROR_MESSAGES.NO_USER);

      await updateProfile(user, {
        displayName
      });

      const apiKey = await getUserApiKey();
      const [firstName, lastName] = displayName.split(' ');
      
      const response = await fetch(`${USER_WORKER_URL}/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify({
          email: user.email,
          firstName: firstName || '',
          lastName: lastName || '',          
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile in database');
      }

      // Log successful profile update
      await auditService.logUserProfileUpdate(
        user,
        'displayName',
        oldDisplayName,
        displayName,
        'success'
      );

      setSuccess(ERROR_MESSAGES.PROFILE_UPDATED);
    } catch (err) {
      const { message } = handleAuthError(err);
      
      // Log failed profile update
      await auditService.logUserProfileUpdate(
        user!,
        'displayName',
        oldDisplayName,
        displayName,
        'failure',
        undefined, // no session ID
        undefined, // no IP address
        [message] // error details
      );
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);    
  };

  if (!isOpen) return null;

  if (showAuditViewer) {
    return (
      <UserAuditViewer 
        isOpen={showAuditViewer}
        onClose={() => setShowAuditViewer(false)}
      />
    );
  }

  if (showResetForm) {
    return <PasswordReset isModal={true} onBack={() => setShowResetForm(false)} />;
  }

  if (showDeleteModal && user) {
    return (
      <DeleteAccount 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={{
          uid: user.uid,
          displayName: user.displayName,
          email: user.email
        }}
        company={company}
      />
    );
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
            <label htmlFor="company">Lab/Company Name</label>
            <input
              id="company"
              type="text"
              value={company}
              className={styles.input}
              disabled
              readOnly
              style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
            />
            <p className={styles.helpText}>
              Company name can only be changed by an administrator. Contact support if changes are needed.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              className={styles.input}
              disabled
              readOnly
              style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
            />
            <p className={styles.helpText}>
              Email address cannot be changed for security reasons. Contact support if changes are needed.
            </p>
          </div>

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
                  onClick={() => setShowAuditViewer(true)}
                  className={styles.secondaryButton}
                >
                  View My Audit Trail
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className={styles.secondaryButton}
                >
                  Reset Password
                </button>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccountClick}
                className={styles.deleteButton}
              >
                Delete Striae Account
              </button>
            </form>
      </div>
    </div>
  );
};