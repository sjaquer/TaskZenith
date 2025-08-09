'use client';

import Image from 'next/image';

export function SplashScreen() {
  return (
    <div className="splash-screen fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="w-24 h-24 relative">
        <Image
          src="/logo.png"
          alt="TaskZenith Logo"
          layout="fill"
          objectFit="contain"
          unoptimized
        />
      </div>
    </div>
  );
}
