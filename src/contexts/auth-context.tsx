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
  browserSessionPersistence,
} from 'firebase/auth';

import { UserProfile, UserRole } from '@/lib/types';

// Códigos de acceso válidos (mismos que en signup)
const VALID_CODES: Record<string, 'admin' | 'operator'> = {
  'TASKZENITH-ADMIN': 'admin',
  'permisos77': 'admin',
  'TASKZENITH-CORP': 'operator',
  'seaways9090': 'operator',
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  signup: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  changeRole: (accessCode: string) => Promise<void>;
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

  const signup = async (email: string, password: string, displayName: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      await updateAuthProfile(user, { displayName });
      const userDocRef = doc(db, 'users', user.uid);
      const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!, // Email is guaranteed to be present after successful signup
          displayName,
          role
      };
      await setDoc(userDocRef, userProfile);
      setUser({ ...user, displayName }); // Optimistic update
      setProfile(userProfile);
    }
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    // Auth is initialized with LOCAL persistence (IndexedDB) by default in firebase.ts.
    // Only override when the user explicitly does NOT want to be remembered.
    if (!rememberMe) {
      await setPersistence(auth, browserSessionPersistence);
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const changeRole = async (accessCode: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Debes iniciar sesión primero.');
    const code = (accessCode || '').trim();
    const targetRole = VALID_CODES[code];
    if (!targetRole) throw new Error('Código de acceso inválido.');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) throw new Error('Perfil de usuario no encontrado.');
    const currentProfile = userDoc.data() as UserProfile;
    if (targetRole === currentProfile.role) throw new Error(`Ya tienes el rol de ${targetRole === 'admin' ? 'Administrador' : 'Operador'}.`);
    await updateDoc(userDocRef, { role: targetRole });
  };

  const value = { user, profile, loading, role: profile?.role || null, signup, login, logout, changeRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
