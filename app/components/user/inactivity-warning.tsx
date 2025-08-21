import { useState, useEffect } from 'react';
import styles from './inactivity-warning.module.css';

interface InactivityWarningProps {
  isOpen: boolean;
  remainingSeconds: number;
  onExtendSession: () => void;
  onSignOut: () => void;
}

export const InactivityWarning = ({
  isOpen,
  remainingSeconds,
  onExtendSession,
  onSignOut
}: InactivityWarningProps) => {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    setCountdown(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Trigger sign out when countdown reaches 0
          onSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onSignOut]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Session Timeout Warning</h3>
        </div>
        
        <div className={styles.content}>
          <p>
            Your session will expire due to inactivity in:
          </p>
          <div className={styles.countdown}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <p>
            Would you like to extend your session?
          </p>
        </div>
        
        <div className={styles.actions}>
          <button
            onClick={onExtendSession}
            className={styles.extendButton}
          >
            Extend Session
          </button>
          <button
            onClick={onSignOut}
            className={styles.signOutButton}
          >
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
};
