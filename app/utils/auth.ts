import paths from '~/config/config.json';

const KEYS_URL = paths.keys_url;

export async function getUserApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/1156868486435`);
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve API key');
  }
  return keyResponse.text();
}

export async function getDataApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/FWJIO_WFOLIWLF_WFOUIH`);
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve API key');
  }
  return keyResponse.text();
}

export async function getImageApiKey(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/1156884684684`);
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve API key');
  }
  return keyResponse.text();
}

export async function getAccountHash(): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/1568486544161`);
  if (!keyResponse.ok) {
    throw new Error('Failed to retrieve API key');
  }
  return keyResponse.text();
}