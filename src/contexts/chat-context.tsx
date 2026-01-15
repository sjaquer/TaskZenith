'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { useAuth } from './auth-context';
import { useNotifications } from './notification-context';

interface ChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (content: string, channelId?: string) => void;
  channels: { id: string, name: string }[];
  activeChannel: string;
  setActiveChannel: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState('general');
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Mock channels
  const channels = [
      { id: 'general', name: 'General' },
      { id: 'development', name: 'Desarrollo' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'management', name: 'Gerencia' }
  ];

  useEffect(() => {
    // Load local messages
    const stored = localStorage.getItem('chat_messages');
    if (stored) {
        setMessages(JSON.parse(stored));
    } else {
        // Initial welcome message
        setMessages([{
            id: 'welcome',
            senderId: 'system',
            senderName: 'System',
            content: '¡Bienvenido al chat del equipo! Aquí puedes comunicarte con tus compañeros.',
            channelId: 'general',
            createdAt: Date.now()
        }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = (content: string, channelId: string = activeChannel) => {
    if (!user) return;

    const newMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        senderId: user.uid,
        senderName: user.displayName || 'Usuario',
        senderAvatar: user.photoURL || undefined,
        content,
        channelId,
        createdAt: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate response from "Other" to demo notifications
    if (content.toLowerCase().includes('hola')) {
        setTimeout(() => {
            const reply: ChatMessage = {
                id: Math.random().toString(36).substring(7),
                senderId: 'bot',
                senderName: 'TaskBot',
                content: `Hola ${user.displayName}! ¿En qué puedo ayudarte?`,
                channelId,
                createdAt: Date.now()
            };
            setMessages(prev => [...prev, reply]);
            addNotification({
                type: 'message',
                title: 'Nuevo mensaje de TaskBot',
                message: reply.content,
                link: '#chat'
            });
        }, 1000);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, isOpen, setIsOpen, sendMessage, channels, activeChannel, setActiveChannel }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
