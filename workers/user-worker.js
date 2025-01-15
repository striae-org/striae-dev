const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://striae.allyforensics.com',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};

async function authenticate(request, env) {
  const authKey = request.headers.get('X-Custom-Auth-Key');
  if (authKey !== env.USER_DB_AUTH) throw new Error('Unauthorized');
}

async function handleGetUser(env, userUid) {
  try {
    const value = await env.USER_DB.get(userUid);
    if (value === null) {
      return new Response('User not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }
    return new Response(value, { 
      status: 200, 
      headers: corsHeaders 
    });
  } catch (error) {
    return new Response('Failed to get user data', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function handleAddUser(request, env, userUid) {
  try {
    const { email, firstName, lastName, permitted = false } = await request.json();
    
    // Check for existing user
    const value = await env.USER_DB.get(userUid);
    
    let userData;
    if (value !== null) {
      // Update existing user
      const existing = JSON.parse(value);
      userData = {
        ...existing,
        email: email || existing.email,
        firstName: firstName || existing.firstName,
        lastName: lastName || existing.lastName,
        permitted: permitted !== undefined ? permitted : existing.permitted,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new user
      userData = {
        uid: userUid,
        email,
        firstName,
        lastName,
        permitted,
        cases: [],
        createdAt: new Date().toISOString()
      };
    }

    // Store value in KV
    await env.USER_DB.put(userUid, JSON.stringify(userData));

    return new Response(JSON.stringify(userData), {
      status: value !== null ? 200 : 201,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response('Failed to save user data', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function handleDeleteUser(env, userUid) {
  try {
    
    await env.USER_DB.delete(userUid);
    
    return new Response('Successful delete', {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response('Failed to delete user', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      await authenticate(request, env);
      
      const url = new URL(request.url);
      const userUid = url.pathname.split('/')[1];
      
      if (!userUid) {
        return new Response('Not Found', { status: 404 });
      }

      switch (request.method) {
        case 'GET': return handleGetUser(env, userUid);
        case 'PUT': return handleAddUser(request, env, userUid);
        case 'DELETE': return handleDeleteUser(env, userUid);
        default: return new Response('Method not allowed', { 
          status: 405, 
          headers: corsHeaders 
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: corsHeaders
      });
    }
  }
};