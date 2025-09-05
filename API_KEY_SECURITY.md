# API Key Security and Redaction Guide

This guide explains how to handle API keys securely in the Striae application to prevent them from appearing in browser console logs or developer tools.

## Problem

API keys could be visible in:
- Browser developer tools (Network tab)
- Console logs if accidentally logged
- Error messages and stack traces
- JSON.stringify() output

## Solution

The application now includes several utilities to redact sensitive information:

### 1. Secure API Key Wrapper (`auth.ts`)

```typescript
import { 
  getUserApiKey, 
  getSecureUserApiKey, 
  redactSensitiveData 
} from '~/utils/auth';

// Regular usage (actual key for API calls)
const apiKey = await getUserApiKey();
fetch(url, {
  headers: {
    'X-Custom-Auth-Key': apiKey  // This works normally
  }
});

// Secure usage for logging/debugging
const secureApiKey = await getSecureUserApiKey();
console.log('Using API key:', secureApiKey); 
// Outputs: Using API key: [SecureApiKey:USER_DB_AUTH:abcd****wxyz]

// Redact any string manually
const redacted = redactSensitiveData('very-secret-api-key-12345');
console.log(redacted); // Outputs: very****2345
```

### 2. Secure Logging Utilities (`secure-logging.ts`)

```typescript
import { secureConsole, devLog, redactFetchRequest } from '~/utils/secure-logging';

// Safe console logging (automatically redacts sensitive patterns)
const requestData = {
  api_key: 'secret-key-123456789',
  username: 'john@example.com',
  token: 'bearer-token-abcdefg'
};

secureConsole.log('Request data:', requestData);
// Outputs: Request data: { api_key: 'secr****789', username: 'john@example.com', token: 'bear****efg' }

// Development-only logging
devLog.log('Debug info:', requestData); // Only logs in development mode

// Safe fetch request logging
const fetchInfo = redactFetchRequest('https://api.example.com/data', {
  headers: {
    'X-Custom-Auth-Key': 'secret123456789',
    'Content-Type': 'application/json'
  }
});
secureConsole.log('Making request:', fetchInfo);
// Headers will be redacted automatically
```

## Best Practices

### DO ✅
- Use `secureConsole.*` instead of `console.*` for any logging that might include request data
- Use the secure API key wrapper functions when debugging
- Use `devLog.*` for development-only debugging information
- Test in browser dev tools to ensure keys are redacted

### DON'T ❌
- Don't use regular `console.log` with objects that might contain API keys
- Don't stringify objects containing API keys without redaction
- Don't log raw API key values
- Don't disable redaction in production

## Migration Example

### Before (Unsafe)
```typescript
const apiKey = await getUserApiKey();
console.log('Got API key:', apiKey); // ❌ Exposes full key

const response = await fetch(url, {
  headers: { 'X-Custom-Auth-Key': apiKey }
});
console.log('Request headers:', response.request.headers); // ❌ May expose key
```

### After (Safe)
```typescript
import { secureConsole } from '~/utils/secure-logging';

const apiKey = await getUserApiKey();
const secureKey = await getSecureUserApiKey();
secureConsole.log('Got API key:', secureKey); // ✅ Shows redacted version

const response = await fetch(url, {
  headers: { 'X-Custom-Auth-Key': apiKey }
});

// Safe request logging
const redactedRequest = redactFetchRequest(url, {
  headers: { 'X-Custom-Auth-Key': apiKey }
});
secureConsole.log('Making request:', redactedRequest); // ✅ Headers redacted
```

## Network Tab Protection

While these utilities protect console logging, API keys will still be visible in the browser's Network tab. To minimize this risk:

1. **Use HTTPS everywhere** (already implemented)
2. **Minimize key exposure time** - fetch keys only when needed
3. **Use short-lived tokens** when possible
4. **Monitor for unusual network activity**

## Environment Detection

The utilities automatically detect development vs production:
- `secureConsole.*` - Always safe, works in all environments
- `devLog.*` - Only logs in development mode
- Regular `console.*` - Should be avoided for sensitive data

## Testing

To verify the redaction is working:
1. Open browser developer tools
2. Use the secure logging functions
3. Check that sensitive values show as `****` in console
4. Verify Network tab still shows actual requests (this is expected)
