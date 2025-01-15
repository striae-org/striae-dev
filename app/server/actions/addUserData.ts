'use server'

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
  userUid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  permitted?: boolean;
  createdAt?: string;
}

const WORKER_URL = paths.data_worker_url;
const KEYS_URL = paths.keys_url;

export async function addUserDataAction({
  userUid,
  email,
  firstName = '',
  lastName = '',
  permitted = false
}: AddUserParams): Promise<UserData> {
  try {
    const keyResponse = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`);
    if (!keyResponse.ok) {
      throw new Error('Failed to retrieve API key');
    }
    const apiKey = await keyResponse.text();

    // Check if user exists
    const checkResponse = await fetch(`${WORKER_URL}/${userUid}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (checkResponse.ok) {
      const existingData = await checkResponse.json() as Partial<UserData>;
      if (existingData?.uid === userUid) {
        return existingData as UserData;
      }
    }

    // Create new user
    const userData: UserData = {
      uid: userUid,
      email,
      firstName,
      lastName,
      permitted,
      createdAt: new Date().toISOString()
    };

    const createResponse = await fetch(`${WORKER_URL}/${userUid}/data.json`, {
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
    console.error('Error in addUserDataAction:', error);
    throw error;
  }
}