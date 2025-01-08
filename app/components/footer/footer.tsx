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
          <Link to="/license" className={styles.link}>
            License & Terms
          </Link>
          <Link to="/security-policy" className={styles.link}>
            Security Policy
          </Link>
        </nav>
        <p className={styles.copyright}>
          Striae © {year} AllyForensics. All rights reserved.
        </p>
      </div>
    </footer>
  );
}