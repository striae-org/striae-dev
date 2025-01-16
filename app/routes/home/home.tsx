import { Link } from '@remix-run/react';
import styles from './home.module.css';
import { useState } from 'react';
import { Notice } from '~/components/notice/notice';
import NoticeText from './NoticeText';

export default function Home() {
  const [isNoticeOpen, setNoticeOpen] = useState(false);

  const handleNoticeClose = () => {
    setNoticeOpen(false);
  };

  return (
    <>    
      <div className={styles.container}>
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