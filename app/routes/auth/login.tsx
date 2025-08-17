import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import { auth } from '~/services/firebase';
import { getAdditionalUserInfo } from '~/components/actions/additionalUserInfo';
import {
    applyActionCode,           
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,    
    sendEmailVerification,
    User,
    updateProfile,
    GoogleAuthProvider,    
    signInWithPopup,        
} from 'firebase/auth';
import { PasswordReset } from '~/routes/auth/passwordReset';
import { handleAuthError, ERROR_MESSAGES } from '~/services/firebase-errors';
import styles from './login.module.css';
import { baseMeta } from '~/utils/meta';
import { Striae } from '~/routes/striae/striae';
import { getUserApiKey } from '~/utils/auth';
import paths from '~/config/config.json';

export const meta = () => {
  return baseMeta({
    title: 'Welcome to Striae',
    description: 'Login to your Striae account to access your projects and data',
  });
};

interface UserData {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  permitted: boolean;
  cases: Array<{
    caseNumber: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const USER_WORKER_URL = paths.user_worker_url;  

const actionCodeSettings = {
  url: 'https://www.striae.org/auth', // Update with your domain in production
  handleCodeInApp: true,
  linkDomain: 'striae.org'
};

const provider = new GoogleAuthProvider();

const createUserData = (
  uid: string,
  email: string | null,
  firstName: string,
  lastName: string
): UserData => ({
  uid,
  email,
  firstName,
  lastName,
  permitted: false,
  cases: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

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
    
if (additionalInfo?.isNewUser) {
  const apiKey = await getUserApiKey();
  const userData = createUserData(
    result.user.uid,
    result.user.email,
    additionalInfo.profile?.given_name || '',
    additionalInfo.profile?.family_name || ''
  );

  const response = await fetch(`${USER_WORKER_URL}/${result.user.uid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Auth-Key': apiKey
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
        throw new Error('Failed to create user data');
      }
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
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logo} />
      </Link>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Complete Your Profile</h1>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          setError('');
          
          const formData = new FormData(e.currentTarget);
          const firstName = formData.get('firstName') as string;
          const lastName = formData.get('lastName') as string;

          try {
            if (emailLinkUser) {
              // Update Firebase profile
              await updateProfile(emailLinkUser, {
                displayName: `${firstName} ${lastName}`
              });

              // Get API key and create user data
              const apiKey = await getUserApiKey();
              const userData = createUserData(
                emailLinkUser.uid,
                emailLinkUser.email,
                firstName,
                lastName
              );

              // Add to KV database
              const response = await fetch(`${USER_WORKER_URL}/${emailLinkUser.uid}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Custom-Auth-Key': apiKey
                },
                body: JSON.stringify(userData)
              });

              if (!response.ok) {
                throw new Error('Failed to create user data');
              }

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
          <input
            type="text"
            name="firstName"
            required
            placeholder="First Name (required)"
            className={styles.input}
            disabled={isLoading}
            autoComplete="given-name"
          />
          <input
            type="text"
            name="lastName"
            required
            placeholder="Last Name (required)"
            className={styles.input}
            disabled={isLoading}
            autoComplete="family-name"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
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
            console.log('Email link sign in result:', result);
            const additionalInfo = getAdditionalUserInfo(result);
            console.log('Additional info:', additionalInfo);
        
            if (additionalInfo?.isNewUser || !result.user.displayName) {
              console.log('Setting new user states');
              setEmailLinkUser(result.user);
              setNeedsProfile(true);
              setIsLoading(false);
              return;
            } else {
          // Get API key      
          const apiKey = await getUserApiKey();
                
          // Add to KV database
          const response = await fetch(`${USER_WORKER_URL}/${result.user.uid}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Custom-Auth-Key': apiKey
            },
            body: JSON.stringify({
              email: result.user.email,
              firstName: result.user.displayName?.split(' ')[0] || '',
              lastName: result.user.displayName?.split(' ')[1] || '',
              permitted: false
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create user data');
          }
          
          setUser(result.user);
        }
        window.localStorage.removeItem('emailForSignIn');            
      })
          .catch((error) => {
            console.error('Email link error:', error);
            setError(error.message);
          })
          .finally(() => {
            window.localStorage.removeItem('emailForSignIn');
            setIsLoading(false);
          });
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
  setIsLoading(true);
  setError('');

  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  try {
    if (!isLogin) {
      // Registration
      const createCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(createCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

      // Get API key      
      const apiKey = await getUserApiKey();

      // Add to KV database
      const userData = createUserData(
        createCredential.user.uid,
        createCredential.user.email,
        firstName,
        lastName
      );

      const response = await fetch(`${USER_WORKER_URL}/${createCredential.user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': apiKey
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Failed to create user data');
      }

      await sendEmailVerification(createCredential.user);
      setError('Please check your email to verify your account');
      handleSignOut();
    } else {
      // Login
      await signInWithEmailAndPassword(auth, email, password);
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
    <>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        
        // Store name data for registration flow
        if (!isLogin) {
          window.localStorage.setItem('firstName', firstName);
          window.localStorage.setItem('lastName', lastName);
        }
        
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
        
        {!isLogin && (
          <>
            <input
              type="text"
              name="firstName"
              required
              placeholder="First Name (required)"
              className={styles.input}
              disabled={isLoading}
              autoComplete="given-name"
            />
            <input
              type="text"
              name="lastName"
              required
              placeholder="Last Name (required)"
              className={styles.input}
              disabled={isLoading}
              autoComplete="family-name"
            />
          </>
        )}
        
        {error && <p className={styles.error}>{error}</p>}
        <button 
          type="submit" 
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Login Link'}
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
          <div className={styles.verificationPrompt}>
            <h2>Email Verification Required</h2>
            <p>Please check your email and verify your account before continuing.</p>
            <button 
              onClick={handleSignOut}
              className={styles.button}
            >
              Sign Out
            </button>
          </div>
        )
      ) : needsProfile ? (
        <NameCollectionForm />
      ) : isResetting ? (
        <PasswordReset onBack={() => setIsResetting(false)}/>
      ) : (
        <div className={styles.container}>
          <Link to="/" className={styles.logoLink}>
            <div className={styles.logo} />
          </Link>
          <div className={styles.formWrapper}>
        {isResetting ? (
          <PasswordReset onBack={() => setIsResetting(false)}/>
        ) : (
          <>
            <h1 className={styles.title}>{isLogin ? 'Login to Striae' : 'Register a Striae Account'}</h1>
            <a href="/access"><h5 className={styles.subtitle}>Request Early Access</h5></a>

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