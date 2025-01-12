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
      window.location.href = redirectTo;
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