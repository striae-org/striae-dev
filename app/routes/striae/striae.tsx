import { User } from 'firebase/auth';
import { Sidebar } from '~/components/sidebar/sidebar';
import { Canvas } from '~/components/canvas/canvas';
import { Annotations } from '~/components/annotations/annotations';
import styles from './striae.module.css';

interface StriaePage {
  user: User;    
}

export const Striae = ({ user }: StriaePage) => {
  return (
    <div className={styles.appContainer}>
      <Sidebar user={user} />
      <main className={styles.mainContent}>
        <Canvas />
        <Annotations />
      </main>
    </div>
  );
};