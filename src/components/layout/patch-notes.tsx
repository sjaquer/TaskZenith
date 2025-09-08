
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '../ui/dropdown-menu';
import { Newspaper } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

const patchNotes = [
  {
    version: '1.4.0',
    date: 'Septiembre 08, 2025',
    changes: [
       {
        type: 'NUEVO',
        description: '¡Se añadieron más temas de colores! Ahora puedes probar "Rojo Escarlata", "Menta Fresca" y "Atardecer Neón".',
      },
      {
        type: 'NUEVO',
        description: '¡Personalización de tipografía! Ahora puedes cambiar la fuente de toda la aplicación desde el panel de personalización.',
      },
       {
        type: 'MEJORA',
        description: 'Se ha mejorado la función de cambio de tipografía para que se aplique consistentemente en toda la aplicación y se han añadido más fuentes como "Inter" y "Source Code Pro".',
      },
    ],
  },
  {
    version: '1.3.0',
    date: 'Julio 26, 2024',
    changes: [
      {
        type: 'NUEVO',
        description: '¡Se añadió esta ventana de notas de parche para que estés al día con todas las novedades!',
      },
      {
        type: 'MEJORA',
        description: 'El widget "Foco del Día" ahora usa IA para crear un plan de ataque personalizado con un mensaje motivador.',
      },
      {
        type: 'FIX',
        description: 'Corregidos múltiples errores con la directiva "use server" que impedían el funcionamiento de la IA.',
      },
    ],
  },
  {
    version: '1.2.1',
    date: 'Julio 25, 2024',
    changes: [
      {
        type: 'MEJORA',
        description: 'La selección de fecha y hora para las tareas ahora usa un formato de 12 horas (AM/PM) mucho más intuitivo.',
      },
      {
        type: 'FIX',
        description: 'Se eliminó el título duplicado en el dashboard y se arregló el solapamiento de componentes en vistas móviles.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: 'Julio 24, 2024',
    changes: [
       {
        type: 'MEJORA',
        description: 'El historial de tareas ahora es completamente responsivo, mostrando tarjetas en móviles en lugar de una tabla.',
      },
      {
        type: 'NUEVO',
        description: 'Se añadió un temporizador que muestra cuánto falta para la próxima limpieza de tareas antiguas (+5 días).',
      },
    ],
  },
    {
    version: '1.0.0',
    date: 'Julio 23, 2024',
    changes: [
      {
        type: 'NUEVO',
        description: 'Lanzamiento inicial de TaskZenith con gestión de tareas y proyectos.',
      },
    ],
  },
];

const badgeColors: { [key: string]: string } = {
  NUEVO: 'bg-blue-500/20 text-blue-300 border-blue-400',
  MEJORA: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
  FIX: 'bg-green-500/20 text-green-300 border-green-400',
};

export function PatchNotesDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Newspaper className="mr-2 h-4 w-4" />
          <span>Notas de Parche</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de Cambios de TaskZenith</DialogTitle>
          <DialogDescription>
            Aquí puedes ver todas las nuevas funciones, mejoras y correcciones que se han implementado.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6 -mr-6">
            <div className="space-y-8 mt-4">
            {patchNotes.map((note) => (
                <div key={note.version}>
                <div className="flex items-baseline gap-4 mb-2">
                    <h3 className="text-xl font-bold text-primary">Versión {note.version}</h3>
                    <p className="text-sm text-muted-foreground">{note.date}</p>
                </div>
                <ul className="space-y-2">
                    {note.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <Badge
                        variant="outline"
                        className={`mt-1 text-xs whitespace-nowrap ${badgeColors[change.type] || ''}`}
                        >
                        {change.type}
                        </Badge>
                        <p className="text-sm text-foreground/90">{change.description}</p>
                    </li>
                    ))}
                </ul>
                </div>
            ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
