import type { Metadata } from 'next';
import './globals.css';
import { TaskProvider } from '@/contexts/task-context';
import { Toaster } from '@/components/ui/toaster';
import { Poppins } from 'next/font/google';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'] 
});

export const metadata: Metadata = {
  title: 'TaskZenith',
  description: 'Gestiona tus tareas con calma y concentración.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="httpshttps://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${poppins.className} antialiased overflow-x-hidden`}>
        <ThemeProvider>
          <AuthProvider>
            <TaskProvider>
                {children}
                <Toaster />
            </TaskProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
