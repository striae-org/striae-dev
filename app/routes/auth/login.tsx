import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import {
    //connectAuthEmulator, 
    getAuth,      
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    sendPasswordResetEmail,
    User,    
} from 'firebase/auth';
import { initializeApp, FirebaseError } from "firebase/app";
import styles from './login.module.css';

const firebaseConfig = {  
  apiKey: "AIzaSyCY6nHqxZ4OrB6coHxE12MSkYERQSVXU0E",
  authDomain: "striae.allyforensics.com",
  projectId: "striae-e9493",
  storageBucket: "striae-e9493.firebasestorage.app",
  messagingSenderId: "452634981308",
  appId: "1:452634981308:web:4c83bd86cad3b3fa6cf1b9",
  measurementId: "G-PE7BBQK1W2"
};

const actionCodeSettings = {
  url: 'https://striae.allyforensics.com', // Update with your domain in production
  handleCodeInApp: true,
};

const appAuth = initializeApp(firebaseConfig);
const auth = getAuth(appAuth);

//Connect to the Firebase Auth emulator if running locally
//connectAuthEmulator(auth, 'http://127.0.0.1:9099');

const ERROR_MESSAGES = {
  INVALID_PASSWORD: 'Invalid password',
  USER_NOT_FOUND: 'No account found with this email',
  EMAIL_IN_USE: 'An account with this email already exists',
  REGISTRATION_DISABLED: 'New registrations are currently disabled',
  PASSWORDS_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password does not meet strength requirements',
  RESET_EMAIL_SENT: 'Password reset email sent! Check your inbox',
  RESET_EMAIL_FAILED: 'Failed to send reset email',
  LOGIN_LINK_SENT: 'Check your email for the login link!',
  GENERAL_ERROR: 'New registrations are currently disabled',
  EMAIL_REQUIRED: 'Please provide your email for confirmation'
};


