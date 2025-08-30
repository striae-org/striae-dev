//import { Link } from '@remix-run/react';
import styles from './home.module.css';
import { useState, useEffect } from 'react';
import { Notice } from '~/components/notice/notice';
import NoticeText from './NoticeText';
import { baseMeta } from '~/utils/meta';

export const meta = () => {
  return baseMeta({
    title: "Welcome to Striae",
    description: "A Firearms Examiner's Comparison Companion",
  });
};

export default function Home() {
  const [isNoticeOpen, setNoticeOpen] = useState(false);

  const handleNoticeClose = () => {
    setNoticeOpen(false);
  };
  
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
      const launchDate = new Date('2025-09-01T11:00:00-07:00');
      const updateTimer = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('00:00:00:00');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(
        `${days.toString().padStart(2, '0')}:` +
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo} />
          <div className={styles.title}>
            <p>Striae: A Firearms Examiner&apos;s Comparison Companion</p>
          </div>
          <div className={styles.subtitle}>
            <p>Beta Launches September 1, 2025 @ 11:00 AM MST</p>
            <pre style={{ fontFamily: 'monospace', fontSize: '2.5rem', margin: '0.5em 0', color: '#FFF', background: 'none', border: 'none' }}>{timeLeft}</pre>
          </div>
          <div className={styles.buttonGroup}>
            {/* Disabled until beta launch
            <Link to="/auth" className={styles.actionButton}>
              Sign In
            </Link>
            <Link to="/access" className={styles.accessButton}>
              Register Now
            </Link>
            */}
            <button onClick={() => setNoticeOpen(true)} className={styles.actionButton}>
              What is this?
            </button>
          </div>
        </div>
      </div>
      <Notice isOpen={isNoticeOpen} onClose={handleNoticeClose} notice={{ title: 'About Striae', content: <NoticeText /> }} />
    </>
  );
}