import { useEffect, useState } from 'react';
import { useLocation } from '@remix-run/react';
import styles from './mobile-warning.module.css';

export default function MobileWarning() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobileOrTablet = () => {
      // Screen size check (up to 1024px to include tablets)
      const isSmallScreen = window.innerWidth <= 1024;
      
      // Enhanced user agent detection with more patterns
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini|webos|windows phone|palm|symbian|kindle|silk|fennec/i.test(userAgent);
      const isTabletUA = /tablet|ipad|playbook|silk|kindle|android(?!.*mobile)/i.test(userAgent);
      
      // Touch capability detection
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           (navigator as any).msMaxTouchPoints > 0;
      
      // Screen orientation support (mobile/tablet specific)
      const hasOrientationAPI = 'orientation' in window || 'onorientationchange' in window;
      
      // Hover capability detection (desktop typically supports hover, mobile doesn't)
      const hasHoverSupport = window.matchMedia('(hover: hover)').matches;
      const hasPointerFine = window.matchMedia('(pointer: fine)').matches;
      
      // Device pixel ratio (mobile devices often have high DPI)
      const highDPI = window.devicePixelRatio > 1.5;
      
      // Screen aspect ratio (mobile devices typically have tall aspect ratios)
      const aspectRatio = window.innerHeight / window.innerWidth;
      const isTallScreen = aspectRatio > 1.3; // Portrait orientation bias
      
      // Connection type (mobile networks) - optional, might not be available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const isMobileConnection = connection && /cellular|3g|4g|5g|wimax/i.test(connection.effectiveType || connection.type || '');
      
      // Combine multiple detection methods with weighted scoring
      const mobileScore = [
        isSmallScreen,
        isMobileUA,
        isTabletUA,
        isTouchDevice && !hasHoverSupport,
        hasOrientationAPI && isSmallScreen,
        !hasPointerFine && isTouchDevice,
        highDPI && isSmallScreen,
        isTallScreen && isSmallScreen,
        isMobileConnection
      ].filter(Boolean).length;
      
      // Consider it mobile/tablet if multiple indicators suggest so
      const isMobileOrTabletDevice = mobileScore >= 2 || isSmallScreen || isMobileUA || isTabletUA;
      
      setIsMobileOrTablet(isMobileOrTabletDevice);
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);

  const isAuthPath = location.pathname.includes('auth');

  if (!isMobileOrTablet || !isAuthPath) return null;

  return (
    <div className={styles.mobileWarning}>
      <div className={styles.content}>
        <h2>Desktop Only</h2>
        <p>Striae is optimized for desktop use only. Mobile devices and tablets are not supported. Please visit us on a desktop computer for the best experience.</p>
      </div>
    </div>
  );
}