'use client';

import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva} from 'class-variance-authority';
import {
  History,
  KanbanSquare,
  LayoutDashboard,
  ListTodo,
} from 'lucide-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

import {useIsMobile} from '@/hooks/use-mobile';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import Image from 'next/image';

type SidebarContext = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(
  (
    {className, style, children, ...props},
    ref
  ) => {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);
    
    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        isMobile,
      }),
      [open, setOpen, isMobile]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
          <div
            className={cn('group/sidebar-wrapper', className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

const menuItems = [
  {href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/dashboard/todo', label: 'To-Do List', icon: ListTodo},
  {href: '/dashboard/kanban', label: 'Kanban Board', icon: KanbanSquare},
  {href: '/dashboard/history', label: 'History', icon: History},
];

const SidebarMenuContent = () => {
  const pathname = usePathname();
  const { setOpen } = useSidebar();

  const handleLinkClick = () => {
      setOpen(false);
  }

  return (
    <SidebarContent>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              onClick={handleLinkClick}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
};

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    const {open, setOpen} = useSidebar();
    const childrenArray = React.Children.toArray(children);
    const header = childrenArray.find(
      (child) => (child as React.ReactElement).type === SidebarHeader
    );
    const footer = childrenArray.find(
      (child) => (child as React.ReactElement).type === SidebarFooter
    );
    
    return (
      <Sheet open={open} onOpenChange={setOpen} {...props}>
        <SheetContent
          ref={ref}
          className={cn("hidden md:flex w-3/4 md:w-auto md:max-w-xs bg-card p-0 text-foreground", className)}
          side="left"
        >
          <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          <div className="flex h-full w-full flex-col">
            <SheetHeader className="p-4 border-b">
                {header}
            </SheetHeader>
            <SidebarMenuContent />
            {footer}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);
Sidebar.displayName = 'Sidebar';


const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({className, ...props}, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({className, ...props}, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn('flex flex-col mt-auto p-4 border-t', className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';


const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({className, ...props}, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2',
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({className, ...props}, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({className, ...props}, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn('group/menu-item relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md p-3 text-left text-base outline-none ring-primary transition-colors hover:bg-secondary focus-visible:ring-2 active:bg-secondary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {},
    defaultVariants: {},
  }
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    asChild?: boolean;
    isActive?: boolean;
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants(), 'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium', className)}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
};
