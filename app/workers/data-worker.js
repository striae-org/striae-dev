const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};

const createResponse = (data, status = 200) => new Response(
  JSON.stringify(data), 
  { status, headers: corsHeaders }
);

const hasValidHeader = (request, env) => 
  request.headers.get("X-Custom-Auth-Key") === env.R2_KEY_SECRET;

export default {
  async fetch(request, env) {       
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (!hasValidHeader(request, env)) {
      return createResponse({ error: 'Forbidden' }, 403);
    }

    try {
      const bucket = env.STRIAE_DATA;
      
      switch (request.method) {
        case "GET": {
          const file = await bucket.get('data.json');
          const data = file ? JSON.parse(await file.text()) : [];
          return createResponse(data);
        }

        case "PUT": {
          const file = await bucket.get('data.json');
          const data = file ? JSON.parse(await file.text()) : [];
          const newData = await request.json();
          
          data.push(newData);
          await bucket.put('data.json', JSON.stringify(data));
          
          return createResponse({ success: true });
        }

        case "DELETE": {
          const { filterKey, filterValue } = await request.json();
          const file = await bucket.get('data.json');
          const data = file ? JSON.parse(await file.text()) : [];
          
          if (!filterKey || filterValue === undefined) {
            return createResponse({ error: 'Missing filter parameters' }, 400);
          }
          
          const updatedData = data.filter(item => item[filterKey] !== filterValue);
          await bucket.put('data.json', JSON.stringify(updatedData));
          
          return createResponse({ success: true });
        }

        default:
          return createResponse({ error: 'Method not allowed' }, 405);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return createResponse({ error: error.message }, 500);
    }
  }
};