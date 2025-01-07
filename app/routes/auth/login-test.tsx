import { useState } from 'react';

import { 
    getAuth, 
    connectAuthEmulator, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
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


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = getAuth(appAuth);

  connectAuthEmulator(auth, 'http://localhost:9099');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log(userCredential.user);
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

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>{isLogin ? 'Login' : 'Register'}</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

//navigate('/dashboard'); // Redirect after successful auth
//import { useNavigate } from '@remix-run/react';
//const navigate = useNavigate();