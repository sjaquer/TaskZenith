import type { Metadata } from 'next';
import './globals.css';
import { TaskProvider } from '@/contexts/task-context';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskZenith',
  description: 'Gestiona tus tareas con calma y concentración.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <TaskProvider>
          {children}
          <Toaster />
        </TaskProvider>
      </body>
    </html>
  );
}
