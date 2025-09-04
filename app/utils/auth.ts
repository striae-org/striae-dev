import paths from '~/config/config.json';

const KEYS_URL = paths.keys_url;
const KEYS_AUTH = paths.keys_auth;

// Legacy functions maintained for backward compatibility with frontend auth
// Workers now use service bindings instead of these functions

export async function getUserApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/USER_DB_AUTH`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve USER_DB_AUTH');
  }
  return keyResponse.text();
}

export async function getDataApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/R2_KEY_SECRET`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve R2_KEY_SECRET');
  }
  return keyResponse.text();
}

export async function getImageApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/IMAGES_API_TOKEN`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve IMAGES_API_TOKEN');
  }
  return keyResponse.text();
}

export async function getAccountHash(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/ACCOUNT_HASH`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve ACCOUNT_HASH');
  }
  return keyResponse.text();
}

export async function verifyAuthPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch(`${KEYS_URL}/verify-auth-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': KEYS_AUTH
      },
      body: JSON.stringify({ password })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json() as { valid: boolean };
    return result.valid;
  } catch (error) {
    console.error('Error verifying auth password:', error);
    return false;
  }
}