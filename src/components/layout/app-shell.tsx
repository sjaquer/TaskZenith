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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ListTodo,
  KanbanSquare,
  History,
  LogOut,
  UserCircle,
  Newspaper,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Image from 'next/image';
import { PatchNotesDialog } from './patch-notes';

const menuItems = [
    {href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/dashboard/todo', label: 'To-Do', icon: ListTodo},
    {href: '/dashboard/kanban', label: 'Kanban', icon: KanbanSquare},
    {href: '/dashboard/history', label: 'Historial', icon: History},
];

function BottomNavBar() {
    const pathname = usePathname();
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50">
            {menuItems.map((item) => (
                <Link href={item.href} key={item.href} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-16", pathname === item.href ? 'text-primary' : 'text-muted-foreground hover:bg-secondary/80')}>
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}

function MainHeader() {
    const { user, logout } = useAuth();
    const { clearLocalData } = useTasks();
    const router = useRouter();
    const { setOpen: setSidebarOpen } = useSidebar();

    const handleLogout = async () => {
        await logout();
        clearLocalData();
        router.push('/login');
    };

    return (
        <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-3">
                <Image src="/logo.png" alt="TaskZenith Logo" width={32} height={32} />
                <h1 className="text-xl font-semibold font-headline hidden md:block">TaskZenith</h1>
            </button>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <p className="hidden sm:block">Hola,</p>
                    <p>{user?.displayName || 'Usuario'}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                           <UserCircle className="h-8 w-8" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <PatchNotesDialog />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <MainHeader />
        <div className="flex flex-1">
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="TaskZenith Logo" width={32} height={32} />
                        <h1 className="text-xl font-semibold font-headline">TaskZenith</h1>
                    </div>
                </SidebarHeader>
            </Sidebar>
            <main className="flex-1 pb-16 md:pb-0">
                {children}
            </main>
        </div>
        <BottomNavBar />
      </div>
    </SidebarProvider>
  );
}
