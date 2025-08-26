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
    showDailyTasks: boolean;
    showTodoList: boolean;
    showKanban: boolean;
    showHistory: boolean;
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
    showDailyTasks: true,
    showTodoList: true,
    showKanban: true,
    showHistory: true,
};

export const predefinedThemes: PredefinedTheme[] = [
  { name: 'Default Dark', colors: defaultTheme },
  { name: 'Lavanda Suave', colors: { background: '250 30% 15%', foreground: '250 10% 90%', card: '250 30% 20%', primary: '250 60% 70%', accent: '280 80% 80%' }},
  { name: 'Bosque Neón', colors: { background: '180 30% 8%', foreground: '150 20% 95%', card: '180 30% 12%', primary: '130 90% 55%', accent: '300 90% 60%' }},
  { name: 'Océano Profundo', colors: { background: '220 50% 12%', foreground: '210 30% 95%', card: '220 50% 18%', primary: '200 100% 60%', accent: '180 90% 50%' }},
  { name: 'Café Caliente', colors: { background: '30 25% 15%', foreground: '30 10% 92%', card: '30 25% 20%', primary: '35 80% 60%', accent: '15 70% 55%' }}
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to apply theme to CSS variables
const applyTheme = (theme: ColorTheme) => {
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
    // Load theme from localStorage on initial render
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
