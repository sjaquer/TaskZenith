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
import { DEMO_USER_PROFILE } from '@/lib/demo-data';

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
  isDemo: boolean;
  signup: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  changeRole: (accessCode: string) => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // No inicializar Firebase auth listeners en modo demo
    if (isDemo) return;

    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Si entramos a demo mode mientras el listener está activo, ignorar
      if (isDemo) return;
      setUser(firebaseUser);

      // Limpiar listener anterior de perfil
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Mantener loading=true hasta que el perfil se cargue
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Auto-crear perfil si no existe (e.g. migración, usuario creado sin doc)
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Usuario',
            role: 'operator',
          };
          try {
            await setDoc(userDocRef, newProfile);
            // onSnapshot se disparará de nuevo con el doc creado
            return;
          } catch (e) {
            console.error('Error creando perfil automático:', e);
            setProfile(newProfile); // Usar perfil local como fallback
          }
        }
        setLoading(false);
      }, (error) => {
        console.error('Error escuchando perfil:', error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, [isDemo]);

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
    if (isDemo) {
      const code = (accessCode || '').trim();
      const targetRole = VALID_CODES[code];
      if (!targetRole) throw new Error('Código de acceso inválido.');
      if (targetRole === profile?.role) throw new Error(`Ya tienes el rol de ${targetRole === 'admin' ? 'Administrador' : 'Operador'}.`);
      setProfile(prev => prev ? { ...prev, role: targetRole } : prev);
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Debes iniciar sesión primero.');
    const code = (accessCode || '').trim();
    const targetRole = VALID_CODES[code];
    if (!targetRole) throw new Error('Código de acceso inválido.');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      // Auto-crear perfil si no existe
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'Usuario',
        role: targetRole,
      };
      await setDoc(userDocRef, newProfile);
      return;
    }
    const currentProfile = userDoc.data() as UserProfile;
    if (targetRole === currentProfile.role) throw new Error(`Ya tienes el rol de ${targetRole === 'admin' ? 'Administrador' : 'Operador'}.`);
    await updateDoc(userDocRef, { role: targetRole });
  };

  const enterDemoMode = useCallback(() => {
    setIsDemo(true);
    // Crear un usuario ficticio para el modo demo
    const demoUser = {
      uid: DEMO_USER_PROFILE.uid,
      email: DEMO_USER_PROFILE.email,
      displayName: DEMO_USER_PROFILE.displayName,
      photoURL: null,
      emailVerified: true,
    } as unknown as User;
    setUser(demoUser);
    setProfile(DEMO_USER_PROFILE);
    setLoading(false);
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemo(false);
    setUser(null);
    setProfile(null);
  }, []);

  const value = { user, profile, loading, role: profile?.role || null, isDemo, signup, login, logout, changeRole, enterDemoMode, exitDemoMode };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
