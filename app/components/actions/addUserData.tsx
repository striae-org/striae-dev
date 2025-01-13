import { User } from 'firebase/auth';
import paths from '~/config/config.json';


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
}

const WORKER_URL = paths.data_worker_url;
const KEYS_URL = paths.keys_url;

export const addUserData = async ({ user, firstName = '', lastName = '', permitted = false }: AddUserParams) => {  

  try {
    // Get API key from keys worker
    const keyResponse = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`);
    if (!keyResponse.ok) {
      throw new Error('Failed to retrieve API key');
    }
    const apiKey = await keyResponse.text();

    // Check if user exists
    const checkResponse = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
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
        'X-Custom-Auth-Key': apiKey
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