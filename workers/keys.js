/**
 * @typedef {Object} Env
 * @property {string} FWJIO_WFOLIWLF_WFOUIH
 * @property {string} WDEFOIJ_EFOIJ
 * @property {string} JOCVKJWEW
 * @property {string} EFJIOJVMEW
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://striae.allyforensics.com',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'text/plain'
};

const hasValidHeader = (request, env) => 
  request.headers.get("X-Custom-Auth-Key") === env.KEYS_AUTH;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!hasValidHeader(request, env)) {
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const keyName = url.pathname.replace('/', '');
    
    if (!keyName) {
      return new Response('Key name required', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    if (!(keyName in env)) {
      return new Response('Key not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    return new Response(env[keyName], {
      headers: corsHeaders
    });
  }
};