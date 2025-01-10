import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '~/config/firebase';
import styles from './signout.module.css';

interface SignOutProps {
  redirectTo?: string;
}

  export const SignOut = ({ redirectTo = '/' }: SignOutProps) => {  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      
      // Add signout param to URL
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set('signout', 'true');
      window.location.href = url.toString();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <button onClick={handleSignOut} className={styles.secondaryButton}>
      Sign Out
    </button>
  );
};