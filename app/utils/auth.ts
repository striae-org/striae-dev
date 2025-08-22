import paths from '~/config/config.json';

const KEYS_URL = paths.keys_url;
const KEYS_AUTH = paths.TWuar70C2mdT8V4D9gUwGC0DC;

export async function getUserApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/USER_DB_AUTH`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve API key');
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
    throw new Error('Failed to retrieve API key');
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
    throw new Error('Failed to retrieve API key');
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
    throw new Error('Failed to retrieve API key');
  }
  return keyResponse.text();
}