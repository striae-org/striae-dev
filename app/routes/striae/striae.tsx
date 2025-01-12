import { User } from 'firebase/auth';
import { Sidebar } from '~/components/sidebar/sidebar';
import { Canvas } from '~/components/canvas/canvas';
import { Annotations } from '~/components/annotations/annotations';
import styles from './striae.module.css';

interface StriaePage {
  user: User;
  context: CloudflareContext;  
}

interface CloudflareContext {
  cloudflare: {
    env: Env;
  };
}

export const Striae = ({ user, context }: StriaePage) => {
  return (
    <div className={styles.appContainer}>
      <Sidebar user={user} context={context} />
      <main className={styles.mainContent}>
        <Canvas />
        <Annotations />
      </main>
    </div>
  );
};