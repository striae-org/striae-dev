const corsHeaders = {
  'Access-Control-Allow-Origin': 'PAGES_CUSTOM_DOMAIN',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};

const createResponse = (data, status = 200) => new Response(
  JSON.stringify(data), 
  { status, headers: corsHeaders }
);

const hasValidHeader = (request, env) => 
  request.headers.get("X-Custom-Auth-Key") === env.R2_KEY_SECRET;

// Helper function to generate audit file names with user and date
const generateAuditFileName = (userId) => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `audit-trails/${userId}-${date}.json`;
};

// Helper function to append audit entry to existing file
const appendAuditEntry = async (bucket, filename, newEntry) => {
  try {
    const existingFile = await bucket.get(filename);
    let entries = [];
    
    if (existingFile) {
      const existingData = await existingFile.text();
      entries = JSON.parse(existingData);
    }
    
    entries.push(newEntry);
    await bucket.put(filename, JSON.stringify(entries));
    return entries.length;
  } catch (error) {
    console.error('Error appending audit entry:', error);
    throw error;
  }
};

export default {
  async fetch(request, env) {       
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (!hasValidHeader(request, env)) {
      return createResponse({ error: 'Forbidden' }, 403);
    }

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const bucket = env.STRIAE_DATA;

      // Handle audit trail endpoints
      if (pathname.startsWith('/audit/')) {
        const userId = url.searchParams.get('userId');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        if (request.method === 'POST') {
          // Add audit entry
          if (!userId) {
            return createResponse({ error: 'userId parameter is required' }, 400);
          }
          
          const auditEntry = await request.json();
          const filename = generateAuditFileName(userId);
          
          try {
            const entryCount = await appendAuditEntry(bucket, filename, auditEntry);
            return createResponse({ 
              success: true, 
              entryCount,
              filename 
            });
          } catch (error) {
            return createResponse({ error: `Failed to store audit entry: ${error.message}` }, 500);
          }
        }
        
        if (request.method === 'GET') {
          // Retrieve audit entries
          if (!userId) {
            return createResponse({ error: 'userId parameter is required' }, 400);
          }
          
          try {
            let allEntries = [];
            
            if (startDate && endDate) {
              // Get entries for date range
              const start = new Date(startDate);
              const end = new Date(endDate);
              const currentDate = new Date(start);
              
              while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const filename = `audit-trails/${userId}-${dateStr}.json`;
                const file = await bucket.get(filename);
                
                if (file) {
                  const entries = JSON.parse(await file.text());
                  allEntries.push(...entries);
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
              }
            } else {
              // Get today's entries
              const filename = generateAuditFileName(userId);
              const file = await bucket.get(filename);
              
              if (file) {
                allEntries = JSON.parse(await file.text());
              }
            }
            
            // Sort by timestamp (newest first)
            allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return createResponse({
              entries: allEntries,
              total: allEntries.length
            });
          } catch (error) {
            return createResponse({ error: `Failed to retrieve audit entries: ${error.message}` }, 500);
          }
        }
        
        return createResponse({ error: 'Method not allowed for audit endpoints' }, 405);
      }

      // Handle regular file operations
      const filename = pathname.slice(1) || 'data.json';
      
      if (!filename.endsWith('.json')) {
        return createResponse({ error: 'Invalid file type. Only JSON files are allowed.' }, 400);
      }
      
      switch (request.method) {
        case "GET": {
          const file = await bucket.get(filename);
          if (!file) {
            return createResponse([], 200);
          }
          const data = JSON.parse(await file.text());
          return createResponse(data);
        }

        case "PUT": {
          const newData = await request.json();
          await bucket.put(filename, JSON.stringify(newData)); // Replace instead of push
          return createResponse({ success: true });
        }

        case "DELETE": {
          const file = await bucket.get(filename);
          if (!file) {
            return createResponse({ error: 'File not found' }, 404);
          }
          await bucket.delete(filename);
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