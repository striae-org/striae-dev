# Striae Security Guide

## Overview

This guide covers security practices, authentication flows, and security considerations for developers working on the Striae project.

## Authentication Architecture

### Firebase Authentication

Striae uses Firebase Authentication as the primary authentication system:

```typescript
// app/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '~/config/firebase';

export const app = initializeApp(firebaseConfig, "Striae");
export const auth = getAuth(app);
```

#### Implemented Features
- **Email/Password Authentication**: Standard email and password login
- **Email Verification**: Required before account activation
- **Multi-Factor Authentication (MFA)**: SMS-based second factor
- **Password Reset**: Secure password reset flow
- **Session Management**: Firebase token-based sessions

### Password Security Requirements

Strong password validation is enforced during registration:

```typescript
// From app/routes/auth/login.tsx
const checkPasswordStrength = (password: string): boolean => {
  const hasMinLength = password.length >= 10;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;
};
```

**Requirements:**
- Minimum 10 characters
- At least one uppercase letter
- At least one number
- At least one special character

### Multi-Factor Authentication (MFA)

MFA implementation using Firebase Auth:

```typescript
// app/utils/mfa.ts
export const userHasMFA = (user: User): boolean => {
  return multiFactor(user).enrolledFactors.length > 0;
};
```

#### MFA Flow
1. User completes email/password authentication
2. If MFA not enrolled, prompt for phone number enrollment
3. SMS verification code sent via Firebase
4. Future logins require both password and SMS code

## Access Control

### Initial Access Gate

Application requires an initial access password before revealing the login interface:

```typescript
// app/components/auth/auth-password.tsx
// Verifies against AUTH_PASSWORD environment variable
export async function verifyAuthPassword(password: string): Promise<boolean> {
  const response = await fetch(`${KEYS_URL}/verify-auth-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Auth-Key': KEYS_AUTH
    },
    body: JSON.stringify({ password })
  });
  
  const result = await response.json();
  return result.valid;
}
```

## API Security

### Worker Authentication

All Cloudflare Workers use custom authentication headers:

```javascript
// Example from workers/user-worker/src/user-worker.js
async function authenticate(request, env) {
  const authKey = request.headers.get('X-Custom-Auth-Key');
  if (authKey !== env.USER_DB_AUTH) throw new Error('Unauthorized');
}
```

### CORS Configuration

Strict CORS policies implemented across all workers:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.striae.org',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};
```

### API Key Management

API keys are managed through the Keys Worker:

```typescript
// app/utils/auth.ts
async function getApiKey(keyType: KeyType): Promise<string> {
  const response = await fetch(`${KEYS_URL}/${keyType}`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  return response.text();
}
```

## Data Security

### Signed URLs for Images

Image access is controlled through cryptographically signed URLs:

```javascript
// workers/image-worker/src/image-worker.js
async function generateSignedUrl(url, env) {
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(env.HMAC_KEY);
  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expiry = Math.floor(Date.now() / 1000) + EXPIRATION;
  url.searchParams.set('exp', expiry);

  const stringToSign = url.pathname + '?' + url.searchParams.toString();
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  const sig = bufferToHex(new Uint8Array(mac).buffer);

  url.searchParams.set('sig', sig);
  return url.toString();
}
```

### Environment Variable Security

All sensitive configuration is stored as environment variables:

```typescript
// Environment variables used across workers:
// - USER_DB_AUTH: User worker authentication
// - R2_KEY_SECRET: Data worker authentication  
// - IMAGES_API_TOKEN: Image worker authentication
// - KEYS_AUTH: Keys worker authentication
// - AUTH_PASSWORD: Initial access password
// - HMAC_KEY: Image URL signing key
```

## Error Handling

### Secure Error Responses

Error handling sanitizes sensitive information:

```typescript
// app/services/firebase-errors.ts
export const handleAuthError = (err: unknown): { message: string; data?: AuthErrorData } => {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
        return { message: 'Invalid credentials' };
      case 'auth/user-not-found':
        return { message: 'No account found with this email' };
      // ... other cases
      default:
        console.error('Firebase Auth Error:', errorData);
        return { message: 'Something went wrong. Please contact support.' };
    }
  }
};
```

### HTTP Status Codes

Proper distinction between authentication and authorization errors:

- **401 Unauthorized**: Authentication failures (invalid credentials)
- **403 Forbidden**: Authorization failures (insufficient permissions)

## Security Configuration

### Firebase Configuration

```typescript
// app/config-example/firebase.ts
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;  
}
```

### Required Environment Setup

1. **Firebase Project**: Configure authentication settings
2. **MFA Setup**: Enable SMS authentication in Firebase Console
3. **Worker Environment Variables**: Set all required secrets
4. **CORS Configuration**: Ensure domain restrictions are properly set

## Development Security Practices

### Local Development

```javascript
// Commented out in production
// connectAuthEmulator(auth, 'http://127.0.0.1:9099');
```

### Testing Authentication

```typescript
// app/utils/mfa.ts includes comprehensive MFA testing instructions
// Test with real phone numbers for SMS verification
// Use Firebase emulator for local development
```

### Secret Management

1. **Never commit secrets**: Use `.env.example` templates
2. **Environment-specific configs**: Separate dev/prod configurations
3. **Key rotation**: Regularly update API keys and secrets
4. **Access logging**: Monitor worker access patterns

## Security Limitations

### Not Currently Implemented

- **Role-Based Permissions**: All authenticated users have same access
- **Rate Limiting**: No request throttling in workers
- **Persistent Audit Logging**: Only console logging available
- **API Versioning**: No versioning strategy for breaking changes
- **Account Lockout**: Relies on Firebase default protections

### Known Considerations

- **SMS Costs**: MFA SMS usage should be monitored
- **User Session Timeout**: Uses Firebase default session handling
- **Inactivity Logout**: Automatically log out users after a period of inactivity
- **Cross-Origin**: CORS restricted to single domain only

## Security Checklist for New Features

### Before Adding New Endpoints

- [ ] Implement proper authentication
- [ ] Add CORS headers
- [ ] Validate input data
- [ ] Use appropriate HTTP status codes
- [ ] Add error handling
- [ ] Test with invalid/malicious inputs

### Before Deploying

- [ ] Review environment variables
- [ ] Test authentication flows
- [ ] Verify CORS restrictions
- [ ] Check error message sanitization
- [ ] Validate permission checks

## Incident Response

### If Security Issue Discovered

1. **Immediate**: Disable affected endpoints if possible
2. **Assessment**: Determine scope and impact
3. **Communication**: Notify stakeholders
4. **Fix**: Implement and test solution
5. **Deploy**: Push fixes to production
6. **Post-mortem**: Document lessons learned

### Monitoring

- **Console Logs**: Monitor worker logs for errors
- **Firebase Console**: Check authentication metrics
- **Cloudflare Analytics**: Monitor traffic patterns
