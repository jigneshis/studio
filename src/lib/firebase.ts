import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import type {FirebaseApp} from 'firebase/app';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your own Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
    if (
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== 'your-api-key'
    ) {
        app = initializeApp(firebaseConfig);
    } else {
        console.error('Firebase config is not set. Please add your credentials to the .env file.');
        // Create a dummy app to avoid crashing the app
        app = initializeApp({ apiKey: 'dummy-key' });
    }
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { app, auth, googleProvider, githubProvider };
