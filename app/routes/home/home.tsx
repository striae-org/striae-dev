import { Link } from '@remix-run/react';
import { ThemeProvider } from '~/components/theme-provider/theme-provider';
import styles from './home.module.css';

export default function Home() {
  return (
    <ThemeProvider>
      <div className={styles.container} data-theme="light">
        <div className={styles.content}>
          <div className={styles.logo} />
          <div className={styles.title}>
            Striae: A Firearms Examiner&apos;s Comparison Companion
          </div>
          <div className={styles.buttonGroup}>
            <Link to="/auth" className={styles.actionButton}>
              Sign In / Register
            </Link>
            <Link to="/beta" className={styles.betaButton}>
              Learn About the Beta
            </Link>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}