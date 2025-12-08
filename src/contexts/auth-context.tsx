'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
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

interface UserProfile {
    displayName: string;
    streak?: number;
    lastCompletedDay?: string; // YYYY-MM-DD
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  streak: number;
  updateStreak: () => void;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            }
        });
    }
    return () => unsubscribe && unsubscribe();
  }, [user]);

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      await updateAuthProfile(user, { displayName });
      const userDocRef = doc(db, 'users', user.uid);
      const userProfile: UserProfile = { 
          displayName,
          streak: 0,
          lastCompletedDay: ''
      };
      await setDoc(userDocRef, userProfile);
      setUser({ ...user, displayName }); // Optimistic update
      setProfile(userProfile);
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

  const updateStreak = useCallback(async () => {
    if (!user || !profile) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (profile.lastCompletedDay === todayStr) {
        return; // Already completed a task today
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const userDocRef = doc(db, 'users', user.uid);
    let newStreak = 1;

    if (profile.lastCompletedDay === yesterdayStr) {
        newStreak = (profile.streak || 0) + 1;
    }

    try {
        await updateDoc(userDocRef, {
            streak: newStreak,
            lastCompletedDay: todayStr,
        });
        setProfile(p => p ? {...p, streak: newStreak, lastCompletedDay: todayStr} : null);
    } catch(error) {
        console.error("Failed to update streak:", error);
    }

  }, [user, profile]);

  const value = { user, loading, streak: profile?.streak || 0, updateStreak, signup, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
