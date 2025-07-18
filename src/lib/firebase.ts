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

// Log the firebaseConfig to ensure environment variables are loaded
console.log("Firebase Config:", firebaseConfig);

let app;

// This checks if the keys are placeholders. If they are, it will show a console error.
// The app will continue to run with a dummy config to avoid crashing.
if (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.startsWith('your-') ||
  !firebaseConfig.authDomain ||
  firebaseConfig.authDomain.startsWith('your-') ||
  !firebaseConfig.projectId ||
  firebaseConfig.projectId.startsWith('your-')
) {
  console.error("Firebase environment variables are not properly set. Please check your .env.local file or Netlify environment variables.");
  // Use a dummy config to prevent the app from crashing during development
  app = initializeApp({
    apiKey: "dummy-api-key",
    authDomain: "dummy-auth-domain",
    projectId: "dummy-project-id",
    storageBucket: "dummy-storage-bucket",
    messagingSenderId: "dummy-messaging-sender-id",
    appId: "dummy-app-id",
  });
} else {
  // Initialize Firebase only if no app has been initialized yet
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { app, auth, googleProvider, githubProvider };