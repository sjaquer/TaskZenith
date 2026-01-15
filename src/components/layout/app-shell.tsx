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
  CalendarDays,
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { useTheme } from '@/contexts/theme-context';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Image from 'next/image';

const menuItems = [
    {href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/dashboard/todo', label: 'Tareas', icon: ListTodo},
    {href: '/dashboard/kanban', label: 'Tablero', icon: KanbanSquare},
    {href: '/dashboard/schedule', label: 'Agenda', icon: CalendarDays },
    {href: '/dashboard/history', label: 'Historial', icon: History},
];

function BottomNavBar() {
    const pathname = usePathname();
    const { layoutConfig } = useTheme();

    // Filter items based on configuration
    const filteredItems = menuItems.filter(item => {
        if (item.label === 'Tablero' && !layoutConfig.showKanban) return false;
        if (item.label === 'Historial' && !layoutConfig.showHistory) return false;
        return true;
    });

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50">
            {filteredItems.map((item) => (
                <Link href={item.href} key={item.href} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-16", pathname === item.href ? 'text-primary' : 'text-muted-foreground hover:bg-secondary/80')}>
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}

import { useChat } from '@/contexts/chat-context';
import { useNotifications } from '@/contexts/notification-context';
import { Bell, MessageSquare } from 'lucide-react';

function NotificationButton() {
    const { unreadCount, addNotification } = useNotifications();
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="relative" 
            onClick={() => addNotification({title: "Sin notificaciones nuevas", message: "No tienes notificaciones pendientes.", type: 'alert'})}
        >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />}
        </Button>
    )
}

function ChatButton() {
    const { setIsOpen, isOpen } = useChat();
    return (
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className={isOpen ? 'bg-secondary' : ''}>
            <MessageSquare className="w-5 h-5" />
        </Button>
    )
}

function MainHeader() {
    const { user, logout, role } = useAuth();
    const { clearLocalData } = useTasks();
    const router = useRouter();
    const { setOpen: setSidebarOpen } = useSidebar();

    const handleLogout = async () => {
        await logout();
        clearLocalData();
        router.push('/login');
    };

    const roleName = role === 'admin' ? 'Administrador' : 'Operador';

    return (
        <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-3">
                 <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="h-8 w-8 relative flex-shrink-0">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <h1 className="text-xl font-bold font-headline">TaskZenith <span className="text-xs font-normal text-muted-foreground ml-2 hidden sm:inline-block">Corporate</span></h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <NotificationButton />
                <ChatButton />
                <div className="hidden sm:flex flex-col items-end">
                     <span className="text-sm font-semibold">{user?.displayName || 'Usuario'}</span>
                     <span className="text-xs text-muted-foreground uppercase">{roleName}</span>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden">
                             {user?.photoURL ? (
                                <Image src={user.photoURL} alt="Profile" fill className="object-cover" />
                             ) : (
                                <UserCircle className="w-10 h-10 text-muted-foreground" />
                             )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.displayName || 'Usuario'}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

import {
  MoreVertical,
  Settings,
} from 'lucide-react';

function DesktopSidebar() {
    const pathname = usePathname();
    const { layoutConfig } = useTheme();

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 shadow-sm z-30 transition-all duration-300 ease-in-out">
            <div className="p-6 flex items-center gap-3 border-b border-border/40">
                <div className="h-8 w-8 relative flex-shrink-0">
                     <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-none font-headline tracking-tight">TaskZenith</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Corporate</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Menu Principal
                </div>
                {menuItems.map(item => {
                    if (item.label === 'Tablero' && !layoutConfig.showKanban) return null;
                    if (item.label === 'Historial' && !layoutConfig.showHistory) return null;
                    
                    const isActive = pathname === item.href;

                    return (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                                isActive 
                                    ? "bg-primary text-primary-foreground shadow-md" 
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="mt-8 px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gestión
                </div>
                {/* Mock Projects Links */}
                 <Link 
                    href="/dashboard/kanban" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 group"
                >
                    <span className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    Marketing Q1
                </Link>
                 <Link 
                    href="/dashboard/kanban" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 group"
                >
                    <span className="w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                    Desarrollo Web
                </Link>
            </div>

            <div className="p-4 border-t border-border/40 bg-card/50">
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-secondary">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Configuración</span>
                </Button>
            </div>
        </aside>
    )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        {/* Mobile Sidebar (Sheet) */}
        <Sidebar className="md:hidden" />
        <div className="flex min-h-screen w-full bg-background">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <MainHeader />
                <div className="flex-1 overflow-auto pb-20 md:pb-0">
                    {children}
                </div>
                <BottomNavBar />
            </div>
        </div>
    </SidebarProvider>
  );
}
