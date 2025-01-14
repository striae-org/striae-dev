const API_BASE = "https://api.cloudflare.com/client/v4/accounts";

/**
 * CORS headers to allow requests from the Striae app
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://striae.allyforensics.com',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const createResponse = (data, status = 200) => new Response(
  typeof data === 'string' ? data : JSON.stringify(data), 
  { status, headers: corsHeaders }
);

const hasValidToken = (request, env) => 
  request.headers.get("Authorization") === `Bearer ${env.API_TOKEN}`;

/**
 * Handle image upload requests
 */
async function handleImageUpload(request, env) {
  if (!hasValidToken(request, env)) {
    return createResponse({ error: 'Unauthorized' }, 403);
  }

  const formData = await request.formData();
  const endpoint = `${API_BASE}/${env.ACCOUNT_ID}/images/v1`;

  // Add requireSignedURLs to form data
  formData.append('requireSignedURLs', 'true');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.API_TOKEN}`,
    },
    body: formData
  });
  const data = await response.json();
  return createResponse(data, response.status);
}

/**
 * Handle image delete requests
 */

async function handleImageDelete(request, env) {
  if (!hasValidToken(request, env)) {
    return createResponse({ error: 'Unauthorized' }, 403);
  }

  const url = new URL(request.url);
  const imageId = url.pathname.split('/').pop();
  const endpoint = `${API_BASE}/${env.ACCOUNT_ID}/images/v1/${imageId}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${env.API_TOKEN}`,
    }
  });
  const data = await response.json();
  return createResponse(data, response.status);
}

/**
 * Handle Signed URL generation
 */

const EXPIRATION = 60 * 60 * 24; // 1 day

const bufferToHex = buffer => 
  [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');


async function generateSignedUrl(url, env) {

  // `url` is a full imagedelivery.net URL
  // e.g. https://imagedelivery.net/cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/striae

  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(env.SIGNING_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Attach the expiration value to the `url`
  const expiry = Math.floor(Date.now() / 1000) + EXPIRATION;
  url.searchParams.set('exp', expiry.toString());

  // `url` now looks like
  // https://imagedelivery.net/cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/striae?exp=1631289275


  const stringToSign = url.pathname + '?' + url.searchParams.toString();
  // for example, /cheeW4oKsx5ljh8e8BoL2A/bc27a117-9509-446b-8c69-c81bfeac0a01/mobile?exp=1631289275

  const mac = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(stringToSign));
  const sig = bufferToHex(mac);

  // And attach it to the `url`
  url.searchParams.set('sig', sig);

  return url.toString();
}

async function handleImageServing(request, env) {
  const url = new URL(request.url);
  const imageId = url.pathname.slice(1); // Remove leading slash
  
  const imageUrl = new URL(
    `https://imagedelivery.net/${env.ACCOUNT_HASH}/${imageId}/striae`
  );
  
  const signedUrl = await generateSignedUrl(imageUrl, env.SIGNING_KEY);
  return createResponse(signedUrl);
}

/**
 * Main worker functions
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (request.method) {
        case 'POST':
          return handleImageUpload(request, env);
        case 'GET':
          return handleImageServing(request, env);
        case 'DELETE':
          return handleImageDelete(request, env);
        default:
          return createResponse({ error: 'Method not allowed' }, 405);
      }
    } catch (error) {
      return createResponse({ error: error.message }, 500);
    }
  }
};

