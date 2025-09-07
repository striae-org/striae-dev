import { useState, useEffect } from 'react';
import { Link, useFetcher } from '@remix-run/react';
import styles from './auth-password.module.css';

interface AuthPasswordProps {
  onAccessGranted: () => void;
}

export const AuthPassword = ({ onAccessGranted }: AuthPasswordProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const fetcher = useFetcher<{
    success: boolean;
    isLocked: boolean;
    attemptsRemaining: number;
    error?: string;
  }>();

  const isLoading = fetcher.state === 'submitting';

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      const { success, isLocked, attemptsRemaining, error } = fetcher.data;
      
      setIsLockedOut(isLocked);
      setAttemptsRemaining(attemptsRemaining);
      
      if (success) {
        sessionStorage.setItem('auth-access-granted', 'true');
        onAccessGranted();
      } else if (error) {
        setError(error);
        setPassword('');
      }
    }
  }, [fetcher.data, onAccessGranted]);

  useEffect(() => {
    if (sessionStorage.getItem('auth-access-granted') === 'true') {
      onAccessGranted();
      return;
    }
  }, [onAccessGranted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    setError('');
    
    const formData = new FormData();
    formData.append('password', password);
    
    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logo} />
      </Link>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Striae Access</h1>
        <p className={styles.description}>
          Please enter the access password provided to you during registration. If you have lost the access password or it has become invalid, you may re-register.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access password"
            className={styles.input}
            required
            disabled={isLoading || isLockedOut}
            autoComplete="off"
          />
          
          {isLockedOut ? (
            <p className={styles.error}>
              Too many failed attempts. Please try again later.
            </p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : !isLockedOut && attemptsRemaining < 5 ? (
            <p className={styles.error}>
              {attemptsRemaining} attempts remaining
            </p>
          ) : null}
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading || !password || isLockedOut}
          >
            {isLoading ? 'Verifying...' : isLockedOut ? 'Locked Out' : 'Access Striae'}
          </button>
        </form>
        
        <div className={styles.helpSection}>
          <p className={styles.helpText}>
            Need access?
          </p>
          <Link to="/access" className={styles.signupLink}>
            Account Registration/Renewal
          </Link>
        </div>
      </div>
    </div>
  );
};
