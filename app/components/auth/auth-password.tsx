import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { verifyAuthPassword } from '~/utils/auth';
import styles from './auth-password.module.css';

interface AuthPasswordProps {
  onAccessGranted: () => void;
}

export const AuthPassword = ({ onAccessGranted }: AuthPasswordProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('auth-access-granted') === 'true') {
      onAccessGranted();
    }
  }, [onAccessGranted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');    

    try {      
      const isValidPassword = await verifyAuthPassword(password);      
      
      if (isValidPassword) {
        sessionStorage.setItem('auth-access-granted', 'true');
        onAccessGranted();
      } else {
        setError('Incorrect access password. Please contact support if you need access.');
        setPassword('');
      }
    } catch (error) {
      setError('Unable to verify password. Please try again later.');
      console.error('Error verifying auth password:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logo} />
      </Link>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Striae Access</h1>
        <p className={styles.description}>
          Please enter the access password provided to you during registration. If you have lost the access password, you may re-register.
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
            {isLoading ? 'Verifying...' : 'Access Striae'}
          </button>
        </form>
        
        <div className={styles.helpSection}>
          <p className={styles.helpText}>
            Need access?
          </p>
          <Link to="/access" className={styles.signupLink}>
            Register your account
          </Link>
        </div>
      </div>
    </div>
  );
};
