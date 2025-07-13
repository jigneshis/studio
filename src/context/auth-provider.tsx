"use client";

import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  
  const value = { user, loading, signInWithGoogle, signInWithGitHub, signUpWithEmail, signInWithEmail, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
