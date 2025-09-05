/**
 * Secure logging utilities to prevent API keys and sensitive data from appearing in browser console
 */

// List of patterns that should be redacted
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /auth/i,
  /bearer\s+/i,
  /x-custom-auth-key/i,
];

// Redact sensitive values in objects
function redactSensitiveValues(obj: unknown, maxDepth: number = 3): unknown {
  if (maxDepth <= 0) return '[MAX_DEPTH_REACHED]';
  
  if (typeof obj === 'string') {
    // Check if this looks like a sensitive value (long alphanumeric string)
    if (obj.length > 20 && /^[a-zA-Z0-9+/=_-]+$/.test(obj)) {
      return redactString(obj);
    }
    return obj;
  }
  
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveValues(item, maxDepth - 1));
  }
  
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitiveKey && typeof value === 'string') {
      redacted[key] = redactString(value);
    } else {
      redacted[key] = redactSensitiveValues(value, maxDepth - 1);
    }
  }
  
  return redacted;
}

function redactString(str: string): string {
  if (!str || str.length < 8) return '[REDACTED]';
  return `${str.substring(0, 4)}****${str.substring(str.length - 4)}`;
}

// Safe console logging functions
export const secureConsole = {
  log: (...args: unknown[]) => {
    const redactedArgs = args.map(arg => redactSensitiveValues(arg));
    console.log(...redactedArgs);
  },
  
  error: (...args: unknown[]) => {
    const redactedArgs = args.map(arg => redactSensitiveValues(arg));
    console.error(...redactedArgs);
  },
  
  warn: (...args: unknown[]) => {
    const redactedArgs = args.map(arg => redactSensitiveValues(arg));
    console.warn(...redactedArgs);
  },
  
  info: (...args: unknown[]) => {
    const redactedArgs = args.map(arg => redactSensitiveValues(arg));
    console.info(...redactedArgs);
  },
  
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      const redactedArgs = args.map(arg => redactSensitiveValues(arg));
      console.debug(...redactedArgs);
    }
  }
};

// Utility to redact fetch requests for logging
export function redactFetchRequest(url: string, options?: RequestInit) {
  const redactedOptions = { ...options };
  
  if (redactedOptions.headers) {
    const headers = new Headers(redactedOptions.headers);
    const redactedHeaders: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      redactedHeaders[key] = isSensitive ? redactString(value) : value;
    });
    
    redactedOptions.headers = redactedHeaders;
  }
  
  if (redactedOptions.body && typeof redactedOptions.body === 'string') {
    try {
      const parsed = JSON.parse(redactedOptions.body);
      redactedOptions.body = JSON.stringify(redactSensitiveValues(parsed));
    } catch {
      // If it's not JSON, just keep as is
    }
  }
  
  return {
    url,
    options: redactedOptions
  };
}

// Environment-aware logging (only logs in development)
export const devLog = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      secureConsole.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      secureConsole.error(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    secureConsole.warn(...args);
  }
};

export { redactString };
