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

  interface Data {
    email: string;
    firstName: string;
    lastName: string;
    permitted: boolean;
    createdAt: string;
    uid: string;
  }

  interface LoaderData {
    data: Data[];
    context: CloudflareContext;
  }

  const WORKER_URL = paths.data_worker_url;


export const loader = async ({ context }: { context: CloudflareContext }) => {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status);
      return json<LoaderData>({ data: [], context });
    }

    const data = await response.json();
    return json<LoaderData>({ 
    data: Array.isArray(data) ? data.filter(Boolean) : [],
    context 
  });
     
  } catch (error) {
    console.error('Loader error:', error);
    return json<LoaderData>({ data: [], context });
  }
};

export const Interstitial = () => {
  const { data } = useLoaderData<typeof loader>();

  if (data[0]?.permitted === true) {
    return redirect(`/app?uid=${data[0].uid}`);
  }

  return (
    <div className={styles.container}>
      <h1>Welcome to Striae</h1>
      <h2>{data[0]?.firstName || data[0]?.email}</h2>
      <p>Your account is pending activation.</p>
      <div className={styles.options}>
        {/* TODO Replace with Pricing when Completed */}
        <Link to="/pricing" className={styles.button}>
          View Plans
        </Link>
        <Link to="/auth/login" className={styles.secondaryButton}>
          Sign Out
        </Link>
      </div>
    </div>
  );
}

export default Interstitial;