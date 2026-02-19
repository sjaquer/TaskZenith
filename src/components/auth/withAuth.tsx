'use client';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SplashScreen } from '@/components/layout/splash-screen';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const { user, loading, isDemo } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user && !isDemo) {
        router.replace('/login');
      }
    }, [user, loading, isDemo, router]);

    if (loading || (!user && !isDemo)) {
      return <SplashScreen />;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
