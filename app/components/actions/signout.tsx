import { useNavigate } from '@remix-run/react';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '~/config/firebase';
import styles from './signout.module.css';

interface SignOutProps {
  redirectTo?: string;
}

  export const SignOut = ({ redirectTo = '/' }: SignOutProps) => {
  const navigate = useNavigate();
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate(redirectTo);
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