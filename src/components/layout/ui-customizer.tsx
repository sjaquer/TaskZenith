'use client';

import { useTheme, predefinedThemes } from '@/contexts/theme-context';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Paintbrush, RotateCcw, LayoutTemplate, CalendarClock, AlertOctagon, UserCircle, Whale, Crab, Fish, Bird, Turtle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { useAuth } from '@/contexts/auth-context';
import type { ProfileIcon } from '@/lib/types';
import { cn } from '@/lib/utils';

function HSLToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
  
function hexToHSL(hex: string): { h: number, s: number, l: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const layoutOptions: { key: keyof ReturnType<typeof useTheme>['layoutConfig']; label: string, icon: React.ElementType }[] = [
    { key: 'showStats', label: 'Tarjetas de Estadísticas', icon: LayoutTemplate },
    { key: 'showDailyTasks', label: 'Tareas Diarias', icon: LayoutTemplate },
    { key: 'showTodoList', label: 'Lista de Tareas Principal', icon: LayoutTemplate },
    { key: 'showKanban', label: 'Tablero Kanban', icon: LayoutTemplate },
    { key: 'showHistory', label: 'Historial de Tareas', icon: LayoutTemplate },
    { key: 'enableDueDates', label: 'Habilitar Fechas de Vencimiento', icon: CalendarClock },
    { key: 'showPriorityTasks', label: 'Mostrar Tareas Prioritarias', icon: AlertOctagon },
];

const profileIcons: { name: ProfileIcon; icon: React.ElementType, label: string }[] = [
    { name: 'user', icon: UserCircle, label: 'Usuario' },
    { name: 'whale', icon: Whale, label: 'Ballena' },
    { name: 'crab', icon: Crab, label: 'Cangrejo' },
    { name: 'fish', icon: Fish, label: 'Pez' },
    { name: 'bird', icon: Bird, label: 'Pájaro' },
    { name: 'turtle', icon: Turtle, label: 'Tortuga' },
];

export function UICustomizer() {
  const { theme, setTheme, isCustomizerOpen, setCustomizerOpen, resetToDefault, layoutConfig, setLayoutConfig } = useTheme();
  const { userProfile, updateUserProfile } = useAuth();

  const handleColorChange = (key: keyof typeof theme, value: string) => {
    const hsl = hexToHSL(value);
    if(hsl) {
        setTheme({ ...theme, [key]: `${hsl.h} ${hsl.s}% ${hsl.l}%` });
    }
  };

  const handleLayoutChange = (key: keyof typeof layoutConfig, value: boolean) => {
    setLayoutConfig({ ...layoutConfig, [key]: value });
  };
  
  const handleIconChange = (iconName: ProfileIcon) => {
    updateUserProfile({ profileIcon: iconName });
  };


  const getColorValue = (key: keyof typeof theme) => {
    const [h, s, l] = theme[key].split(' ').map(v => parseFloat(v.replace('%', '')));
    return HSLToHex(h,s,l);
  }

  return (
    <Sheet open={isCustomizerOpen} onOpenChange={setCustomizerOpen}>
      <SheetContent className="w-[300px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" />
            Personalizar Interfaz
          </SheetTitle>
          <SheetDescription>
            Ajusta los colores y la visibilidad de los componentes. Los cambios se guardan automáticamente.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4 -mr-6 pr-6">
            <div className="space-y-8">
                <div>
                    <h3 className="text-sm font-medium mb-4">Temas Prediseñados</h3>
                    <div className="grid grid-cols-2 gap-4">
                    {predefinedThemes.map((pTheme) => (
                        <Button
                        key={pTheme.name}
                        variant="outline"
                        className="h-16 flex flex-col justify-center items-start p-2"
                        onClick={() => setTheme(pTheme.colors)}
                        >
                        <span className="text-xs font-semibold mb-1">{pTheme.name}</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${pTheme.colors.background})` }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${pTheme.colors.primary})` }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${pTheme.colors.accent})` }} />
                        </div>
                        </Button>
                    ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-4">Colores Manuales</h3>
                    <div className="space-y-4">
                        {(Object.keys(theme) as Array<keyof typeof theme>).map(key => (
                           <div key={key} className="flex items-center justify-between">
                             <Label htmlFor={`color-${key}`} className="capitalize">{key}</Label>
                             <div className="relative">
                                <input
                                    type="color"
                                    id={`color-${key}`}
                                    value={getColorValue(key)}
                                    onChange={(e) => handleColorChange(key, e.target.value)}
                                    className="w-24 h-10 p-1 bg-card border border-border rounded-md cursor-pointer appearance-none"
                                />
                             </div>
                           </div>
                        ))}
                    </div>
                </div>

                <Separator />
                
                <div>
                  <h3 className="flex items-center text-sm font-medium mb-4">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Ícono de Perfil
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {profileIcons.map(({ name, icon: Icon, label }) => (
                      <Button
                        key={name}
                        variant="outline"
                        className={cn(
                          'h-16 w-full flex-col gap-1',
                          userProfile?.profileIcon === name && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleIconChange(name)}
                      >
                        <Icon className="w-8 h-8" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                    <h3 className="flex items-center text-sm font-medium mb-4">
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        Configurar UI
                    </h3>
                    <div className="space-y-4">
                        {layoutOptions.map(({ key, label, icon: Icon }) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={`layout-${key}`} className='flex items-center gap-2'>
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                  {label}
                                </Label>
                                <Switch
                                    id={`layout-${key}`}
                                    checked={layoutConfig[key]}
                                    onCheckedChange={(checked) => handleLayoutChange(key, checked)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
        <div className="mt-auto pt-4 border-t border-border -mx-6 px-6">
            <Button variant="ghost" onClick={resetToDefault} className="w-full justify-center">
                <RotateCcw className="mr-2 h-4 w-4" /> Resetear
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
