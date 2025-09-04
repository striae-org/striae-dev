import { WorkerEntrypoint } from "cloudflare:workers";

/**
 * @typedef {Object} Env
 * @property {string} R2_KEY_SECRET
 * @property {string} SL_API_KEY
 * @property {string} CFT_PUBLIC_KEY
 * @property {string} CFT_SECRET_KEY
 * @property {string} ACCOUNT_HASH
 * @property {string} IMAGES_API_TOKEN
 * @property {string} USER_DB_AUTH
 * @property {string} KEYS_AUTH
 * @property {string} AUTH_PASSWORD
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.striae.org',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'text/plain'
};

const hasValidHeader = (request, env) => 
  request.headers.get("X-Custom-Auth-Key") === env.KEYS_AUTH;

export default class KeysWorker extends WorkerEntrypoint {
  /**
   * RPC method to get an API key by name
   * @param {string} keyName - The name of the key to retrieve
   * @returns {Promise<string>} The API key value
   */
  async getKey(keyName) {
    if (!keyName || !(keyName in this.env)) {
      throw new Error(`Key '${keyName}' not found`);
    }
    return this.env[keyName];
  }

  /**
   * RPC method to verify auth password
   * @param {string} password - The password to verify
   * @returns {Promise<boolean>} Whether the password is valid
   */
  async verifyAuthPassword(password) {
    if (!password) {
      return false;
    }
    return password === this.env.AUTH_PASSWORD;
  }
  /**
   * HTTP fetch handler for backward compatibility
   * @param {Request} request 
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!hasValidHeader(request, this.env)) {
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/', '');
    
    // Handle password verification
    if (request.method === 'POST' && path === 'verify-auth-password') {
      try {
        const { password } = await request.json();
        const isValid = await this.verifyAuthPassword(password);
        
        return new Response(JSON.stringify({ valid: isValid }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle regular key retrieval
    if (request.method === 'GET') {
      const keyName = path;
      
      if (!keyName) {
        return new Response('Key name required', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      try {
        const key = await this.getKey(keyName);
        return new Response(key, {
          headers: corsHeaders
        });
      } catch (error) {
        return new Response('Key not found', { 
          status: 404,
          headers: corsHeaders 
        });
      }
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
}