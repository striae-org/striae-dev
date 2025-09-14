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

/**
 * Check if a phone number is safe for SMS sending using SMS Defense
 * @param phoneNumber - The phone number to check
 * @param accountId - The user's account ID
 * @param action - The action being performed
 * @param riskThreshold - Custom risk threshold (optional)
 * @returns Promise<SMSDefenseResult>
 */
export interface SMSDefenseResult {
  allowed: boolean;
  riskScore: number;
  threshold: number;
  assessmentId: string;
  phoneNumber: string;
  action: string;
  timestamp: string;
}

export const checkSMSFraud = async (
  phoneNumber: string,
  accountId: string,
  action: string = 'sms_verification',
  riskThreshold?: number
): Promise<SMSDefenseResult> => {
  try {
    // Generate reCAPTCHA token for SMS Defense
    const token = await generateSMSDefenseToken(action);
    
    // Call SMS Defense worker
    const response = await fetch(`${config.sms_defense_worker_url}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': config.keys_auth,
      },
      body: JSON.stringify({
        token,
        phoneNumber,
        accountId,
        action,
        riskThreshold
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(`SMS Defense check failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('SMS fraud check error:', error);
    throw error;
  }
};

/**
 * Annotate an SMS Defense assessment to improve detection accuracy
 * @param assessmentId - The assessment ID from the fraud check
 * @param phoneNumber - The phone number
 * @param reason - The reason for annotation
 * @param annotation - Whether the interaction was legitimate or fraudulent
 * @returns Promise<boolean>
 */
export const annotateSMSAssessment = async (
  assessmentId: string,
  phoneNumber: string,
  reason: 'INITIATED_TWO_FACTOR' | 'PASSED_TWO_FACTOR' | 'FAILED_TWO_FACTOR',
  annotation?: 'LEGITIMATE' | 'FRAUDULENT'
): Promise<boolean> => {
  try {
    const response = await fetch(`${config.sms_defense_worker_url}/annotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': config.keys_auth,
      },
      body: JSON.stringify({
        assessmentId,
        phoneNumber,
        reason,
        annotation
      })
    });

    if (!response.ok) {
      console.warn('Failed to annotate SMS assessment:', response.status);
      return false;
    }

    const result = await response.json() as { success?: boolean };
    return result.success || false;
  } catch (error) {
    console.warn('SMS assessment annotation error:', error);
    return false;
  }
};