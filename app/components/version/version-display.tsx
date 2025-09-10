import { useEffect } from 'react';
import { getAppVersion, logAppVersion } from '../../utils/version';
import styles from './version-display.module.css';

interface VersionDisplayProps {
  showLabel?: boolean;
  className?: string;
  logToConsole?: boolean;
}

export default function VersionDisplay({ 
  showLabel = true, 
  className = '', 
  logToConsole = false 
}: VersionDisplayProps) {
  const version = getAppVersion();

  useEffect(() => {
    if (logToConsole) {
      logAppVersion();
    }
  }, [logToConsole]);

  return (
    <span className={`${styles.version} ${className}`}>
      {showLabel && 'Version: '}{version}
    </span>
  );
}
