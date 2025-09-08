'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ColorTheme = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  accent: string;
};

type LayoutConfig = {
    showStats: boolean;
    showDailyFocus: boolean;
    showDailyTasks: boolean;
    showTodoList: boolean;
    showKanban: boolean;
    showHistory: boolean;
    enableDueDates: boolean;
    showPriorityTasks: boolean;
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
    showDailyFocus: true,
    showDailyTasks: true,
    showTodoList: true,
    showKanban: true,
    showHistory: true,
    enableDueDates: true,
    showPriorityTasks: true,
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
  const [theme, setThemeState] = useState<ColorTheme>(defaultTheme);
  const [layoutConfig, setLayoutConfigState] = useState<LayoutConfig>(defaultLayout);
  const [isCustomizerOpen, setCustomizerOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('taskzenith-theme');
    const savedLayout = localStorage.getItem('taskzenith-layout');
    
    let initialTheme = defaultTheme;
    if (savedTheme) {
      try {
        initialTheme = JSON.parse(savedTheme);
      } catch (e) {
        console.error("Failed to parse theme from localStorage", e);
      }
    }
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        // Ensure all keys are present, falling back to default if not
        const mergedLayout = { ...defaultLayout, ...parsedLayout };
        setLayoutConfigState(mergedLayout);
      } catch(e) {
        console.error("Failed to parse layout from localStorage", e);
        setLayoutConfigState(defaultLayout);
      }
    } else {
      setLayoutConfigState(defaultLayout);
    }
  }, []);

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('taskzenith-theme', JSON.stringify(newTheme));
    applyTheme(newTheme);
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
