export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const keyName = url.pathname.replace('/', '');
    
    if (!keyName) {
      return new Response('Key name required', { status: 400 });
    }

    return new Response(env[keyName], {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });
  }
}