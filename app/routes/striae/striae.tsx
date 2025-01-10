import { useEffect } from 'react';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { User } from 'firebase/auth';
import { auth } from '~/services/firebase';
import { Sidebar } from '~/components/sidebar/sidebar';
import { Canvas } from '~/components/canvas/canvas';
import { Annotations } from '~/components/annotations/annotations';
import styles from './striae.module.css';
import { baseMeta } from '~/utils/meta';

export const meta = () => {
  return baseMeta({
    title: 'Striae',
    description: 'A Firearms Examiner&apos;s Comparison Companion',
  });
};

interface CloudflareContext {  
    cloudflare: {
      env: {
        R2_KEY_SECRET: string;
      };
    };
  }

interface LoaderData {
  user: User;
  context: CloudflareContext;
}

export const loader = async ({ context }: { context: CloudflareContext }) => {
  const currentUser = auth.currentUser;
  
  if (!currentUser || !currentUser.emailVerified) {
    return redirect('/');
  }

  return json<LoaderData>({ 
    user: currentUser,
    context 
  });
};

export const Striae = () => {
  const { user, context } = useLoaderData<LoaderData>();

  useEffect(() => {
    if (!user) {
      window.location.href = '/';
    }
  }, [user]);

  return (
    <div className={styles.appContainer}>
      <Sidebar user={user} context={context} />
      <main className={styles.mainContent}>
        <Canvas />
        <Annotations />
      </main>
    </div>
  );
}

export default Striae;