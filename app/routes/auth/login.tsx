import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
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
    sendEmailVerification,
    applyActionCode,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    getAdditionalUserInfo    
} from 'firebase/auth';
import { initializeApp, FirebaseError } from "firebase/app";
import styles from './login.module.css';
import paths from '~/config.json';
import { baseMeta } from '~/utils/meta';

export const meta = () => {
  return baseMeta({
    title: 'Login to Striae',
    description: 'Login to your Striae account to access your projects and data',
  });
};

interface CloudflareContext {  
    cloudflare: {
      env: {
        R2_KEY_SECRET: string;
      };
    };
  }

  interface Data {
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }

  interface LoaderData {
    data: Data[];
    context: CloudflareContext;
  }

interface AddUserParams {
  user: User;
  firstName?: string;
  lastName?: string;
  context: CloudflareContext;
}

const WORKER_URL = paths.data_worker_url;

export const loader = async ({ context }: { context: CloudflareContext }) => {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status);
      return json<LoaderData>({ data: [], context });
    }

    const data = await response.json();
    return json<LoaderData>({ 
    data: Array.isArray(data) ? data.filter(Boolean) : [],
    context 
  });
    
  } catch (error) {
    console.error('Loader error:', error);
    return json<LoaderData>({ data: [], context });
  }
};

const firebaseConfig = {    
  apiKey: "AIzaSyA683U5AyDPNEWJaSvjXuzMp1czKlzm8pM",
  authDomain: "striae-6e5ef.firebaseapp.com",
  projectId: "striae-6e5ef",
  storageBucket: "striae-6e5ef.firebasestorage.app",
  messagingSenderId: "981912078156",
  appId: "1:981912078156:web:75e4590085492b750471e9",
  measurementId: "G-FFXGKSFXXN"
};

const addUserToData = async ({ user, firstName, lastName, context }: AddUserParams) => {
  if (!context?.cloudflare?.env?.R2_KEY_SECRET) {
    throw new Error('Missing Cloudflare context');
  }  
    const userData = {
    email: user.email,
    firstName: firstName || '',
    lastName: lastName || '',
    createdAt: new Date().toISOString()
  };  

  try {    
    const response = await fetch(`https://data.striae.allyforensics.com/${user.uid}/data.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {      
      throw new Error('Failed to create user data');      
    }
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
};

const actionCodeSettings = {
  url: 'https://striae.allyforensics.com', // Update with your domain in production
  handleCodeInApp: true,
};

const appAuth = initializeApp(firebaseConfig, "Striae");
const auth = getAuth(appAuth);
const provider = new GoogleAuthProvider();
console.log(`Welcome to ${appAuth.name}`); // "Welcome to Striae"

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

export const Login = () => {
  const { context } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);  
  const [user, setUser] = useState<User | null>(null);
  const [passwordStrength, setPasswordStrength] = useState('');  
  const [authMethod, setAuthMethod] = useState<'password' | 'emailLink'>('password');
  const [isResetting, setIsResetting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setError('');
  
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    
    if (!user.emailVerified) {
      await handleSignOut();
      setError('Please verify your email before logging in');
      return;
    }
    
    const additionalInfo = getAdditionalUserInfo(result);
    console.log('Google sign-in successful:', { user, token, additionalInfo });
    
    setUser(user);
    navigate('/');
  } catch (err) {
    if (err instanceof FirebaseError) {
      const email = err.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(err);
      
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          setError('Sign-in cancelled');
          break;
        case 'auth/popup-blocked':
          setError('Pop-up blocked by browser');
          break;
        default:
          setError(ERROR_MESSAGES.GENERAL_ERROR);
      }
      console.error('Google sign-in error:', { err, email, credential });
    }
  } finally {
    setIsLoading(false);
  }
};
  
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
        autoComplete="email"
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
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      if (!user.emailVerified) {
        handleSignOut();
        setError('Please verify your email before logging in');
        return;
      }
      console.log("Logged in user:", user.email);
      setUser(user);
      navigate('/');
    } else {
      console.log("No user logged in");
      setUser(null);
    }
  });
  

    const handleVerifyEmail = async (actionCode: string, continueUrl?: string) => {
  try {
    await applyActionCode(auth, actionCode);
    setError('Email verified successfully!');
    if (continueUrl) {
      navigate(continueUrl);
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/expired-action-code':
          setError('Verification link has expired');
          break;
        case 'auth/invalid-action-code':
          setError('Invalid verification link');
          break;
        default:
          setError('Failed to verify email');
      }
    }
  }
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

  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const actionCode = urlParams.get('oobCode');
  const continueUrl = urlParams.get('continueUrl');

  if (mode === 'verifyEmail' && actionCode) {
    handleVerifyEmail(actionCode, continueUrl || undefined);
  }
   return () => unsubscribe();
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
      if (!userCredential.user.emailVerified) {
        await handleSignOut();
        setError('Please verify your email before logging in');
        return;
      }
      console.log(userCredential.user);
    } else {
      const createCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(createCredential.user);

      // Add user data to R2
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      await addUserToData({
        user: createCredential.user,
        firstName,
        lastName,
        context
      });

      await handleSignOut(); // Sign out immediately after registration
      setError('Registration successful! Please check your email to verify your account before logging in.');
      setIsLogin(true); // Switch to login view
      console.log('Verification email sent');
    }
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
        autoComplete="email"
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
      <Link to="/" className={styles.logoLink}>
  <div className={styles.logo} />
</Link>
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
      <Link to="/" className={styles.logoLink}>
  <div className={styles.logo} />
</Link>
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
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className={styles.googleButton}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
            
            {authMethod === 'password' ? (
              <>
                <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    className={styles.input}
                    required
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
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
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        className={styles.input}
                        required
                        disabled={isLoading}
                      />
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      autoComplete="given-name"
                      className={styles.input}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      autoComplete="family-name"
                      className={styles.input}
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

export default Login;