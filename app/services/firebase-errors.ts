import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, AuthCredential } from 'firebase/auth';

export const ERROR_MESSAGES = {
  // Auth Errors
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PASSWORD: 'Invalid password',
  USER_NOT_FOUND: 'No account found with this email',
  EMAIL_IN_USE: 'An account with this email already exists',
  REGISTRATION_DISABLED: 'New registrations are currently disabled',
  PASSWORDS_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password does not meet strength requirements',
  
  // Reset/Verify Errors
  RESET_EMAIL_SENT: 'Password reset email sent! Check your inbox',
  RESET_EMAIL_FAILED: 'Failed to send reset email',
  LOGIN_LINK_SENT: 'Check your email for the login link!',
  EMAIL_REQUIRED: 'Please provide your email for confirmation',
  
  // Google Auth Errors
  GOOGLE_SIGNIN_CANCELLED: 'Google sign-in was cancelled',
  GOOGLE_POPUP_BLOCKED: 'Pop-up was blocked by browser',
  GOOGLE_ACCOUNT_EXISTS: 'Account already exists with different provider',
  GOOGLE_ERROR: 'Error signing in with Google',
  
  // General
  GENERAL_ERROR: 'An error occurred. Please try again'
};

interface AuthErrorData {
  code: string;
  message: string;
  email?: string;
  credential?: AuthCredential | null;
}

export const handleAuthError = (err: unknown): { message: string; data?: AuthErrorData } => {
  if (err instanceof FirebaseError) {
    const email = typeof err.customData?.email === 'string' ? err.customData.email : undefined;
    const credential = GoogleAuthProvider.credentialFromError(err);
    const errorData: AuthErrorData = {
      code: err.code,
      message: err.message,
      email,
      credential
    };
    
    switch (err.code) {
      // Standard Auth Errors
      case 'auth/invalid-credential':
        return { message: ERROR_MESSAGES.INVALID_PASSWORD, data: errorData };
      case 'auth/user-not-found':
        return { message: ERROR_MESSAGES.USER_NOT_FOUND, data: errorData };
      case 'auth/email-already-in-use':
        return { message: ERROR_MESSAGES.EMAIL_IN_USE, data: errorData };
      case 'auth/invalid-email':
        return { message: ERROR_MESSAGES.INVALID_EMAIL, data: errorData };
      case 'auth/weak-password':
        return { message: ERROR_MESSAGES.WEAK_PASSWORD, data: errorData };
      
      // Google Auth Specific Errors
      case 'auth/popup-closed-by-user':
        return { message: ERROR_MESSAGES.GOOGLE_SIGNIN_CANCELLED, data: errorData };
      case 'auth/popup-blocked':
        return { message: ERROR_MESSAGES.GOOGLE_POPUP_BLOCKED, data: errorData };
      case 'auth/account-exists-with-different-credential':
        return { message: ERROR_MESSAGES.GOOGLE_ACCOUNT_EXISTS, data: errorData };
      
      // Operation Errors
      case 'auth/operation-not-allowed':
      case 'auth/admin-restricted-operation':
        return { message: ERROR_MESSAGES.REGISTRATION_DISABLED, data: errorData };
      
      default:
        console.error('Firebase Auth Error:', errorData);
        return { message: ERROR_MESSAGES.GENERAL_ERROR, data: errorData };
    }
  }
  
  console.error('Unknown Error:', err);
  return { message: ERROR_MESSAGES.GENERAL_ERROR };
};