import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData, Link } from '@remix-run/react';
import styles from './interstitial.module.css';
import { baseMeta } from '~/utils/meta';

export const meta = () => {
  return baseMeta({
    title: 'Beta Access Gatekeeper',
    description: 'Sorry, your account is pending activation',
  });
};

interface LoaderData {
  uid: string;
  permitted: boolean;
  email: string;
  firstName: string;
}

interface UserData {
    email: string;
    firstName: string;
    lastName: string;
    permitted: boolean;
    createdAt: string;
    uid: string;
}

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

export const loader = async ({ request, context }: { request: Request; context: { cloudflare: { env: { R2_KEY_SECRET: string } } } }) => {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');  
  
  if (!uid) {
    return redirect('/auth/login');
  }

  try {
    const response = await fetch(`https://data.striae.allyforensics.com/${uid}/data.json`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    
    if (!isUserData(data)) {
      throw new Error('Invalid user data format');
    }
    
    if (data.permitted) {
      return redirect(`/app?uid=${uid}`); //TODO Replace with Canvas when completed
    }

    return json<LoaderData>({
      uid,
      permitted: false,
      email: data.email,
      firstName: data.firstName
    });

  } catch (error) {
    throw new Error('Failed to load user data');
  }
};

export const Interstitial = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <div className={styles.container}>
      <h1>Welcome to Striae</h1>
      <h2>{data.firstName || data.email}</h2>
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