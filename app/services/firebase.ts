import { initializeApp } from 'firebase/app';
import { 
    getAuth,
    //connectAuthEmulator,    
 } from 'firebase/auth';
import firebaseConfig from '~/config/firebase';
import config from '~/config/config.json';
import { getAppVersion } from '~/utils/version';

export const app = initializeApp(firebaseConfig, "Striae");
export const auth = getAuth(app);

// Configure reCAPTCHA Enterprise for Firebase Auth
if (typeof window !== 'undefined' && config.recaptcha.enabled) {
  // Disable test mode to ensure reCAPTCHA is properly enforced
  auth.settings.appVerificationDisabledForTesting = false;
  
  // Note: reCAPTCHA Enterprise configuration is handled in Firebase Console
  // The site key should be configured in Firebase Console under:
  // Authentication → Settings → Phone Authentication → reCAPTCHA Enterprise
  console.log('reCAPTCHA Enterprise enabled for Firebase Auth');
}

console.log(`Welcome to ${app.name} v${getAppVersion()}`);

//Connect to the Firebase Auth emulator if running locally
//connectAuthEmulator(auth, 'http://127.0.0.1:9099');