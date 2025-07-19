"use client";

import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import type {Auth, GithubAuthProvider, GoogleAuthProvider, UserCredential} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithGitHub: () => Promise<UserCredential>;
  signUpWithEmail: (email:string, password:string) => Promise<UserCredential>;
  signInWithEmail: (email:string, password:string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string | null; photoURL?: string | null; }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Firebase is configured before setting up the listener
    // This is crucial for deployed environments where env vars might be missing.
    if (!auth.app.options.apiKey || auth.app.options.apiKey === 'dummy-api-key') {
      console.error("Firebase is not configured. Auth will not work. Please set up your environment variables.");
      setLoading(false);
      setUser(null);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
  const signInWithGitHub = () => signInWithPopup(auth, githubProvider);
  const signUpWithEmail = (email:string, password:string) => createUserWithEmailAndPassword(auth, email, password);
  const signInWithEmail = (email:string, password:string) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);
  
  const updateUserProfile = async (profile: { displayName?: string | null; photoURL?: string | null; }) => {
      if (auth.currentUser) {
          await updateProfile(auth.currentUser, profile);
          // Manually update the user state because onAuthStateChanged might not fire immediately
          setUser(prevUser => prevUser ? { ...prevUser, ...profile } : null);
      } else {
          throw new Error("No user is signed in to update the profile.");
      }
  };

  const sendPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

  const value = { user, loading, signInWithGoogle, signInWithGitHub, signUpWithEmail, signInWithEmail, signOut, updateUserProfile, sendPasswordReset };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
