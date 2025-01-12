import { initializeApp } from 'firebase/app';
import { 
    getAuth,
    connectAuthEmulator,    
 } from 'firebase/auth';
import firebaseConfig from '~/config/firebase';

export const app = initializeApp(firebaseConfig, "Striae");
export const auth = getAuth(app);

console.log(`Welcome to ${app.name}`); // "Welcome to Striae"

//Connect to the Firebase Auth emulator if running locally
connectAuthEmulator(auth, 'http://127.0.0.1:9099');