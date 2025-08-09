'use client';

import { useState, useEffect } from 'react';
import { SplashScreen } from './splash-screen';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we've shown the splash screen before in this session
    const hasLoaded = sessionStorage.getItem('hasLoaded');
    if (hasLoaded) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem('hasLoaded', 'true');
      }, 2500); // Wait for animation to complete

      return () => clearTimeout(timer);
    }
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
