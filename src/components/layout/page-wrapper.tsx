'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SplashScreen } from './splash-screen';
import { useAuth } from '@/contexts/auth-context';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Only show splash screen on the welcome page
    if (pathname !== '/') {
      setShowSplash(false);
      return;
    }
    
    // Check if we've shown the splash screen before in this session
    const hasLoaded = sessionStorage.getItem('hasLoaded');
    if (hasLoaded) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hasLoaded', 'true');
      }, 2500); // Wait for animation to complete

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (showSplash || authLoading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
