# Deployment Guide: Service Bindings Architecture

This guide walks you through deploying the updated authentication architecture.

## Prerequisites

- Wrangler CLI installed and authenticated
- Access to Cloudflare Workers dashboard
- All workers configured with correct account_id

## Deployment Steps

### Step 1: Deploy Keys Worker First

The keys worker must be deployed before all others due to service binding dependencies.

```bash
cd workers/keys-worker
wrangler deploy
```

**Verify deployment:**
- Check Cloudflare dashboard for successful deployment
- Test HTTP interface: `curl -H "X-Custom-Auth-Key: YOUR_KEY" https://origin.striae.org/USER_DB_AUTH`

### Step 2: Deploy Dependent Workers

Deploy in any order after keys worker is live:

```bash
# Data Worker
cd workers/data-worker
wrangler deploy

# User Worker  
cd workers/user-worker
wrangler deploy

# Image Worker
cd workers/image-worker
wrangler deploy
```

### Step 3: Verify Service Bindings

Check the Cloudflare dashboard under each worker:
- Navigate to Workers & Pages
- Select each worker
- Go to Settings → Bindings
- Verify "KEYS_WORKER" service binding shows as "Active"

### Step 4: Deploy Frontend

```bash
# From project root
npm run build
wrangler pages deploy
```

## Testing Deployment

### 1. Test Keys Worker RPC (Internal)
Service bindings are internal, but you can test HTTP interface:

```bash
curl -H "X-Custom-Auth-Key: YOUR_KEYS_AUTH" https://origin.striae.org/R2_KEY_SECRET
```

### 2. Test Data Worker Authentication
```bash
curl -H "X-User-Auth: YOUR_USER_DB_AUTH" https://origin2.striae.org/test.json
```

### 3. Test User Worker Authentication  
```bash
curl -H "X-User-Auth: YOUR_USER_DB_AUTH" https://origin4.striae.org/test-user
```

### 4. Test Image Worker Authentication
```bash
curl -H "Authorization: Bearer YOUR_IMAGES_TOKEN" https://origin3.striae.org/test-image
```

## Rollback Plan

If issues occur, you can rollback by:

1. **Revert frontend changes:** Deploy previous version
2. **Update workers:** Remove service bindings from wrangler.jsonc
3. **Restore old authentication:** Use environment variables directly

## Environment Variables

Ensure these are set in keys worker:
- `R2_KEY_SECRET`
- `USER_DB_AUTH` 
- `IMAGES_API_TOKEN`
- `ACCOUNT_HASH`
- `AUTH_PASSWORD`
- `KEYS_AUTH`

Other workers no longer need these environment variables.

## Monitoring

After deployment, monitor:
- Cloudflare Workers analytics for error rates
- Service binding status in dashboard
- Application functionality end-to-end

## Common Issues

### "Service not found" Error
- **Cause:** Keys worker not deployed or incorrect service name
- **Fix:** Verify keys worker deployment and service name in wrangler.jsonc

### Authentication Failures
- **Cause:** Header name mismatch or missing service binding
- **Fix:** Verify header names and service binding configuration

### Performance Issues
- **Cause:** Service binding not optimized
- **Fix:** Enable Smart Placement in wrangler.jsonc

## Local Development

For local testing with service bindings:

```bash
# Terminal 1: Keys Worker
cd workers/keys-worker
wrangler dev

# Terminal 2: Data Worker  
cd workers/data-worker
wrangler dev

# Repeat for other workers
```

Wrangler will show binding status as "connected" when all workers are running.

## Next Steps

1. Monitor application performance post-deployment
2. Update documentation with new architecture details
3. Consider removing legacy HTTP endpoints after stable period
4. Implement additional security measures as needed

## Support

If you encounter issues:
1. Check Cloudflare Workers logs
2. Verify service binding configuration
3. Test individual worker endpoints
4. Review authentication flow end-to-end
