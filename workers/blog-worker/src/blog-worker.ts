/**
 * Blog Worker - Reliable RSS feed fetching and caching for Striae
 * Fetches blog.striae.org RSS feed, caches results, and serves as JSON API
 */

interface Env {
  BLOG_CACHE: KVNamespace;
  RSS_URL: string;
  CACHE_TTL: string;
  ALLOWED_ORIGIN: string;
}

interface BlogPost {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface RSSResponse {
  posts: BlogPost[];
  cached: boolean;
  timestamp: string;
}

/**
 * Parse RSS XML and extract blog posts
 */
function parseRSSFeed(xmlText: string): BlogPost[] {
  try {
    // Use HTMLRewriter-compatible parsing approach for Cloudflare Workers
    const posts: BlogPost[] = [];
    
    // Extract items using regex patterns (more reliable in CF Workers than DOMParser)
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 3)) { // Take first 3 posts
      const title = extractXMLContent(itemXml, 'title');
      const link = extractXMLContent(itemXml, 'link');
      const description = extractXMLContent(itemXml, 'description');
      const pubDate = extractXMLContent(itemXml, 'pubDate');
      
      if (title && link) {
        posts.push({
          title: cleanText(title),
          link: cleanText(link),
          description: truncateDescription(cleanText(description)),
          pubDate: formatDate(pubDate)
        });
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
}

/**
 * Extract content from XML tag using regex
 */
function extractXMLContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Clean and sanitize text content
 */
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Remove CDATA
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Truncate description to 150 characters at word boundary
 */
function truncateDescription(text: string): string {
  if (!text || text.length <= 150) {
    return text;
  }
  
  let truncated = text.substring(0, 150);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 100) {
    truncated = truncated.substring(0, lastSpace);
  }
  
  return truncated + '…';
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request, origin: string): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  return null;
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN || 'https://www.striae.org';
    
    // Handle CORS preflight
    const corsResponse = handleCORS(request, origin);
    if (corsResponse) return corsResponse;
    
    // Only allow GET requests to /api/feed
    if (request.method !== 'GET' || url.pathname !== '/api/feed') {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'text/plain'
        }
      });
    }
    
    const CACHE_KEY = 'blog-feed-cache';
    const CACHE_TTL = parseInt(env.CACHE_TTL || '3600'); // 1 hour default
    
    try {
      // Try to get cached feed first
      const cachedData = await env.BLOG_CACHE.get(CACHE_KEY);
      if (cachedData) {
        console.log('Serving cached blog feed');
        return new Response(cachedData, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Cache-Control': `public, max-age=${CACHE_TTL}`,
            'X-Cache': 'HIT'
          }
        });
      }
      
      // Fetch fresh RSS feed
      console.log('Fetching fresh RSS feed from:', env.RSS_URL);
      const rssResponse = await fetch(env.RSS_URL, {
        headers: {
          'User-Agent': 'Striae-Blog-Worker/1.0'
        }
      });
      
      if (!rssResponse.ok) {
        throw new Error(`RSS fetch failed: ${rssResponse.status} ${rssResponse.statusText}`);
      }
      
      const rssText = await rssResponse.text();
      console.log('RSS feed fetched, length:', rssText.length);
      
      // Parse RSS and convert to JSON
      const posts = parseRSSFeed(rssText);
      
      if (posts.length === 0) {
        throw new Error('No posts extracted from RSS feed');
      }
      
      const responseData: RSSResponse = {
        posts,
        cached: false,
        timestamp: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(responseData);
      
      // Cache the result
      await env.BLOG_CACHE.put(CACHE_KEY, jsonData, { expirationTtl: CACHE_TTL });
      console.log('Blog feed cached for', CACHE_TTL, 'seconds');
      
      return new Response(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache': 'MISS'
        }
      });
      
    } catch (error) {
      console.error('Error in blog worker:', error);
      
      // Return error response with fallback
      const errorResponse = {
        error: 'Failed to fetch blog feed',
        message: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'https://blog.striae.org',
        timestamp: new Date().toISOString()
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin
        }
      });
    }
  }
};