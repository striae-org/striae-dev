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
  const userData = await env.USER_DB.get(userUid);
  if (!userData) {
    return new Response('User not found', { 
      status: 404, 
      headers: corsHeaders 
    });
  }
  return new Response(userData, { 
    status: 200, 
    headers: corsHeaders 
  });
}

async function handleAddUser(request, env, userUid) {
  const { email, firstName, lastName, permitted = false } = await request.json();
  
  // Check for existing user
  const existingData = await env.USER_DB.get(userUid);
  
  let userData;
  if (existingData) {
    // Update existing user
    const existing = JSON.parse(existingData);
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
      createdAt: new Date().toISOString()
    };
  }

  await env.USER_DB.put(userUid, JSON.stringify(userData));
  return new Response(JSON.stringify(userData), {
    status: existingData ? 200 : 201,
    headers: corsHeaders
  });
}

async function handleDeleteUser(env, userUid) {
  await env.USER_DB.delete(userUid);
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
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