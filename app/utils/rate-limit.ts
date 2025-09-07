import { createSessionStorage } from '~/services/session';

// Rate limiting constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

interface RateLimitData {
  attempts: number;
  lockoutUntil?: number;
}

export async function checkRateLimit(request: Request, sessionSecret: string): Promise<{
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEndTime?: number;
}> {
  const sessionStorage = createSessionStorage(sessionSecret);
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  
  const rateLimitData: RateLimitData = session.get('authRateLimit') || { attempts: 0 };
  const now = Date.now();
  
  // Check if lockout has expired
  if (rateLimitData.lockoutUntil && now >= rateLimitData.lockoutUntil) {
    // Reset rate limit data
    session.unset('authRateLimit');
    return {
      isLocked: false,
      attemptsRemaining: MAX_ATTEMPTS,
    };
  }
  
  // Check if currently locked out
  if (rateLimitData.lockoutUntil && now < rateLimitData.lockoutUntil) {
    return {
      isLocked: true,
      attemptsRemaining: 0,
      lockoutEndTime: rateLimitData.lockoutUntil,
    };
  }
  
  return {
    isLocked: false,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - rateLimitData.attempts),
  };
}

export async function recordFailedAttempt(request: Request, sessionSecret: string): Promise<{
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEndTime?: number;
  headers: HeadersInit;
}> {
  const sessionStorage = createSessionStorage(sessionSecret);
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  
  const rateLimitData: RateLimitData = session.get('authRateLimit') || { attempts: 0 };
  const newAttempts = rateLimitData.attempts + 1;
  
  if (newAttempts >= MAX_ATTEMPTS) {
    // Initiate lockout
    const lockoutUntil = Date.now() + LOCKOUT_TIME;
    session.set('authRateLimit', {
      attempts: newAttempts,
      lockoutUntil,
    });
    
    return {
      isLocked: true,
      attemptsRemaining: 0,
      lockoutEndTime: lockoutUntil,
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    };
  } else {
    // Record failed attempt
    session.set('authRateLimit', {
      attempts: newAttempts,
    });
    
    return {
      isLocked: false,
      attemptsRemaining: MAX_ATTEMPTS - newAttempts,
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    };
  }
}

export async function clearRateLimit(request: Request, sessionSecret: string): Promise<HeadersInit> {
  const sessionStorage = createSessionStorage(sessionSecret);
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  
  session.unset('authRateLimit');
  
  return {
    'Set-Cookie': await sessionStorage.commitSession(session),
  };
}
