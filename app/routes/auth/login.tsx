import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { auth } from '~/services/firebase';
import type { CustomLoaderArgs } from '~/types/actions';
import { addUserData } from '~/components/actions/addUserData';
import { getAdditionalUserInfo } from '~/components/actions/additionalUserInfo';
import {
    applyActionCode,           
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    sendPasswordResetEmail,
    sendEmailVerification,
    User,
    updateProfile,
    GoogleAuthProvider,    
    signInWithPopup,        
} from 'firebase/auth';
import { handleAuthError, ERROR_MESSAGES } from '~/services/firebase-errors';
import { Interstitial } from './interstitial';
import styles from './login.module.css';
import { baseMeta } from '~/utils/meta';
import { Striae } from '~/routes/striae/striae';
import paths from '~/config.json';
import { json } from '@remix-run/cloudflare';

export const meta = () => {
  return baseMeta({
    title: 'Welcome to Striae',
    description: 'Login to your Striae account to access your projects and data',
  });
};

  interface Data {
    email: string;
    firstName: string;
    lastName: string;
    permitted: boolean;
    createdAt: string;
    uid: string;
  }

  interface LoaderData {
    data: Data[];    
  }

  const WORKER_URL = paths.data_worker_url;

const actionCodeSettings = {
  url: 'https://striae.allyforensics.com', // Update with your domain in production
  handleCodeInApp: true,
};

const provider = new GoogleAuthProvider();

export const loader = async ({ context, user }: CustomLoaderArgs) => {
  try {
    if (!user) {
      return json<LoaderData>({ data: [] });
    }

    const response = await fetch(`${WORKER_URL}/${user.uid}/data.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET,
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status);
      return json<LoaderData>({ data: [] });
    }

    const data = await response.json();
    return json<LoaderData>({ 
      data: Array.isArray(data) ? data.filter(Boolean) : []       
    });
     
  } catch (error) {
    console.error('Loader error:', error);
    return json<LoaderData>({ data: [] });
  }
};

export const Login = () => {    
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);  
  const [user, setUser] = useState<User | null>(null);
  const [passwordStrength, setPasswordStrength] = useState('');  
  const [authMethod, setAuthMethod] = useState<'password' | 'emailLink'>('password');
  const [isResetting, setIsResetting] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [emailLinkUser, setEmailLinkUser] = useState<User | null>(null);

  

  const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setError('');
  try {
    const result = await signInWithPopup(auth, provider);
    const additionalInfo = getAdditionalUserInfo(result);
    
    
    if (!result.user.emailVerified) {
      await handleSignOut();
      setError('Please verify your email before logging in');
      return;
    }
    
    if (additionalInfo.isNewUser) {
      await addUserData({
        user: result.user,
        firstName: additionalInfo.profile?.given_name || '',
        lastName: additionalInfo.profile?.family_name || '',        
      });
    }

    setUser(result.user);
  } catch (err) {
    const { message } = handleAuthError(err);
    setError(message);
  } finally {
    setIsLoading(false);
  }
};

  const NameCollectionForm = () => {
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setIsLoading(true);
      
      const formData = new FormData(e.currentTarget);
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      try {
        if (emailLinkUser) {
          await updateProfile(emailLinkUser, {
            displayName: `${firstName} ${lastName}`
          });

          await addUserData({
            user: emailLinkUser,
            firstName,
            lastName            
          });

          setUser(emailLinkUser);
          setNeedsProfile(false);
        }
      } catch (err) {
        const { message } = handleAuthError(err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }} className={styles.form}>
      <h2>Complete Your Profile</h2>
      <input
        type="text"
        name="firstName"
        required
        placeholder="First Name (required)"
        className={styles.input}
        disabled={isLoading}
      />
      <input
        type="text"
        name="lastName"
        required
        placeholder="Last Name (required)"
        className={styles.input}
        disabled={isLoading}
      />
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="submit"
        className={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  );
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
      const { message } = handleAuthError(err);
      setError(message);
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
    const { message } = handleAuthError(err);
    setError(message);
  } finally {
    setIsLoading(false);
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
          .then(async (result) => {
             const additionalInfo = getAdditionalUserInfo(result);
        
            if (additionalInfo?.isNewUser) {
              setEmailLinkUser(result.user);
              setNeedsProfile(true);
            } else {
            // Add user data to R2
            await addUserData({
              user: result.user,
              firstName: result.user.displayName?.split(' ')[0] || '',
              lastName: result.user.displayName?.split(' ')[1] || ''
            });
            setUser(result.user);
          }
            window.localStorage.removeItem('emailForSignIn');            
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
    const { message } = handleAuthError(err);
    setError(message);
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

  try {
    if (isLogin) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await handleSignOut();
          setError('Please verify your email before logging in');
          return;
        }
        setUser(userCredential.user);
      } catch (err) {
        const { message } = handleAuthError(err);
        setError(message);
        return;
      }
    } else {
      // Registration validation
      if (password !== confirmPassword) {
        setError(ERROR_MESSAGES.PASSWORDS_MISMATCH);
        return;
      }
      
      if (!checkPasswordStrength(password)) {
        setError(ERROR_MESSAGES.WEAK_PASSWORD);
        return;
      }

      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      if (!firstName || !lastName) {
        setError('First and last name are required');
        return;
      }

      try {
        const createCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(createCredential.user, {
          displayName: `${firstName} ${lastName}`
        });

        // Add user data to R2
      await addUserData({
        user: createCredential.user,
        firstName,
        lastName        
      });

        await sendEmailVerification(createCredential.user);
        await handleSignOut();
        setError('Registration successful! Please verify your email before logging in.');
        setIsLogin(true);
      } catch (err) {
        const { message } = handleAuthError(err);
        setError(message);
        return;
      }
    }
  } catch (err) {
    const { message } = handleAuthError(err);
    setError(message);
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

  return (
    <>
      {user ? (
        user.emailVerified ? (
          <Striae user={user} />
        ) : (
          <Interstitial user={user} />
        )
        ) : needsProfile ? (
      <div className={styles.container}>
        <Link to="/" className={styles.logoLink}>
          <div className={styles.logo} />
        </Link>
        <div className={styles.formWrapper}>
          <NameCollectionForm />
        </div>
      </div>
      ) : (
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
                        autoComplete="new-password"
                        className={styles.input}
                        required
                        disabled={isLoading}
                      />
                    <input
                      type="text"
                      name="firstName"
                      required
                      placeholder="First Name (required)"
                      autoComplete="given-name"
                      className={styles.input}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      name="lastName"
                      required
                      placeholder="Last Name (required)"
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
      )}
    </>
  );
};

export default Login;