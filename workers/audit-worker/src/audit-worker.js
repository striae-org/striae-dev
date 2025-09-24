const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dev.striae.org',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  return `audit-trails/${userId}/${date}.json`;
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

      // This worker only handles audit trail endpoints
      if (!pathname.startsWith('/audit/')) {
        return createResponse({ error: 'This worker only handles audit endpoints. Use /audit/ path.' }, 404);
      }

      const userId = url.searchParams.get('userId');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      
      if (request.method === 'POST') {
        // Add audit entry
        if (!userId) {
          return createResponse({ error: 'userId parameter is required' }, 400);
        }
        
        const auditEntry = await request.json();
        
        // Validate audit entry structure
        if (!auditEntry.timestamp || !auditEntry.userId || !auditEntry.action) {
          return createResponse({ error: 'Invalid audit entry structure. Required fields: timestamp, userId, action' }, 400);
        }
        
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
              const filename = `audit-trails/${userId}/${dateStr}.json`;
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
      
      return createResponse({ error: 'Method not allowed for audit endpoints. Only GET and POST are supported.' }, 405);

    } catch (error) {
      console.error('Audit Worker error:', error);
      return createResponse({ error: error.message }, 500);
    }
  }
};