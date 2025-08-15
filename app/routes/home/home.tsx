import { Link } from '@remix-run/react';
import styles from './home.module.css';
import { useState } from 'react';
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

  return (
    <>    
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo} />
          <div className={styles.title}>
            <p>Striae: A Firearms Examiner&apos;s Comparison Companion</p>
            <br />
            <p><em>Development currently on hold. Please check for updates <Link to="https://github.com/StephenJLu/striae?tab=readme-ov-file#striae-development-indefinitely-suspended">here</Link>. Thank you.</em></p>
          </div>
          <div className={styles.buttonGroup}>
            {/*
            <Link to="/auth" className={styles.actionButton}>
              Sign In / Register
            </Link>
            <Link to="/beta" className={styles.betaButton}>
              Learn About the Beta
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