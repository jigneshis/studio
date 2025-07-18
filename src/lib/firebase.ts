// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;

// This checks if the keys are placeholders. If they are, it will show a console error.
// The app will continue to run with a dummy config to avoid crashing.
if (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.startsWith('your-')
) {
  console.error('Firebase config is not set. Please add your credentials to the src/.env file.');
  // Initialize with a dummy config to prevent app crash
  app = getApps().length ? getApp() : initializeApp({ apiKey: 'dummy-key' });
} else {
  // Initialize Firebase with the actual config
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}


const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { app, auth, googleProvider, githubProvider };
