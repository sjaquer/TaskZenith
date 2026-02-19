
import type { Metadata, Viewport } from 'next';
import './globals.css';
import './grid-layout.css';
import { TaskProvider } from '@/contexts/task-context';
import { Toaster } from '@/components/ui/toaster';
import { Poppins } from 'next/font/google';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';

import { NotificationProvider } from '@/contexts/notification-context';
import { ChatProvider } from '@/contexts/chat-context';
import { ChatWidget } from '@/components/chat/chat-widget';
import { GroupProvider } from '@/contexts/group-context';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'] 
});

export const metadata: Metadata = {
  title: 'TaskZenith - Gestión Corporativa de Tareas',
  description: 'Plataforma avanzada de gestión de tareas corporativas con dashboard personalizable, sincronización en la nube, múltiples vistas (Kanban, Todo, Calendario) y temas personalizables. Optimizada para equipos que necesitan colaboración en tiempo real.',
  keywords: [
    'gestión de tareas corporativas',
    'dashboard personalizable',
    'kanban board',
    'sincronización en la nube',
    'productividad empresarial',
    'gestión de proyectos',
    'firebase real-time',
    'workspace colaborativo',
    'task management',
    'team productivity'
  ],
  authors: [{ name: 'Sebastián Jaque', url: 'https://github.com/sjaquer' }],
  creator: 'Sebastián Jaque',
  publisher: 'TaskZenith',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://taskzenith.app',
    title: 'TaskZenith - Gestión Corporativa de Tareas',
    description: 'Dashboard personalizable con sincronización en la nube para gestión de tareas empresariales',
    siteName: 'TaskZenith',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskZenith - Gestión Corporativa de Tareas',
    description: 'Dashboard personalizable con sincronización en la nube',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' }
  ],
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
      <body className={`${poppins.className} antialiased overflow-x-hidden`}>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <ChatProvider>
                <GroupProvider>
                  <TaskProvider>
                      {children}
                      <ChatWidget />
                      <Toaster />
                  </TaskProvider>
                </GroupProvider>
              </ChatProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
