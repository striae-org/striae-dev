import { useEffect, useState } from 'react';
import { useLocation } from '@remix-run/react';
import styles from './mobile-warning.module.css';

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Exclude paths containing 'popup' or specific auth routes
  const isExcludedPath = location.pathname.includes('popup') || 
    location.pathname.includes('oauth') || 
    location.pathname.includes('auth');

  if (!isMobile || isExcludedPath) return null;

  return (
    <div className={styles.mobileWarning}>
      <div className={styles.content}>
        <h2>Desktop Only</h2>
        <p>Striae is optimized for desktop use. Please visit us on a computer for the best experience.</p>
      </div>
    </div>
  );
}