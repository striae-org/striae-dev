import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '~/config/firebase';

export const app = initializeApp(firebaseConfig, "Striae");
export const auth = getAuth(app);

console.log(`Welcome to ${app.name}`); // "Welcome to Striae"