'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { TaskStatsCards } from '@/components/tasks/task-stats-cards';
import { DueTasksWidget } from '@/components/tasks/due-tasks-widget';
import { TodoList } from '@/components/tasks/todo-list';
import { PomodoroTimer } from '@/components/tasks/pomodoro-timer';
import { CalendarWidget } from '@/components/tasks/calendar-widget';
import { 
  RefreshCw, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Maximize2, 
  Settings2, 
  LayoutGrid
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Configuración del Grid Adaptativo
const GRID_COLS = 48; // Grid mucho más fino para mayor libertad de movimiento
const GAP_PX = 16; // Margen visual entre componentes

interface WidgetLayout {
  id: string;
  x: number; // columnas
  y: number; // píxeles
  width: number; // columnas
  height: number; // píxeles
}

interface WidgetConfig {
  component: React.ComponentType;
  title: string;
  description: string;
  defaultLayout: Omit<WidgetLayout, 'id'>;
  minW: number; // columnas mínimas
  minH: number; // píxeles mínimos
}

const WIDGETS: Record<string, WidgetConfig> = {
  stats: {
    component: TaskStatsCards,
    title: 'Estadísticas',
    description: 'Resumen de tareas y progreso',
    defaultLayout: { x: 0, y: 0, width: 48, height: 180 },
    minW: 16,
    minH: 140
  },
  todo: {
    component: TodoList,
    title: 'Lista de Tareas',
    description: 'Gestión principal de tareas',
    defaultLayout: { x: 0, y: 200, width: 28, height: 500 },
    minW: 12,
    minH: 300
  },
  due: {
    component: DueTasksWidget,
    title: 'Vencimientos',
    description: 'Tareas próximas a vencer',
    defaultLayout: { x: 28, y: 200, width: 20, height: 240 },
    minW: 10,
    minH: 200
  },
  pomodoro: {
    component: PomodoroTimer,
    title: 'Pomodoro',
    description: 'Temporizador de enfoque',
    defaultLayout: { x: 28, y: 460, width: 20, height: 240 },
    minW: 10,
    minH: 200
  },
  calendar: {
    component: CalendarWidget,
    title: 'Calendario',
    description: 'Vista mensual de actividades',
    defaultLayout: { x: 0, y: 720, width: 48, height: 420 },
    minW: 16,
    minH: 350
  }
};

const STORAGE_KEY = 'taskzenith-responsive-dashboard-v5';

// Detectar colisiones con buffer reducido para "snap" suave
function hasCollision(layout1: WidgetLayout, layout2: WidgetLayout, containerWidth: number): boolean {
  if (layout1.id === layout2.id) return false;

  const colWidth = containerWidth / GRID_COLS;
  
  // Convertir todo a píxeles
  const l1Left = layout1.x * colWidth;
  const l1Right = (layout1.x + layout1.width) * colWidth;
  const l1Top = layout1.y;
  const l1Bottom = layout1.y + layout1.height;
  
  const l2Left = layout2.x * colWidth;
  const l2Right = (layout2.x + layout2.width) * colWidth;
  const l2Top = layout2.y;
  const l2Bottom = layout2.y + layout2.height;
  
  const buffer = 2; // px de tolerancia
  
  return !(
    l1Right - buffer <= l2Left + buffer || 
    l2Right - buffer <= l1Left + buffer || 
    l1Bottom - buffer <= l2Top + buffer || 
    l2Bottom - buffer <= l1Top + buffer
  );
}

// Compactar verticalmente
function compactLayoutsVertically(layouts: WidgetLayout[], containerWidth: number): WidgetLayout[] {
  const sorted = [...layouts].sort((a, b) => a.y - b.y || a.x - b.x);
  const compacted: WidgetLayout[] = [];
  
  for (const layout of sorted) {
    let targetY = 0;
    let placed = false;
    
    // Intentar subir el widget lo más posible
    while (!placed && targetY < 10000) {
      const testLayout = { ...layout, y: targetY };
      const hasAnyCollision = compacted.some(existing => 
        hasCollision(testLayout, existing, containerWidth)
      );
      
      if (!hasAnyCollision) {
        compacted.push(testLayout);
        placed = true;
      } else {
        targetY += 20; // Saltos de escaneo
      }
    }
    
    if (!placed) compacted.push(layout);
  }
  
  return compacted;
}

export default function DashboardPage() {
  const { user } = useAuth(); // Used in header or for future use
  const { syncData, isSyncing } = useTasks();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSync = async () => {
    try {
      await syncData();
      toast({
        title: 'Sincronizado',
        duration: 2000,
        className: 'bg-primary text-primary-foreground',
      });
    } catch (error) {
        console.error(error);
      toast({ variant: 'destructive', title: 'Error de Sincronización' });
    }
  };
  
  const [mounted, setMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);
  const [containerWidth, setContainerWidth] = useState(1200);
  
  // Drag & Resize State
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, layoutX: 0, layoutY: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Responsive Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Init
  useEffect(() => {
    setMounted(true);
    const savedLayouts = localStorage.getItem(STORAGE_KEY);
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch {
        resetLayout();
      }
    } else {
      resetLayout();
    }
  }, []);

  // Save
  useEffect(() => {
    if (mounted && layouts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    }
  }, [layouts, mounted]);

  const resetLayout = () => {
    const defaultLayouts = Object.entries(WIDGETS).map(([id, config]) => ({
      id,
      ...config.defaultLayout
    }));
    setLayouts(defaultLayouts);
  };

  const handleToggleWidget = (widgetId: string, checked: boolean) => {
    if (checked) {
      // Add widget
      const config = WIDGETS[widgetId];
      // Buscar posición al final libre
      const currentStats = layouts.length > 0 ? 
        layouts.reduce((acc, l) => ({ y: Math.max(acc.y, l.y + l.height) }), { y: 0 }) 
        : { y: 0 };
      
      const newLayout = {
        id: widgetId,
        ...config.defaultLayout,
        y: currentStats.y + 20
      };
      
      setLayouts(prev => [...prev, newLayout]);
    } else {
      // Remove widget
      setLayouts(prev => prev.filter(l => l.id !== widgetId));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if (!isEditMode) return;
    if (e.button !== 0) return; // Only left click
    
    // Prevent dragging if clicking interactions inside header
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag')) return;

    e.preventDefault();
    const widget = layouts.find(l => l.id === widgetId);
    if (!widget) return;
    
    setDraggingWidget(widgetId);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      layoutX: widget.x,
      layoutY: widget.y
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const widget = layouts.find(l => l.id === widgetId);
    if (!widget) return;
    
    setResizingWidget(widgetId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: widget.width,
      height: widget.height
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingWidget && !resizingWidget) return;

    const colWidth = containerWidth / GRID_COLS;

    if (draggingWidget) {
      const widget = layouts.find(l => l.id === draggingWidget);
      if (!widget) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const cellsMovedX = Math.round(deltaX / colWidth);
      
      let newX = Math.max(0, Math.min(GRID_COLS - widget.width, dragStart.layoutX + cellsMovedX));
      // Permitir movimiento libre en Y (pixels)
      let newY = Math.max(0, dragStart.layoutY + deltaY); 
      
      // Snap suave a grid de 10px en Y para facilitar alineación
      newY = Math.round(newY / 10) * 10;
      
      const testLayout = { ...widget, x: newX, y: newY };
      
      // Actualizamos siempre la posición para permitir "pasar por encima" (libertad total)
      setLayouts(prev => prev.map(l => l.id === draggingWidget ? testLayout : l));
    }
    
    if (resizingWidget) {
      const widget = layouts.find(l => l.id === resizingWidget);
      if (!widget) return;
      
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const cellsChangedX = Math.round(deltaX / colWidth);
      
      const config = WIDGETS[resizingWidget];
      const newWidth = Math.max(
        config.minW,
        Math.min(GRID_COLS - widget.x, resizeStart.width + cellsChangedX)
      );
      // Altura libre en pixeles
      let newHeight = Math.max(config.minH, resizeStart.height + deltaY);
      newHeight = Math.round(newHeight / 10) * 10; // Snap vertical
      
      const testLayout = { ...widget, width: newWidth, height: newHeight };
      
      // Permitimos redimensionar libremente incluso si se solapa
      setLayouts(prev => prev.map(l => l.id === resizingWidget ? testLayout : l));
    }
  }, [draggingWidget, resizingWidget, dragStart, resizeStart, layouts, containerWidth]);

  const handleMouseUp = useCallback(() => {
    setDraggingWidget(null);
    setResizingWidget(null);
  }, []);

  useEffect(() => {
    if (draggingWidget || resizingWidget) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingWidget, resizingWidget, handleMouseMove, handleMouseUp]);

  // Cálculo de altura total
  const renderHeight = layouts.reduce((max, l) => Math.max(max, l.y + l.height), 800) + 100;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 md:p-6 min-h-screen flex flex-col">
      {/* Header flotante de controles */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md pb-4 pt-2 mb-2 border-b">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mi Espacio</h2>
            <p className="text-sm text-muted-foreground">
              Hola {user?.displayName?.split(' ')[0] || 'Usuario'}, edita y organiza tu tablero libremente
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={isEditMode ? "animate-pulse border-primary" : ""}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Widgets
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Configurar Widgets</h4>
                    <p className="text-sm text-muted-foreground">
                      Activa o desactiva elementos del tablero
                    </p>
                  </div>
                  <Separator />
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="grid gap-4">
                      {Object.entries(WIDGETS).map(([id, config]) => {
                        const isActive = layouts.some(l => l.id === id);
                        return (
                          <div key={id} className="flex items-start space-x-3 space-y-0">
                            <Checkbox 
                              id={`widget-${id}`} 
                              checked={isActive}
                              onCheckedChange={(c) => handleToggleWidget(id, c as boolean)}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Label
                                htmlFor={`widget-${id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {config.title}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {config.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={isEditMode ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="min-w-[100px]"
            >
              {isEditMode ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
              {isEditMode ? 'Guardar' : 'Editar'}
            </Button>
            
            {isEditMode && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setLayouts(compactLayoutsVertically(layouts, containerWidth))} title="Auto-ordenar">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={resetLayout} title="Resetear">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Canvas */}
      <div 
        ref={containerRef}
        className={cn(
          "relative flex-1 rounded-xl transition-colors duration-300",
          isEditMode && "bg-secondary/20 ring-1 ring-border border-dashed border-2 border-primary/10"
        )}
        style={{ minHeight: `${renderHeight}px` }}
      >
        {layouts.map((layout) => {
          const config = WIDGETS[layout.id];
          if (!config) return null;
          const Component = config.component;
          
          const isDragging = draggingWidget === layout.id;
          const isResizing = resizingWidget === layout.id; // Corrected resizing state logic
          
          return (
            <div
              key={layout.id}
              className={cn(
                "absolute transition-all duration-200 ease-out p-2", // p-2 añade el Gap Visual
                isDragging && "z-50 duration-75 ease-linear cursor-grabbing scale-[1.01]",
                isResizing && "z-50 duration-75 ease-linear",
                !isDragging && !isResizing && "z-10"
              )}
              style={{
                left: `${(layout.x / GRID_COLS) * 100}%`,
                top: `${layout.y}px`,
                width: `${(layout.width / GRID_COLS) * 100}%`,
                height: `${layout.height}px`,
              }}
            >
              <Card className={cn(
                "h-full w-full overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow dark:bg-card border-border/60",
                isEditMode && "ring-2 ring-primary/10 cursor-default"
              )}>
                {/* Drag Handle - Solo visible en modo edición */}
                {isEditMode && (
                  <div 
                    className={cn(
                      "h-8 bg-secondary/50 border-b flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none hover:bg-secondary/80 transition-colors",
                      isDragging && "bg-primary/20 cursor-grabbing"
                    )}
                    onMouseDown={(e) => handleMouseDown(e, layout.id)}
                  >
                    <div className="flex items-center gap-2">
                       <Settings2 className="h-3 w-3 text-muted-foreground" />
                       <span className="text-xs font-semibold text-foreground/80">{config.title}</span>
                    </div>
                  </div>
                )}
                
                <div className={cn("flex-1 overflow-hidden", isEditMode && "pointer-events-none opacity-90")}>
                  <div className="h-full w-full overflow-auto custom-scrollbar">
                    <Component />
                  </div>
                </div>

                {/* Resize Handle */}
                {isEditMode && (
                  <div
                    className="absolute bottom-1 right-1 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-20 group"
                    onMouseDown={(e) => handleResizeMouseDown(e, layout.id)}
                  >
                     <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  </div>
                )}
              </Card>
            </div>
          );
        })}
        
        {layouts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-muted-foreground opacity-50">
            <LayoutGrid className="h-16 w-16 mb-4" />
            <p>Tu tablero está vacío</p>
            <Button variant="link" onClick={() => setIsEditMode(true)}>Agrega widgets desde el menú</Button>
          </div>
        )}
      </div>
    </div>
  );
}
