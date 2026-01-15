'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/chat-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

export function ChatWidget() {
    const { isOpen, setIsOpen, messages, sendMessage, channels, activeChannel, setActiveChannel } = useChat();
    const { user } = useAuth();
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter messages for active channel
    const channelMessages = messages.filter(m => m.channelId === activeChannel);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [channelMessages, isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-card border shadow-xl rounded-xl flex flex-col z-[100] h-[500px] animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* Header */}
            <div className="p-3 border-b flex justify-between items-center bg-primary text-primary-foreground rounded-t-xl">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Chat de Equipo</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Channels */}
            <div className="flex gap-1 p-2 bg-secondary/50 overflow-x-auto">
                {channels.map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={cn(
                            "text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors",
                            activeChannel === channel.id 
                                ? "bg-primary text-primary-foreground font-medium" 
                                : "bg-background text-muted-foreground hover:bg-background/80"
                        )}
                    >
                        #{channel.name}
                    </button>
                ))}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {channelMessages.map((msg) => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                            <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={msg.senderAvatar} />
                                    <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "rounded-lg p-2 max-w-[80%] text-sm",
                                    isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    {!isMe && <p className="text-[10px] opacity-70 mb-0.5">{msg.senderName}</p>}
                                    <p>{msg.content}</p>
                                    <span className="text-[9px] opacity-50 block text-right mt-1">
                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-background rounded-b-xl flex gap-2">
                <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 h-9 text-sm"
                />
                <Button size="icon" className="h-9 w-9" onClick={handleSend}>
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
