import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { auth } from '~/services/firebase';
import {
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    User,
    updateProfile,
    getMultiFactorResolver,
    MultiFactorResolver,
    MultiFactorError,
    multiFactor
} from 'firebase/auth';
import { PasswordReset } from '~/routes/auth/passwordReset';
import { handleAuthError } from '~/services/firebase-errors';
import { AuthPassword } from '~/components/auth/auth-password';
import { MFAVerification } from '~/components/auth/mfa-verification';
import { MFAEnrollment } from '~/components/auth/mfa-enrollment';
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
  company: string;
  permitted: boolean;
  cases: Array<{
    caseNumber: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const USER_WORKER_URL = paths.user_worker_url;

const createUserData = (
  uid: string,
  email: string | null,
  firstName: string,
  lastName: string,
  company: string
): UserData => ({
  uid,
  email,
  firstName,
  lastName,
  company,
  permitted: false,
  cases: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const Login = () => {
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [hasAuthAccess, setHasAuthAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // MFA state
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [showMfaEnrollment, setShowMfaEnrollment] = useState(false);

  // Check for existing auth access on mount
  useEffect(() => {
    const accessGranted = sessionStorage.getItem('auth-access-granted') === 'true';
    setHasAuthAccess(accessGranted);
  }, []);

  const handleAccessGranted = () => {
    setHasAuthAccess(true);
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
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
   if (user) {
      if (!user.emailVerified) {
        handleSignOut();
        setError('Please verify your email before logging in');
        return;
      }      
      
      // Check if user has MFA enrolled
      const mfaFactors = multiFactor(user).enrolledFactors;
      if (mfaFactors.length === 0) {
        // User has no MFA factors enrolled - require enrollment
        setShowMfaEnrollment(true);
        setUser(user); // Still set user so enrollment component can use it
        return;
      }
      
      console.log("Logged in user:", user.email);
      setUser(user);
      setShowMfaEnrollment(false);      
    } else {
      console.log("No user logged in");
      setUser(null);
      setShowMfaEnrollment(false);
    }
  });

   return () => unsubscribe();
}, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const company = formData.get('company') as string;

  try {
    if (!isLogin) {
      // Registration validation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      if (!checkPasswordStrength(password)) {
        setError('Password does not meet requirements');
        setIsLoading(false);
        return;
      }

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
        lastName,
        company || '' // Use company from form, fallback to empty string
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
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: unknown) {
        // Check if it's a Firebase Auth error with MFA requirement
        if (
          loginError && 
          typeof loginError === 'object' && 
          'code' in loginError && 
          loginError.code === 'auth/multi-factor-auth-required'
        ) {
          // Handle MFA requirement
          const resolver = getMultiFactorResolver(auth, loginError as MultiFactorError);
          setMfaResolver(resolver);
          setShowMfaVerification(true);
          setIsLoading(false);
          return;
        }
        throw loginError; // Re-throw non-MFA errors
      }
    }
  } catch (err) {
    const { message } = handleAuthError(err);
    setError(message);
  } finally {
    setIsLoading(false);
  }
};

  // Add proper sign out handling
  const handleSignOut = async () => {
    try {
      await auth.signOut();      
      setUser(null);
      setIsLoading(false);
      setShowMfaEnrollment(false);
      setShowMfaVerification(false);
      setMfaResolver(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // MFA handlers
  const handleMfaSuccess = () => {
    setShowMfaVerification(false);
    setMfaResolver(null);
    // The auth state listener will handle the rest
  };

  const handleMfaError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleMfaCancel = () => {
    setShowMfaVerification(false);
    setMfaResolver(null);
    setError('Authentication cancelled');
  };

  // MFA enrollment handlers
  const handleMfaEnrollmentSuccess = () => {
    setShowMfaEnrollment(false);
    setError('');
    // The auth state listener will re-evaluate the user's MFA status
  };

  const handleMfaEnrollmentError = (errorMessage: string) => {
    setError(errorMessage);
  };  

  return (
    <>
      {!hasAuthAccess ? (
        <AuthPassword onAccessGranted={handleAccessGranted} />
      ) : (
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
          ) : isResetting ? (
            <PasswordReset onBack={() => setIsResetting(false)}/>
          ) : (
            <div className={styles.container}>
              <Link to="/" className={styles.logoLink}>
                <div className={styles.logo} />
              </Link>
              <div className={styles.formWrapper}>
                <h1 className={styles.title}>{isLogin ? 'Login to Striae' : 'Register a Striae Account'}</h1>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    className={styles.input}
                    required
                    disabled={isLoading}
                  />
                  <div className={styles.passwordField}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      className={styles.input}
                      required
                      disabled={isLoading}
                      onChange={(e) => !isLogin && checkPasswordStrength(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_7_33)">
                            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.6819 3.96914 7.65661 6.06 6.06M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_7_33">
                              <rect width="24" height="24" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_7_18)">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_7_18">
                              <rect width="24" height="24" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {!isLogin && (
                    <>
                      <div className={styles.passwordField}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          autoComplete="new-password"
                          className={styles.input}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_7_33_confirm)">
                                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.6819 3.96914 7.65661 6.06 6.06M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_7_33_confirm">
                                  <rect width="24" height="24" fill="white"/>
                                </clipPath>
                              </defs>
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_7_18_confirm)">
                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_7_18_confirm">
                                  <rect width="24" height="24" fill="white"/>
                                </clipPath>
                              </defs>
                            </svg>
                          )}
                        </button>
                      </div>
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
                      <input
                        type="text"
                        name="company"
                        required
                        placeholder="Lab/Company Name (required)"
                        autoComplete="organization"
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
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                      setPasswordStrength('');
                      setError('');
                    }}
                    className={styles.toggleButton}
                    disabled={isLoading}
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>
            </div>
          )}
        </>
      )}
      
      {showMfaVerification && mfaResolver && (
        <MFAVerification 
          resolver={mfaResolver}
          onSuccess={handleMfaSuccess}
          onError={handleMfaError}
          onCancel={handleMfaCancel}
        />
      )}
      
      {showMfaEnrollment && user && (
        <MFAEnrollment 
          user={user}
          onSuccess={handleMfaEnrollmentSuccess}
          onError={handleMfaEnrollmentError}
          mandatory={true}
        />
      )}
    </>
  );
};

export default Login;