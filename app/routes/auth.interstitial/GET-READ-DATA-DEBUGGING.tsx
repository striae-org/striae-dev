import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData, Link } from '@remix-run/react';
import styles from './interstitial.module.css';
import { baseMeta } from '~/utils/meta';
import paths from '~/config.json';

export const meta = () => {
  return baseMeta({
    title: 'Beta Gatekeeper',
    description: 'Sorry, the beta is closed',
  });
};

interface CloudflareContext {  
    cloudflare: {
      env: {
        R2_KEY_SECRET: string;
      };
    };
  }

  interface UserData {
    email: string;
    firstName: string;
    lastName: string;
    permitted: boolean;
    createdAt: string;
    uid: string;
  }

  type LoaderData = UserData;

  const WORKER_URL = paths.data_worker_url;

  function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    'firstName' in data &&
    'lastName' in data &&
    'permitted' in data &&
    'createdAt' in data &&
    'uid' in data
  );
}


export const loader = async ({ request, context }: { request: Request; context: CloudflareContext }) => {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');

  if (!uid) {
    return redirect('/');
  }

  try {
    const response = await fetch(`${WORKER_URL}/${uid}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    if (!isUserData(userData)) {
      throw new Error('Invalid user data format');
    }

    return json<LoaderData>(userData);
     
  } catch (error) {
    console.error('Loader error:', error);
    throw error;
  }
};

export const Interstitial = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logo} />
      </Link>
      <div className={styles.formWrapper}>
        <div className={styles.form}>
          <div className={styles.title}>
            <h1>Welcome to Striae</h1>
          </div>
          <div className={styles.subtitle}>
            <h2>{data.firstName || data.email || 'User'}</h2>
          </div>
          <p>Your account is pending activation.</p>
          <div className={styles.options}>
            <Link to="/pricing" className={styles.button}>
              View Plans
            </Link>
            <Link to="/auth/login" className={styles.secondaryButton}>
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interstitial;