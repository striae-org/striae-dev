const EXPIRATION = 60 * 60 * 24; // 1 day
const API_BASE = "https://api.cloudflare.com/client/v4/accounts";

const hasValidToken = (request, env) => 
  request.headers.get("Authorization") === `Bearer ${env.API_TOKEN}`;

const bufferToHex = buffer => 
  [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');

async function handleImageUpload(request, env) {
  if (!hasValidToken(request, env)) {
    return new Response('Unauthorized', { status: 403 });
  }

  const formData = await request.formData();
  const endpoint = `${API_BASE}/${env.ACCOUNT_ID}/images/v1`;

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.API_TOKEN}`,
    },
    body: formData
  });
}

async function handleImageDelete(request, env) {
  if (!hasValidToken(request, env)) {
    return new Response('Unauthorized', { status: 403 });
  }

  const url = new URL(request.url);
  const imageId = url.pathname.split('/').pop();
  const endpoint = `${API_BASE}/${env.ACCOUNT_ID}/images/v1/${imageId}`;

  return fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${env.API_TOKEN}`,
    }
  });
}

async function handleImageServing(request, env) {
  const url = new URL(request.url);
  const imageUrl = new URL(url.pathname.slice(1));
  const signedUrl = await generateSignedUrl(imageUrl, env.PRIVATE_KEY);
  return new Response(signedUrl);
}

async function generateSignedUrl(url, key) {
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expiry = Math.floor(Date.now() / 1000) + EXPIRATION;
  url.searchParams.set('exp', expiry.toString());

  const stringToSign = url.pathname + '?' + url.searchParams.toString();
  const mac = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(stringToSign));
  const sig = bufferToHex(mac);
  url.searchParams.set('sig', sig);

  return url.toString();
}

export default {
  async fetch(request, env) {
    try {     

      switch (request.method) {
        case 'POST':
          return handleImageUpload(request, env);
        case 'GET':
          return handleImageServing(request, env);
        case 'DELETE':
          return handleImageDelete(request, env);
        default:
          return new Response('Method not allowed', { status: 405 });
      }
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  }
};