'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/lib/types';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load from local storage on mount (mock persistence)
  useEffect(() => {
     if (!user) return;
     const stored = localStorage.getItem(`notifications_${user.uid}`);
     if (stored) {
         setNotifications(JSON.parse(stored));
     }
  }, [user]);

  useEffect(() => {
      if(user) {
          localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));
      }
  }, [notifications, user]);

  const addNotification = (notifData: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => {
    if (!user) return;
    
    const newNotification: Notification = {
        ...notifData,
        id: Math.random().toString(36).substring(7),
        createdAt: Date.now(),
        read: false,
        userId: user.uid,
    };
    
    setNotifications(prev => [newNotification, ...prev]);

    // Show toast popup
    toast({
        title: newNotification.title,
        description: newNotification.message,
        className: "top-0 right-0 fixed md:max-w-[420px] md:top-4 md:right-4",
    });
  };

  const markAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
      setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
