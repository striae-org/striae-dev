import { useEffect, useRef, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '~/services/firebase';

interface UseInactivityTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

export const useInactivityTimeout = ({
  timeoutMinutes = 2,
  warningMinutes = 1,
  onWarning,
  onTimeout,
  enabled = true
}: UseInactivityTimeoutOptions = {}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      onTimeout?.();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [onTimeout]);

  const handleWarning = useCallback(() => {
    onWarning?.();
  }, [onWarning]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    clearTimeouts();

    // Set warning timeout
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    if (warningMs > 0) {
      warningTimeoutRef.current = setTimeout(handleWarning, warningMs);
    }

    // Set sign-out timeout
    const timeoutMs = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(handleSignOut, timeoutMs);
  }, [enabled, timeoutMinutes, warningMinutes, handleWarning, handleSignOut, clearTimeouts]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const getRemainingTime = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
    return Math.max(0, Math.floor(remaining / 1000));
  }, [timeoutMinutes]);

  useEffect(() => {
    if (!enabled) {
      clearTimeouts();
      return;
    }

    // Activities that reset the timer
    const activities = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
      clearTimeouts();
    };
  }, [enabled, resetTimer, clearTimeouts]);

  return {
    extendSession,
    getRemainingTime,
    clearTimeouts
  };
};
