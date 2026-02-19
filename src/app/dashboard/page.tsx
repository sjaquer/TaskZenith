'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { TaskStatsCards } from '@/components/tasks/task-stats-cards';
import { DueTasksWidget } from '@/components/tasks/due-tasks-widget';
import { TodoList } from '@/components/tasks/todo-list';
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
import { useTheme, predefinedThemes } from '@/contexts/theme-context';
import { Palette, Monitor } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { user } = useAuth();
  const { syncData, isSyncing } = useTasks();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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

  // Init - Load from Firestore or fallback to default
  useEffect(() => {
    setMounted(true);
    const loadLayouts = async () => {
      if (!user?.uid) {
        resetLayout();
        return;
      }
      
      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().dashboardLayouts) {
          setLayouts(docSnap.data().dashboardLayouts);
        } else {
          resetLayout();
        }
      } catch (error) {
        console.error('Error loading dashboard layouts:', error);
        resetLayout();
      }
    };
    
    loadLayouts();
  }, [user?.uid]);

  // Save to Firestore
  useEffect(() => {
    if (mounted && layouts.length > 0 && user?.uid) {
      const saveLayouts = async () => {
        try {
          const docRef = doc(db, 'userPreferences', user.uid);
          await setDoc(docRef, { dashboardLayouts: layouts }, { merge: true });
        } catch (error) {
          console.error('Error saving dashboard layouts:', error);
        }
      };
      
      // Debounce para no guardar en cada pequeño cambio
      const timeoutId = setTimeout(saveLayouts, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [layouts, mounted, user?.uid]);

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Mi Espacio</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Hola {user?.displayName?.split(' ')[0] || 'Usuario'}{!isMobile && ', edita y organiza tu tablero libremente'}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {/* Panel de Configuración Completo */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Configuración</span>
                  <span className="sm:hidden">Config.</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Personalización del Espacio
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configura widgets, temas y apariencia
                    </p>
                  </div>
                  <Separator />
                  
                  {/* Sección de Temas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <h5 className="text-sm font-semibold">Paleta de Colores</h5>
                    </div>
                    <ScrollArea className="h-[180px] pr-3">
                      <div className="grid gap-2">
                        {predefinedThemes.map((themeOption, idx) => (
                          <button
                            key={idx}
                            onClick={() => setTheme(themeOption.colors)}
                            className={`
                              w-full p-3 rounded-lg border-2 transition-all text-left hover:scale-[1.02]
                              ${JSON.stringify(theme) === JSON.stringify(themeOption.colors)
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : 'border-border hover:border-primary/50 bg-secondary/20'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{themeOption.name}</span>
                              <div className="flex gap-1">
                                {[themeOption.colors.primary, themeOption.colors.accent, themeOption.colors.card].map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: `hsl(${color})` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <Separator />
                  
                  {/* Sección de Widgets */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      <h5 className="text-sm font-semibold">Widgets Activos</h5>
                    </div>
                    <ScrollArea className="h-[140px] pr-3">
                      <div className="grid gap-3">
                        {Object.entries(WIDGETS).map(([id, config]) => {
                          const isActive = layouts.some(l => l.id === id);
                          return (
                            <div key={id} className="flex items-start space-x-3">
                              <Checkbox 
                                id={`widget-${id}`} 
                                checked={isActive}
                                onCheckedChange={(c) => handleToggleWidget(id, c as boolean)}
                              />
                              <div className="grid gap-1 leading-none flex-1">
                                <Label
                                  htmlFor={`widget-${id}`}
                                  className="text-sm font-medium cursor-pointer"
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
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={isEditMode ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="min-w-[100px] hidden md:inline-flex"
            >
              {isEditMode ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
              {isEditMode ? 'Guardar' : 'Editar'}
            </Button>
            
            {isEditMode && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setLayouts(compactLayoutsVertically(layouts, containerWidth))} title="Auto-ordenar" className="hidden md:inline-flex">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={resetLayout} title="Resetear" className="hidden md:inline-flex">
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

      {/* Mobile Layout - Simple stacked view */}
      {isMobile ? (
        <div className="flex flex-col gap-4 mt-2">
          {layouts.length === 0 ? (
            <div className="flex items-center justify-center flex-col text-muted-foreground opacity-50 py-20">
              <LayoutGrid className="h-16 w-16 mb-4" />
              <p>Tu tablero está vacío</p>
            </div>
          ) : (
            layouts
              .sort((a, b) => {
                const order = ['stats', 'todo', 'due', 'calendar'];
                return order.indexOf(a.id) - order.indexOf(b.id);
              })
              .map((layout) => {
                const config = WIDGETS[layout.id];
                if (!config) return null;
                const Component = config.component;
                return (
                  <Card key={layout.id} className="overflow-hidden shadow-sm border-border/60">
                    <div className="overflow-auto">
                      <Component />
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      ) : (
      /* Desktop Layout - Absolute positioned grid */
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
      )}
    </div>
  );
}
