
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    showPomodoro: boolean;
    widgetOrder: string[]; // Array of widget keys
}

type PredefinedTheme = {
  name: string;
  colors: ColorTheme;
};

interface ThemeContextType {
  theme: ColorTheme;
  layoutConfig: LayoutConfig;
  isCustomizerOpen: boolean;
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
    showPomodoro: true,
    widgetOrder: ['stats', 'pomodoro', 'due', 'calendar', 'todo'],
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
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ColorTheme>(defaultTheme);
  const [layoutConfig, setLayoutConfigState] = useState<LayoutConfig>(defaultLayout);
  const [isCustomizerOpen, setCustomizerOpen] = useState(false);

  // Load theme from Firestore
  useEffect(() => {
    const loadTheme = async () => {
      if (!user?.uid) {
        // Si no hay usuario, cargar desde localStorage como fallback
        const savedTheme = localStorage.getItem('taskzenith-theme');
        if (savedTheme) {
          try {
            const parsedTheme = JSON.parse(savedTheme);
            setThemeState(parsedTheme);
            applyTheme(parsedTheme);
          } catch (e) {
            console.error("Failed to parse theme from localStorage", e);
          }
        } else {
          applyTheme(defaultTheme);
        }
        return;
      }

      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().theme) {
          const loadedTheme = docSnap.data().theme;
          setThemeState(loadedTheme);
          applyTheme(loadedTheme);
        } else {
          applyTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        applyTheme(defaultTheme);
      }
    };

    loadTheme();
  }, [user?.uid]);

  const setTheme = async (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Guardar en Firestore si hay usuario
    if (user?.uid) {
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
  
  const setLayoutConfig = (newConfig: LayoutConfig) => {
    setLayoutConfigState(newConfig);
    localStorage.setItem('taskzenith-layout', JSON.stringify(newConfig));
  }

  const resetToDefault = () => {
    setTheme(defaultTheme);
    setLayoutConfig(defaultLayout);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, layoutConfig, setLayoutConfig, isCustomizerOpen, setCustomizerOpen, resetToDefault }}>
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
