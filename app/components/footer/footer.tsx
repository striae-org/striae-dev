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
  }, []);
  
  return (    
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <a href="https://help.striae.org" target="_blank" rel="noopener noreferrer" className={styles.link}>
            User&apos;s Guide
          </a>
          <Link to="/privacy#top" className={styles.link}>
            Privacy Policy
          </Link>
          <Link to="/terms#top" className={styles.link}>
            Terms & Conditions
          </Link>          
          <Link to="/security#top" className={styles.link}>
            Security Policy
          </Link>
          <Link to="/support#top" className={styles.link}>
            Need Help?
          </Link>
          <Link to="/bugs#top" className={styles.link}>
            Submit a Bug Report
          </Link>
        </nav>
        <p className={styles.copyright}>
          <a href="https://github.com/striae-org/striae/blob/master/LICENSE" className={styles.link} target="_blank" rel="noopener noreferrer">Striae {appVersion}</a> © {year}. All rights reserved.
          <br />
            <a href="https://www.StephenJLu.com" className={styles.linkSmall} target="_blank" rel="noopener noreferrer">Designed and developed by Stephen J. Lu</a>        
        </p>
        <div className={styles.badgeContainer}>
          <div className={styles.openCollectiveWidget}>
            <a 
              href="https://opencollective.com/striae" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#1f87ff',
                borderRadius: '6px',
                color: 'white',
                padding: '8px 16px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-block'
              }}
            >
              Contribute to our Collective
            </a>
          </div>
          <div className={styles.oinBadge}>
            <a
              href="https://openinventionnetwork.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.oinBadgeLink}
            >
              <img 
                src="/oin-badge.png" 
                alt="Open Invention Network Community Member" 
                className={styles.oinBadgeImage}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>    
  );
}