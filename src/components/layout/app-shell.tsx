'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ListTodo,
  KanbanSquare,
  History,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { useTasks } from '@/contexts/task-context';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/todo', label: 'To-Do List', icon: ListTodo },
  { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
  { href: '/history', label: 'History', icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { syncData, isSyncing } = useTasks();
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      await syncData();
      toast({
        title: '¡Sincronizado!',
        description: 'Tus datos están actualizados.',
        className: 'bg-primary text-primary-foreground',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de Sincronización',
        description: 'No se pudieron obtener los datos más recientes.',
      });
    }
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
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="my-2" />
          <div className="p-4 flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="profile picture" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">User</span>
              <span className="text-xs text-muted-foreground">user@taskzenith.com</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <Button onClick={handleSync} disabled={isSyncing} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
