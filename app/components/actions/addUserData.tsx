import { User } from 'firebase/auth';
import paths from '~/config.json';

interface AddUserDataParams {
  user: User;  
  firstName?: string;
  lastName?: string;
  permitted?: boolean;
}

interface UserData {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  permitted: boolean;
  createdAt: string;
}

const WORKER_URL = paths.data_worker_url;

export const addUserData = async ({ user, firstName = '', lastName = '', permitted = false }: AddUserDataParams) => {
  const userData: UserData = {
    uid: user.uid,
    email: user.email ?? '',
    firstName,
    lastName,
    permitted,
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': process.env.R2_KEY_SECRET as string
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to create user data');
    }

    return userData;
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
};