export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);  
  const [user, setUser] = useState<User | null>(null);
  const [passwordStrength, setPasswordStrength] = useState('');  
  const [authMethod, setAuthMethod] = useState<'password' | 'emailLink'>('password');
  const [isResetting, setIsResetting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const ResetPasswordForm = () => {
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formRef.current?.email.value;
    if (email) {
      setIsLoading(true);
      try {
      await sendPasswordResetEmail(auth, email);
      setError(ERROR_MESSAGES.RESET_EMAIL_SENT);
      setTimeout(() => setIsResetting(false), 2000);
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError(ERROR_MESSAGES.USER_NOT_FOUND);
            break;
          default:
            setError(ERROR_MESSAGES.RESET_EMAIL_FAILED);
        }
      } else {
        setError(ERROR_MESSAGES.RESET_EMAIL_FAILED);
      }
    } finally {
            setIsLoading(false);
          }
        }
      };

  return (
    <form ref={formRef} onSubmit={handleReset} className={styles.form}>
      <h2>Reset Password</h2>
      <input
        type="email"
        name="email"
        placeholder="Email"
        className={styles.input}
        required
      />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.button} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>
      <button 
        type="button" 
        onClick={() => setIsResetting(false)}
        className={styles.secondaryButton}
      >
        Back to Login
      </button>
    </form>
  );
};

    const checkPasswordStrength = (password: string): boolean => {
    const hasMinLength = password.length >= 10;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const isStrong = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;
    setPasswordStrength(
      `Password must contain:
      ${!hasMinLength ? '❌' : '✅'} At least 10 characters
      ${!hasUpperCase ? '❌' : '✅'} Capital letters
      ${!hasNumber ? '❌' : '✅'} Numbers
      ${!hasSpecialChar ? '❌' : '✅'} Special characters`
    );
    
    return isStrong;
  };

   useEffect(() => {
    const monitorAuthState = async () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("Logged in user:", user.email);
          setUser(user);
          navigate('/'); // Redirect after successful auth
        } else {
          console.log("No user logged in");
          setUser(null);
        }
      });
    };
    
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
      email = window.prompt(ERROR_MESSAGES.EMAIL_REQUIRED);
      }
      if (email) {
        setIsLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            navigate('/');
          })
          .catch((error) => setError(error.message))
          .finally(() => setIsLoading(false));
      }
    }

    monitorAuthState();
  }, [navigate]);
  
  const handleEmailLink = async (email: string) => {
    try {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
  setError(ERROR_MESSAGES.LOGIN_LINK_SENT);
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-email':
            setError(ERROR_MESSAGES.USER_NOT_FOUND);
            break;
          default:
            setError(ERROR_MESSAGES.GENERAL_ERROR);
        }
      } else {
        setError(ERROR_MESSAGES.GENERAL_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(formRef.current!);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      if (!checkPasswordStrength(password)) {
        setError('Password does not meet strength requirements');
        setIsLoading(false);
        return;
      }
    }


    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);        
        console.log(userCredential.user);
      } else {
        const createCredential = await createUserWithEmailAndPassword(auth, email, password);       
        console.log(createCredential.user);
      }
      console.log('Success');
      
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {        
        switch (err.code) {
          case 'auth/wrong-password':
            setError(ERROR_MESSAGES.INVALID_PASSWORD);
            break;
          case 'auth/user-not-found':
            setError(ERROR_MESSAGES.USER_NOT_FOUND);
            break;
          case 'auth/email-already-in-use':
            setError(ERROR_MESSAGES.EMAIL_IN_USE);
            break;
          case 'auth/operation-not-allowed':
          case 'auth/admin-restricted-operation':
            setError(ERROR_MESSAGES.REGISTRATION_DISABLED);
            break;
          default:
            setError(ERROR_MESSAGES.GENERAL_ERROR);
        }
      } else {
        setError(ERROR_MESSAGES.GENERAL_ERROR);
      }
    } finally {
          setIsLoading(false);
    }
  };

  const EmailLinkForm = () => {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      handleEmailLink(email);
    }} className={styles.form}>
      <input
        type="email"
        name="email"
        placeholder="Email"
        className={styles.input}
        required
        disabled={isLoading}
      />
      {error && <p className={styles.error}>{error}</p>}
      <button 
        type="submit" 
        className={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Login Link'}
      </button>
    </form>
  );
};

  // Add proper sign out handling
  const handleSignOut = async () => {
    try {
      await auth.signOut();      
      setUser(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // If user is already logged in, show a message or redirect
  if (user) {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>Welcome {user.email}</h1>
          <button 
            onClick={handleSignOut} 
            className={styles.button}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.logo} />
      <div className={styles.formWrapper}>
        {isResetting ? (
          <ResetPasswordForm />
        ) : (
          <>
            <h1 className={styles.title}>{isLogin ? 'Login to Striae' : 'Register a Striae Account'}</h1>
            <a href="/beta"><h5 className={styles.subtitle}>Sign up for Beta Access</h5></a>

            <div className={styles.authToggle}>
              <button 
                onClick={() => setAuthMethod('password')}
                className={`${styles.authToggleButton} ${authMethod === 'password' ? styles.active : ''}`}
              >
                Sign in with Password
              </button>
              <span className={styles.divider}>or</span>
              <button 
                onClick={() => setAuthMethod('emailLink')}
                className={`${styles.emailLinkButton} ${authMethod === 'emailLink' ? styles.active : ''}`}
              >
                Get a Code Instead
              </button>
            </div>
            
            {authMethod === 'password' ? (
              <>
                <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className={styles.input}
                    required
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className={styles.input}
                    required
                    disabled={isLoading}
                    onChange={(e) => !isLogin && checkPasswordStrength(e.target.value)}
                  />
                  
                  {!isLogin && (
                    <>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className={styles.input}
                        required
                        disabled={isLoading}
                      />
                      {passwordStrength && (
                        <div className={styles.passwordStrength}>
                          <pre>{passwordStrength}</pre>
                        </div>
                      )}
                    </>
                  )}
                  
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setIsResetting(true)}
                      className={styles.resetLink}
                    >
                    Forgot Password?
                    </button>
                  )}
                  
                  {error && <p className={styles.error}>{error}</p>}
                  
                  <button 
                    type="submit" 
                    className={styles.button}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
                  </button>
                </form>
                <p className={styles.toggle}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className={styles.toggleButton}
                    disabled={isLoading}
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </>
            ) : (
              <EmailLinkForm />
            )}
          </>
        )}
      </div>
    </div>
  );
}