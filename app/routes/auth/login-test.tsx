import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { 
    getAuth, 
    connectAuthEmulator, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    User    
} from 'firebase/auth';
import { initializeApp, FirebaseError } from "firebase/app";
import styles from './login.module.css';

const firebaseConfig = {
  apiKey: "AIzaSyCY6nHqxZ4OrB6coHxE12MSkYERQSVXU0E",
  authDomain: "striae-e9493.firebaseapp.com",
  projectId: "striae-e9493",
  storageBucket: "striae-e9493.firebasestorage.app",
  messagingSenderId: "452634981308",
  appId: "1:452634981308:web:4c83bd86cad3b3fa6cf1b9",
  measurementId: "G-PE7BBQK1W2"
};

const appAuth = initializeApp(firebaseConfig);
const auth = getAuth(appAuth);

connectAuthEmulator(auth, 'http://127.0.0.1:9099');


export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);  
  const [user, setUser] = useState<User | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

    monitorAuthState();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(formRef.current!);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

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
      let errorMessage = 'An error occurred. Please try again.';
      if (err instanceof FirebaseError) {
        if (err.code === 'auth/wrong-password') {
          errorMessage = 'Invalid password.';
        } else if (err.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email.';
        } else if (err.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists.';
        }
      }
      setError(errorMessage);
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
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>{isLogin ? 'Login' : 'Register'}</h1>
        
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
            minLength={6}
            disabled={isLoading}
          />
          
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
      </div>
    </div>
  );
}



