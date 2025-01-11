import { Link } from '@remix-run/react';
import styles from './footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Link to="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link to="/terms" className={styles.link}>
            Terms & Conditions
          </Link>          
          <Link to="/security-policy" className={styles.link}>
            Security Policy
          </Link>
          <Link to="/bugs" className={styles.link}>
            Submit a Bug Report
          </Link>
        </nav>
        <p className={styles.copyright}>
          Striae © {year} AllyForensics. All rights reserved.
        </p>
      </div>
    </footer>
  );
}