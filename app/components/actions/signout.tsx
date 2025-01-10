import { auth } from '~/services/firebase';
import styles from './signout.module.css';

interface SignOutProps {
  redirectTo?: string;
}

  export const SignOut = ({ redirectTo = '/' }: SignOutProps) => {    

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