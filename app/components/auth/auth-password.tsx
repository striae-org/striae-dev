import { useState, useEffect } from 'react';
import { Link, useFetcher } from '@remix-run/react';
import styles from './auth-password.module.css';

interface AuthPasswordProps {
  onAccessGranted: () => void;
}

export const AuthPassword = ({ onAccessGranted }: AuthPasswordProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const fetcher = useFetcher();

  // Check if access is already granted
  useEffect(() => {
    if (sessionStorage.getItem('auth-access-granted') === 'true') {
      onAccessGranted();
    }
  }, [onAccessGranted]);

  // Handle server response
  useEffect(() => {
    if (fetcher.data && typeof fetcher.data === 'object') {
      const data = fetcher.data as { success?: boolean; error?: string };
      if (data.success) {
        sessionStorage.setItem('auth-access-granted', 'true');
        onAccessGranted();
      } else if (data.error) {
        setError(data.error);
        setPassword('');
      }
    }
  }, [fetcher.data, onAccessGranted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData();
    formData.append('intent', 'verify-password');
    formData.append('password', password);
    
    fetcher.submit(formData, { method: 'post' });
  };

  const isLoading = fetcher.state === 'submitting';

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logo} />
      </Link>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Authentication Access</h1>
        <p className={styles.description}>
          Please enter the access password provided to you during registration.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access password"
            className={styles.input}
            required
            disabled={isLoading}
            autoComplete="off"
          />
          
          {error && <p className={styles.error}>{error}</p>}
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading || !password}
          >
            {isLoading ? 'Verifying...' : 'Access Authentication'}
          </button>
        </form>
        
        <div className={styles.helpSection}>
          <p className={styles.helpText}>
            Need access? Complete the registration form first.
          </p>
          <Link to="/access/signup" className={styles.signupLink}>
            Register for Access
          </Link>
        </div>
      </div>
    </div>
  );
};
