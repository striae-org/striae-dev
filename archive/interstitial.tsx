import { User } from 'firebase/auth';
import { Link } from '@remix-run/react';
import styles from './interstitial.module.css';
import { SignOut } from '~/components/actions/signout';

interface InterstitialProps {
  user: User;
}

export const Interstitial = ({ user }: InterstitialProps) => {
  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logo} />
      </Link>
      <div className={styles.formWrapper}>
        <div className={styles.form}>
          <div className={styles.title}>
            <h1>Welcome to Striae</h1>
          </div>
          <div className={styles.subtitle}>
            <h2>{user.email || 'User'}</h2>
          </div>
          <p>Your account is pending activation.</p>
          <div className={styles.options}>
            <Link to="/pricing" className={styles.button}>
              View Plans
            </Link>
            <SignOut />
          </div>
        </div>
      </div>
    </div>
  );
};