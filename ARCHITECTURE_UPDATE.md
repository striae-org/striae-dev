# Authentication Architecture Update

This document describes the updated authentication architecture using Cloudflare Service Bindings.

## Overview

The authentication system has been reworked to eliminate the need for the frontend to fetch API keys and pass them to workers. Instead, workers now use Cloudflare Service Bindings to call the keys worker directly for authentication.

## Architecture Changes

### Before (Legacy)
1. Frontend fetches API keys from keys worker using `auth.ts` utilities
2. Frontend passes API keys as `X-Custom-Auth-Key` headers to other workers
3. Workers validate the received keys against environment variables

### After (Service Bindings)
1. Frontend passes user authentication tokens as `X-User-Auth` headers
2. Workers use service bindings to call keys worker for validation
3. Keys worker provides both HTTP (legacy) and RPC interfaces
4. API keys are never exposed to the frontend

## Updated Components

### Keys Worker (`striae-keys`)
- **File**: `workers/keys-worker/src/keys.js`
- **Changes**: 
  - Now extends `WorkerEntrypoint` class for RPC support
  - Added `getKey(keyName)` and `verifyAuthPassword(password)` RPC methods
  - Maintains HTTP interface for backward compatibility

### Data Worker (`striae-data`)
- **File**: `workers/data-worker/src/data-worker.js`
- **Changes**:
  - Added service binding to keys worker
  - Updated authentication to use `hasValidAuth()` function
  - Changed header from `X-Custom-Auth-Key` to `X-User-Auth`
  - Calls `env.KEYS_WORKER.getKey('R2_KEY_SECRET')` for validation

### User Worker (`striae-users`)
- **File**: `workers/user-worker/src/user-worker.js`
- **Changes**:
  - Added service binding to keys worker
  - Updated `authenticate()` function to use keys worker
  - Changed header from `X-Custom-Auth-Key` to `X-User-Auth`
  - Calls `env.KEYS_WORKER.getKey('USER_DB_AUTH')` for validation

### Image Worker (`striae-images`)
- **File**: `workers/image-worker/src/image-worker.js`
- **Changes**:
  - Added service binding to keys worker
  - Updated `hasValidToken()` to be async and use keys worker
  - Changed header from `X-Custom-Auth-Key` to `X-User-Auth`
  - Retrieves `IMAGES_API_TOKEN` and `ACCOUNT_HASH` from keys worker

### Frontend Components
- **Files**: Various components in `app/components/actions/` and `app/routes/`
- **Changes**:
  - Updated header names from `X-Custom-Auth-Key` to `X-User-Auth`
  - `auth.ts` utilities maintained for legacy compatibility
  - Workers handle key retrieval internally

## Configuration Updates

All worker `wrangler.jsonc` files now include service bindings:

```jsonc
{
  "services": [
    {
      "binding": "KEYS_WORKER",
      "service": "striae-keys"
    }
  ]
}
```

## Deployment Order

Due to service binding dependencies, deploy in this order:

1. **Deploy Keys Worker first**: `striae-keys` must be deployed before others
2. **Deploy other workers**: `striae-data`, `striae-users`, `striae-images`
3. **Deploy main application**: Frontend changes

## Benefits

1. **Security**: API keys never leave the Cloudflare edge
2. **Performance**: Zero-latency service bindings vs HTTP calls
3. **Reliability**: Centralized key management
4. **Scalability**: No subrequest overhead for key fetching
5. **Maintenance**: Single source of truth for keys

## Migration Notes

- Legacy HTTP endpoints in keys worker remain functional
- Frontend header changes are backward compatible
- All workers maintain existing functionality
- No database migrations required

## Local Development

For local development with service bindings:

1. Start keys worker: `cd workers/keys-worker && wrangler dev`
2. Start other workers in separate terminals
3. Wrangler will show binding status as "connected" or "not connected"

Alternatively, use the experimental multi-worker command:
```bash
wrangler dev -c workers/keys-worker/wrangler.jsonc -c workers/data-worker/wrangler.jsonc
```

## Security Considerations

- Service bindings operate within Cloudflare's secure network
- No external HTTP calls for authentication
- Keys remain in environment variables of keys worker only
- Frontend authentication flows unchanged for users

## Troubleshooting

### Common Issues

1. **"Service not found" errors**: Ensure keys worker is deployed first
2. **"Binding not connected"**: Check service binding configuration in wrangler.jsonc
3. **Authentication failures**: Verify header names are updated to `X-User-Auth`

### Debugging

- Check Cloudflare dashboard for worker logs
- Verify service binding configuration in wrangler.jsonc files
- Ensure keys worker RPC methods are functioning

## API Reference

### Keys Worker RPC Methods

```javascript
// Get an API key by name
await env.KEYS_WORKER.getKey(keyName)

// Verify authentication password
await env.KEYS_WORKER.verifyAuthPassword(password)
```

### Header Changes

| Old Header | New Header | Used By |
|------------|------------|---------|
| `X-Custom-Auth-Key` | `X-User-Auth` | Data Worker |
| `X-Custom-Auth-Key` | `X-User-Auth` | User Worker |
| `X-Custom-Auth-Key` | `X-User-Auth` | Image Worker (notes) |
| `Authorization: Bearer {token}` | `Authorization: Bearer {token}` | Image Worker (uploads) |

The keys worker HTTP interface still uses `X-Custom-Auth-Key` for legacy compatibility.
