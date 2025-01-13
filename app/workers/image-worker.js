const EXPIRATION = 60 * 60 * 24; // 1 day
const API_BASE = "https://api.cloudflare.com/client/v4/accounts";

const hasValidToken = (request, env) => 
  request.headers.get("Authorization") === `Bearer ${env.API_TOKEN}`;

const bufferToHex = buffer => 
  [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');

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
      const url = new URL(request.url);

      switch (request.method) {
        case 'POST':
        case 'DELETE': {
          if (!hasValidToken(request, env)) {
            return new Response('Unauthorized', { status: 403 });
          }
          
          const endpoint = request.method === 'POST' 
            ? `${API_BASE}/${env.ACCOUNT_ID}/images/v1`
            : `${API_BASE}/${env.ACCOUNT_ID}/images/v1/${url.pathname.split('/').pop()}`;

          const response = await fetch(endpoint, {
            method: request.method,
            headers: {
              'Authorization': `Bearer ${env.API_TOKEN}`,
            },
            body: request.method === 'POST' ? await request.formData() : undefined
          });
          return response;
        }

        case 'GET': {
          const imageUrl = new URL(url.pathname.slice(1));
          const signedUrl = await generateSignedUrl(imageUrl, env.PRIVATE_KEY);
          return new Response(signedUrl);
        }

        default:
          return new Response('Method not allowed', { status: 405 });
      }
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  }
};