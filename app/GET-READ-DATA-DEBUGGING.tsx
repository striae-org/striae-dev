import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData, Link } from '@remix-run/react';
import styles from './interstitial.module.css';
import { baseMeta } from '~/utils/meta';
import { SignOut } from '~/components/actions/signout';
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
        FWJIO_WFOLIWLF_WFOUIH: string;
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
        'X-Custom-Auth-Key': context.cloudflare.env.FWJIO_WFOLIWLF_WFOUIH,
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status);
      return json<LoaderData>({ data: [], context });
    }

    const data = await response.json();
    console.log('Loader data:', data); // Debug log
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
  console.log('Component data:', data); // Debug log

  if (data[0]?.permitted === true) {
    return redirect(`/app?uid=${data[0].uid}`);
  }

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
      <h2>{data?.[0]?.firstName || data?.[0]?.email || 'User'}</h2>
      </div>
      <p>Your account is pending activation.</p>
      <div className={styles.options}>
        {/* TODO Replace with Pricing when Completed */}
        <Link to="/pricing" className={styles.button}>
          View Plans
        </Link>
        <SignOut />
      </div>
      </div>
    </div>
    </div>
  );
}

export default Interstitial;