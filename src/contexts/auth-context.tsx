'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  type User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import type { UserProfile, ProfileIcon } from '@/lib/types';


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
    // No need to set userProfile here, onSnapshot will do it.
  }, [user]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Now also fetch the user profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          } else {
             // Create a default profile if it doesn't exist
            const defaultProfile: UserProfile = { displayName: user.displayName || 'Usuario', profileIcon: 'user' };
            setDoc(userDocRef, defaultProfile);
            setUserProfile(defaultProfile);
          }
          setLoading(false);
        });

        return () => unsubProfile();

      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      // Update Firebase Auth profile
      await updateAuthProfile(user, { displayName });
      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const profile: UserProfile = { displayName, profileIcon: 'user' };
      await setDoc(userDocRef, profile);
      // Manually set state to avoid waiting for onSnapshot
      setUser(user);
      setUserProfile(profile);
    }
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, userProfile, loading, signup, login, logout, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
