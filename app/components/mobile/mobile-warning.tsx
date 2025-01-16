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

  const isAuthPath = location.pathname.includes('auth');

  if (!isMobile || !isAuthPath) return null;

  return (
    <div className={styles.mobileWarning}>
      <div className={styles.content}>
        <h2>Desktop Only</h2>
        <p>Striae is optimized for desktop use. Please visit us on a computer for the best experience.</p>
      </div>
    </div>
  );
}