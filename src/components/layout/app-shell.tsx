'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ListTodo,
  KanbanSquare,
  History,
  Bot,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';


const menuItems = [
    {href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/dashboard/todo', label: 'To-Do', icon: ListTodo},
    {href: '/dashboard/kanban', label: 'Kanban', icon: KanbanSquare},
    {href: '/dashboard/history', label: 'Historial', icon: History},
];

function BottomNavBar() {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50">
            {menuItems.map((item) => (
                <Link href={item.href} key={item.href} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-16", pathname === item.href ? 'text-primary' : 'text-muted-foreground hover:bg-secondary/80')}>
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}

function MobileHeader() {
    const { toggleSidebar } = useSidebar();
    return (
        <header className="flex md:hidden items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
                <Bot className="w-7 h-7 text-accent" />
                <h1 className="text-lg font-semibold font-headline">TaskZenith</h1>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
            >
                <PanelLeft className="w-6 h-6" />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </header>
    );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { clearLocalData } = useTasks();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    clearLocalData();
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-semibold font-headline">TaskZenith</h1>
          </div>
        </SidebarHeader>
        <SidebarContent />
        <SidebarFooter>
          <Separator className="my-2" />
          <div className="p-4 flex items-center justify-between">
            <div className='flex items-center gap-3 overflow-hidden'>
              <Avatar>
                <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt={user?.displayName || 'User'} data-ai-hint="profile picture" />
                <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm truncate">{user?.displayName || 'Usuario'}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar Sesión" className="flex-shrink-0">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <MobileHeader />
        <div className="pb-16 md:pb-0 flex-1">
            {children}
        </div>
        <BottomNavBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
