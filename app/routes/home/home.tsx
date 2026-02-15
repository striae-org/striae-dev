import styles from './home.module.css';
import { useState } from 'react';
import { Notice } from '~/components/notice/notice';
import NoticeText from './NoticeText';
import { baseMeta } from '~/utils/meta';
import { BlogFeed } from '~/components/blog-feed/blog-feed';

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
      <div id="top" className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo} />
          <div className={styles.title}>
            <p>Striae: A Firearms Examiner&apos;s Comparison Companion</p>
          </div>
          <div className={styles.buttonGroup}>            
            <a 
              href="/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.signInButton}>
              Sign In
            </a>
            <button onClick={() => setNoticeOpen(true)} className={styles.actionButton}>
              What is this?
            </button>                       
          </div>
          <div className={styles.loginHelp}>
            <a 
              href="https://help.striae.org/striae-users-guide/getting-started/how-to-log-into-striae"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.helpLink}>
              How do I login to Striae?
            </a>
          </div>
          <div className={styles.noticeSection}>
            <p className={styles.noticeText}>Access to Striae is free for professionals employed at a forensic laboratory or organization
              <br />
              </p>
            <div className={styles.buttonGroup}>              
              <a 
                href="https://support.striae.org/form/Y4sWjhi6Ppf"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}>
                Request a Demo
              </a>
            </div>            
          </div>         
          
          <BlogFeed />
                    
        </div>
      </div>
      <Notice isOpen={isNoticeOpen} onClose={handleNoticeClose} notice={{ title: 'About Striae', content: <NoticeText /> }} />      
    </>
  );
}