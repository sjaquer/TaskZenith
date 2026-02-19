
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

type ColorTheme = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  accent: string;
};

type LayoutConfig = {
    showStats: boolean;
    showTodoList: boolean;
    showKanban: boolean;
    showHistory: boolean;
    showCalendar: boolean;
    showDueTasks: boolean;
    widgetOrder: string[];
}

type PredefinedTheme = {
  name: string;
  colors: ColorTheme;
};

interface ThemeContextType {
  theme: ColorTheme;
  layoutConfig: LayoutConfig;
  isCustomizerOpen: boolean;
  isLoading: boolean;
  setTheme: (theme: ColorTheme) => void;
  setLayoutConfig: (config: LayoutConfig) => void;
  setCustomizerOpen: (isOpen: boolean) => void;
  resetToDefault: () => void;
}

const defaultTheme: ColorTheme = {
  background: '220 20% 10%',
  foreground: '210 20% 98%',
  card: '220 20% 15%',
  primary: '203 89% 39%',
  accent: '45 89% 51%',
};

const defaultLayout: LayoutConfig = {
    showStats: true,
    showTodoList: true,
    showKanban: true,
    showHistory: true,
    showCalendar: true,
    showDueTasks: true,
    widgetOrder: ['stats', 'due', 'calendar', 'todo'],
};

export const predefinedThemes: PredefinedTheme[] = [
  { name: 'Default Dark', colors: defaultTheme },
  { name: 'Lavanda Suave', colors: { background: '250 30% 15%', foreground: '250 10% 90%', card: '250 30% 20%', primary: '250 60% 70%', accent: '280 80% 80%' }},
  { name: 'Bosque Neón', colors: { background: '180 30% 8%', foreground: '150 20% 95%', card: '180 30% 12%', primary: '130 90% 55%', accent: '300 90% 60%' }},
  { name: 'Océano Profundo', colors: { background: '220 50% 12%', foreground: '210 30% 95%', card: '220 50% 18%', primary: '200 100% 60%', accent: '180 90% 50%' }},
  { name: 'Café Caliente', colors: { background: '30 25% 15%', foreground: '30 10% 92%', card: '30 25% 20%', primary: '35 80% 60%', accent: '15 70% 55%' }},
  { name: 'Rojo Escarlata', colors: { background: '10 5% 8%', foreground: '10 5% 95%', card: '10 5% 12%', primary: '0 80% 55%', accent: '20 90% 60%' }},
  { name: 'Menta Fresca', colors: { background: '170 30% 10%', foreground: '170 15% 90%', card: '170 30% 15%', primary: '160 80% 60%', accent: '180 70% 55%' }},
  { name: 'Atardecer Neón', colors: { background: '270 25% 8%', foreground: '270 15% 90%', card: '270 25% 13%', primary: '310 90% 65%', accent: '50 100% 60%' }},
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to apply theme to CSS variables
const applyTheme = (theme: ColorTheme) => {
  if(typeof window === 'undefined') return;
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, isDemo } = useAuth();
  const [theme, setThemeState] = useState<ColorTheme>(defaultTheme);
  const [layoutConfig, setLayoutConfigState] = useState<LayoutConfig>(defaultLayout);
  const [isCustomizerOpen, setCustomizerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Load theme and layoutConfig from Firestore
  useEffect(() => {
    const loadPreferences = async () => {
      if (hasLoadedRef.current) return;
      
      if (!user?.uid) {
        // Si no hay usuario, cargar desde localStorage como fallback
        try {
          const savedTheme = localStorage.getItem('taskzenith-theme');
          if (savedTheme) {
            const parsedTheme = JSON.parse(savedTheme);
            setThemeState(parsedTheme);
            applyTheme(parsedTheme);
          } else {
            applyTheme(defaultTheme);
          }
          
          const savedLayout = localStorage.getItem('taskzenith-layout');
          if (savedLayout) {
            setLayoutConfigState(JSON.parse(savedLayout));
          }
        } catch (e) {
          console.error("Failed to parse preferences from localStorage", e);
          applyTheme(defaultTheme);
        }
        setIsLoading(false);
        return;
      }

      // En modo demo, usar solo localStorage
      if (isDemo) {
        applyTheme(defaultTheme);
        setIsLoading(false);
        return;
      }

      hasLoadedRef.current = true;
      
      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.theme) {
            setThemeState(data.theme);
            applyTheme(data.theme);
          } else {
            applyTheme(defaultTheme);
          }
          
          if (data.layoutConfig) {
            setLayoutConfigState(data.layoutConfig);
          }
        } else {
          applyTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        applyTheme(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Reset hasLoadedRef when user changes
  useEffect(() => {
    if (!user?.uid) {
      hasLoadedRef.current = false;
    }
  }, [user?.uid]);

  const setTheme = async (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Guardar en Firestore si hay usuario y no es demo
    if (user?.uid && !isDemo) {
      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        await setDoc(docRef, { theme: newTheme }, { merge: true });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    } else {
      // Fallback a localStorage si no hay usuario
      localStorage.setItem('taskzenith-theme', JSON.stringify(newTheme));
    }
  };
  
  const setLayoutConfig = async (newConfig: LayoutConfig) => {
    setLayoutConfigState(newConfig);
    
    // Guardar en Firestore si hay usuario y no es demo
    if (user?.uid && !isDemo) {
      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        await setDoc(docRef, { layoutConfig: newConfig }, { merge: true });
      } catch (error) {
        console.error('Error saving layout config:', error);
      }
    }
    
    // También guardar en localStorage como backup
    localStorage.setItem('taskzenith-layout', JSON.stringify(newConfig));
  }

  const resetToDefault = async () => {
    await setTheme(defaultTheme);
    await setLayoutConfig(defaultLayout);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, layoutConfig, setLayoutConfig, isCustomizerOpen, setCustomizerOpen, resetToDefault, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
