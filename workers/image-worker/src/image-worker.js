const API_BASE = "https://api.cloudflare.com/client/v4/accounts";

/**
 * CORS headers to allow requests from the Striae app
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.striae.org',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Auth',
  'Content-Type': 'application/json'
};

const createResponse = (data, status = 200) => new Response(
  typeof data === 'string' ? data : JSON.stringify(data), 
  { status, headers: corsHeaders }
);

const hasValidToken = async (request, env) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  try {
    const token = authHeader.replace("Bearer ", "");
    const expectedToken = await env.KEYS_WORKER.getKey('IMAGES_API_TOKEN');
    return token === expectedToken;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Handle image upload requests
 */
async function handleImageUpload(request, env) {
  if (!(await hasValidToken(request, env))) {
    return createResponse({ error: 'Unauthorized' }, 403);
  }

  const formData = await request.formData();
  
  // Get API token and account ID from keys worker
  const apiToken = await env.KEYS_WORKER.getKey('IMAGES_API_TOKEN');
  const accountId = await env.KEYS_WORKER.getKey('ACCOUNT_HASH');
  
  const endpoint = `${API_BASE}/${accountId}/images/v1`;

  // Add requireSignedURLs to form data
  formData.append('requireSignedURLs', 'true');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
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
  if (!(await hasValidToken(request, env))) {
    return createResponse({ error: 'Unauthorized' }, 403);
  }

  const url = new URL(request.url);
  const imageId = url.pathname.split('/').pop();
  
  // Get API token and account ID from keys worker
  const apiToken = await env.KEYS_WORKER.getKey('IMAGES_API_TOKEN');
  const accountId = await env.KEYS_WORKER.getKey('ACCOUNT_HASH');
  
  const endpoint = `${API_BASE}/${accountId}/images/v1/${imageId}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    }
  });
  const data = await response.json();
  return createResponse(data, response.status);
}

/**
 * Handle Signed URL generation
 */

const KEY = 'HMAC_KEY';
const EXPIRATION = 60 * 60; // 1 hour

const bufferToHex = buffer =>
  [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');

async function generateSignedUrl(url) {
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(KEY);
  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Add expiration
  const expiry = Math.floor(Date.now() / 1000) + EXPIRATION;
  url.searchParams.set('exp', expiry);

  const stringToSign = url.pathname + '?' + url.searchParams.toString();
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  const sig = bufferToHex(new Uint8Array(mac).buffer);

  // Add signature
  url.searchParams.set('sig', sig);

  // Return the modified URL with signature and expiration
  return new Response(url.toString(), {
    headers: corsHeaders
  });
}

async function handleImageServing(request, env) {
  if (!(await hasValidToken(request, env))) {
    return createResponse({ error: 'Unauthorized' }, 403);
  }

  const url = new URL(request.url);
  const imageDeliveryURL = new URL(
    url.pathname.slice(1).replace('https:/imagedelivery.net', 'https://imagedelivery.net')
  );
  return generateSignedUrl(imageDeliveryURL);
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

