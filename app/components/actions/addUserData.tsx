import { User } from 'firebase/auth';
import paths from '~/config.json';

interface CloudflareContext {
  cloudflare: {
    env: {
      FWJIO_WFOLIWLF_WFOUIH: string;
    };
  };
}

interface UserData {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  permitted: boolean;
  createdAt: string;
}

interface AddUserParams {
  user: User;
  firstName?: string;
  lastName?: string;
  permitted?: boolean;
  createdAt?: string;
  context: CloudflareContext;
}

const WORKER_URL = paths.data_worker_url;

export const addUserData = async ({ user, firstName = '', lastName = '', permitted = false, context }: AddUserParams) => {
  if (!context?.cloudflare?.env?.FWJIO_WFOLIWLF_WFOUIH) {
    throw new Error('Missing Cloudflare context');
  }

  try {
    // Check if user exists
    const checkResponse = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.FWJIO_WFOLIWLF_WFOUIH
      }
    });

    if (checkResponse.ok) {
      const existingData = await checkResponse.json();
      // Type guard to verify the shape of existingData
      const isUserData = (data: unknown): data is UserData => {
        return (
          typeof data === 'object' &&
          data !== null &&
          'uid' in data &&
          typeof data.uid === 'string'
        );
      };

      if (isUserData(existingData) && existingData.uid === user.uid) {
        return existingData;
      }
    }

    // Create new user if not exists
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      permitted,
      createdAt: new Date().toISOString()
    };

    const createResponse = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.FWJIO_WFOLIWLF_WFOUIH
      },
      body: JSON.stringify(userData)
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create user data');
    }

    return userData;
    
  } catch (error) {
    console.error('Error in addUserData:', error);
    throw error;
  }
};