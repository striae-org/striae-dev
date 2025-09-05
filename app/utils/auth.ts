import paths from '~/config/config.json';
import { secureConsole } from './secure-logging';

const KEYS_URL = paths.keys_url;
const KEYS_AUTH = paths.keys_auth;

type KeyType = 'USER_DB_AUTH' | 'R2_KEY_SECRET' | 'IMAGES_API_TOKEN' | 'ACCOUNT_HASH';

// Utility to redact sensitive values for logging
function redactKey(key: string): string {
  if (!key || key.length < 8) return '[REDACTED]';
  return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
}

// Wrapper class to prevent accidental logging of API keys
class SecureApiKey {
  private readonly _value: string;
  private readonly _type: KeyType;

  constructor(value: string, type: KeyType) {
    this._value = value;
    this._type = type;
  }

  // Get the actual key value (use with caution)
  getValue(): string {
    return this._value;
  }

  // Safe string representation for logging
  toString(): string {
    return `[SecureApiKey:${this._type}:${redactKey(this._value)}]`;
  }

  // Prevent JSON serialization of the actual key
  toJSON(): string {
    return this.toString();
  }

  // For console.log and other string coercion
  valueOf(): string {
    return this.toString();
  }
}

async function getApiKey(keyType: KeyType): Promise<string> {
  const keyResponse = await fetch(`${KEYS_URL}/${keyType}`, {
    headers: {
      'X-Custom-Auth-Key': KEYS_AUTH
    }
  });
  if (!keyResponse.ok) {
    throw new Error(`Failed to retrieve ${keyType}`);
  }
  return keyResponse.text();
}

// Secure versions that return wrapped keys for safer handling
async function getSecureApiKey(keyType: KeyType): Promise<SecureApiKey> {
  const key = await getApiKey(keyType);
  return new SecureApiKey(key, keyType);
}

export async function getUserApiKey(): Promise<string> {
  return getApiKey('USER_DB_AUTH');
}

export async function getDataApiKey(): Promise<string> {
  return getApiKey('R2_KEY_SECRET');
}

export async function getImageApiKey(): Promise<string> {
  return getApiKey('IMAGES_API_TOKEN');
}

export async function getAccountHash(): Promise<string> {
  return getApiKey('ACCOUNT_HASH');
}

// Secure versions for debugging/logging contexts
export async function getSecureUserApiKey(): Promise<SecureApiKey> {
  return getSecureApiKey('USER_DB_AUTH');
}

export async function getSecureDataApiKey(): Promise<SecureApiKey> {
  return getSecureApiKey('R2_KEY_SECRET');
}

export async function getSecureImageApiKey(): Promise<SecureApiKey> {
  return getSecureApiKey('IMAGES_API_TOKEN');
}

export async function getSecureAccountHash(): Promise<SecureApiKey> {
  return getSecureApiKey('ACCOUNT_HASH');
}

// Utility function to redact any string (useful for general logging)
export function redactSensitiveData(data: string): string {
  return redactKey(data);
}

export async function verifyAuthPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch(`${KEYS_URL}/verify-auth-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': KEYS_AUTH
      },
      body: JSON.stringify({ password })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json() as { valid: boolean };
    return result.valid;
  } catch (error) {
    secureConsole.error('Error verifying auth password:', error);
    return false;
  }
}