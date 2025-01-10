import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData, Link } from '@remix-run/react';
import styles from './interstitial.module.css';
import { baseMeta } from '~/utils/meta';

export const meta = () => {
  return baseMeta({
    title: 'Beta Gatekeeper',
    description: 'Sorry, the beta is closed',
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
    return redirect('/');
  }

  try {
    // Get user data from data.json using worker's GET method
    const response = await fetch(`https://data.striae.allyforensics.com/${uid}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const users = await response.json();
    const userData = Array.isArray(users) ? users.find(user => user.uid === uid) : null;
    
    if (!userData || !isUserData(userData)) {
      throw new Error('User not found');
    }
    
    if (userData.permitted === true) {
      return redirect(`/app?uid=${uid}`);
    }

    if (userData.permitted === false) {
      return json<LoaderData>({
        uid: userData.uid,
        permitted: false,
        email: userData.email,
        firstName: userData.firstName
      });
    }

    throw new Error('Invalid permission state');

  } catch (error) {
    console.error(error);
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