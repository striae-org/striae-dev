# Blog Worker - Reliable RSS Feed Service

A Cloudflare Worker that provides reliable RSS feed fetching and caching for the Striae blog feed component.

## Features

- ✅ **Reliable RSS Fetching**: Direct server-side RSS feed retrieval (no CORS issues)
- ⚡ **Smart Caching**: 1-hour cache using Cloudflare KV for faster responses
- 🛡️ **Error Handling**: Graceful fallbacks and detailed error responses
- 🔧 **CORS Support**: Proper CORS headers for frontend integration
- 📊 **Structured Data**: Clean JSON API response format

## Setup Instructions

### 1. Create KV Namespace
```bash
cd workers/blog-worker
npx wrangler kv:namespace create "BLOG_CACHE"
```

### 2. Update Configuration
Edit `wrangler.jsonc` and replace `your_kv_namespace_id` with the ID from step 1:
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "BLOG_CACHE",
      "id": "YOUR_ACTUAL_KV_NAMESPACE_ID_HERE",
      "preview_id": "YOUR_PREVIEW_KV_NAMESPACE_ID_HERE"
    }
  ]
}
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Deploy Worker
```bash
npm run deploy
```

### 5. Update Frontend Config
Add your worker URL to `app/config/config.json`:
```json
{
  "blog_worker_url": "https://blog.dev.striae.org"
}
```

## API Endpoint

### GET /api/feed

Returns the latest 3 blog posts from blog.striae.org

**Response Format:**
```json
{
  "posts": [
    {
      "title": "Blog Post Title",
      "link": "https://blog.striae.org/post-url",
      "description": "Truncated description (150 chars max)...",
      "pubDate": "September 23, 2025"
    }
  ],
  "cached": false,
  "timestamp": "2025-09-23T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch blog feed",
  "message": "Detailed error message",
  "fallback": "https://blog.striae.org",
  "timestamp": "2025-09-23T12:00:00.000Z"
}
```

## Environment Variables

- `RSS_URL`: RSS feed URL (default: https://blog.striae.org/rss.xml)
- `CACHE_TTL`: Cache duration in seconds (default: 3600 = 1 hour)
- `ALLOWED_ORIGIN`: CORS origin (default: https://www.striae.org)

## Cache Behavior

- **Cache Key**: `blog-feed-cache`
- **TTL**: 1 hour (configurable)
- **Cache Headers**: Includes `X-Cache: HIT/MISS` for debugging
- **Automatic Refresh**: Fetches fresh data when cache expires

## Error Handling

The worker includes comprehensive error handling:

1. **RSS Fetch Failures**: Network timeouts, 404s, malformed responses
2. **Parsing Errors**: Invalid XML, missing required fields
3. **Cache Failures**: KV unavailability (graceful degradation)
4. **CORS Issues**: Proper preflight handling

## Development

```bash
# Local development
npm run dev

# Type checking
npx tsc --noEmit

# Deploy to Cloudflare
npm run deploy
```

## Architecture

```
Frontend (blog-feed.tsx)
    ↓ fetch('/api/feed')
Blog Worker (Cloudflare)
    ↓ check KV cache
    ↓ fetch RSS (if cache miss)
    ↓ parse & format
    ↓ store in cache
    ↑ return JSON
```

This architecture eliminates external dependencies and provides maximum reliability for the Striae blog feed.