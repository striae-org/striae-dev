import { Link } from '@remix-run/react';
import { useEffect } from 'react';
import styles from './footer.module.css';
import { getAppVersion, logAppVersion } from '../../utils/version';

export default function Footer() {
  const year = new Date().getFullYear();
  const appVersion = getAppVersion();
  
  useEffect(() => {
    // Log version to console for debugging
    logAppVersion();
    
    if (typeof window !== 'undefined') {      
      if (!document.querySelector('script[src="/scripts/becomePatronButton.bundle.js"]')) {
        const script = document.createElement('script');
        script.src = '/scripts/becomePatronButton.bundle.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);
  
  return (    
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Link to="https://help.striae.org" target="_blank" rel="noopener noreferrer" className={styles.link}>
            User&apos;s Guide
          </Link>
          <Link to="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link to="/terms" className={styles.link}>
            Terms & Conditions
          </Link>          
          <Link to="/security" className={styles.link}>
            Security Policy
          </Link>
          <Link to="/support" className={styles.link}>
            Need Help?
          </Link>
          <Link to="/bugs" className={styles.link}>
            Submit a Bug Report
          </Link>
        </nav>
        <p className={styles.copyright}>
          <Link to="https://github.com/striae-org/striae/blob/master/LICENSE" className={styles.link} target="_blank" rel="noopener noreferrer">Striae {appVersion}</Link> © {year}. All rights reserved.
          <br />
            <Link to="https://www.StephenJLu.com" className={styles.linkSmall} target="_blank" rel="noopener noreferrer">Designed and developed by Stephen J. Lu</Link>        
        </p>
        <div className={styles.patreonWidget}>
          <a href="https://www.patreon.com/bePatron?u=185198297" data-patreon-widget-type="become-patron-button">Become a member!</a>
        </div>
      </div>
    </footer>    
  );
}