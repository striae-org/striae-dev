import config from '~/config/config.json';

/**
 * reCAPTCHA Enterprise SMS Defense utility
 * Used to generate tokens for SMS fraud detection
 */

// Global interface for reCAPTCHA Enterprise
declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

/**
 * Initialize reCAPTCHA Enterprise and generate a token for SMS Defense
 * @param action - The action being performed (e.g., 'login', 'register', 'mfa')
 * @returns Promise<string> - The reCAPTCHA token
 */
export const generateRecaptchaToken = async (action: string = 'auth'): Promise<string> => {
  if (!config.recaptcha.enabled) {
    throw new Error('reCAPTCHA is not enabled');
  }

  if (!config.recaptcha.site_key || config.recaptcha.site_key === 'YOUR_RECAPTCHA_SITE_KEY_HERE') {
    throw new Error('reCAPTCHA site key not configured');
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('reCAPTCHA can only be used in browser environment'));
      return;
    }

    if (!window.grecaptcha?.enterprise) {
      reject(new Error('reCAPTCHA Enterprise not loaded'));
      return;
    }

    window.grecaptcha.enterprise.ready(() => {
      window.grecaptcha.enterprise
        .execute(config.recaptcha.site_key, { action })
        .then(resolve)
        .catch(reject);
    });
  });
};

/**
 * Generate token specifically for SMS-related actions
 * @param phoneNumber - The phone number for context (optional)
 * @returns Promise<string> - The reCAPTCHA token
 */
export const generateSMSDefenseToken = async (phoneNumber?: string): Promise<string> => {
  const action = phoneNumber ? 'sms_verification' : 'sms_auth';
  return generateRecaptchaToken(action);
};

/**
 * Generate token for MFA enrollment
 * @returns Promise<string> - The reCAPTCHA token
 */
export const generateMFAToken = async (): Promise<string> => {
  return generateRecaptchaToken('mfa_enrollment');
};

/**
 * Generate token for login with MFA
 * @returns Promise<string> - The reCAPTCHA token
 */
export const generateLoginMFAToken = async (): Promise<string> => {
  return generateRecaptchaToken('login_mfa');
};

/**
 * Generate token for password reset
 * @returns Promise<string> - The reCAPTCHA token
 */
export const generatePasswordResetToken = async (): Promise<string> => {
  return generateRecaptchaToken('password_reset');
};

/**
 * Check if reCAPTCHA is ready and available
 * @returns boolean
 */
export const isRecaptchaReady = (): boolean => {
  return typeof window !== 'undefined' && 
         !!window.grecaptcha?.enterprise && 
         config.recaptcha.enabled;
};

/**
 * Wait for reCAPTCHA to be ready
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise<boolean>
 */
export const waitForRecaptcha = (timeout: number = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isRecaptchaReady()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkReady = () => {
      if (isRecaptchaReady()) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      setTimeout(checkReady, 100);
    };

    checkReady();
  });
};