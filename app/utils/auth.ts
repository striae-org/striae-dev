import paths from '~/config/config.json';

const KEYS_URL = paths.keys_url;
const KEYS_AUTH = paths.keys_auth;

export async function getUserApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/1156868486435`, {
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
  const keyResponse = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`, {
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
  const keyResponse = await fetch(`${KEYS_URL}/1156884684684`, {
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
  const keyResponse = await fetch(`${KEYS_URL}/1568486544161`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve API key');
  }
  return keyResponse.text();
}