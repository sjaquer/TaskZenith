'use client';

import { useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

const colorPalette = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#db2777', // pink-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
];

export function ProjectLegend() {
  const { projects, addProject } = useTasks();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(colorPalette[0]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject({ name: newProjectName, color: newProjectColor });
      setNewProjectName('');
      setNewProjectColor(colorPalette[0]);
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap p-4 rounded-lg bg-card/50 backdrop-blur-sm">
      <h3 className="text-sm font-medium text-muted-foreground">Proyectos:</h3>
      {projects.map((project) => (
        <div key={project.id} className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <span className="text-sm">{project.name}</span>
        </div>
      ))}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Nuevo Proyecto</h4>
              <p className="text-sm text-muted-foreground">
                Añade un nuevo proyecto a tu tablero.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="col-span-2 h-8"
                  placeholder="Ej: Informe Q4"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Color</Label>
                <div className="col-span-2 flex gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewProjectColor(color)}
                      className={`h-6 w-6 rounded-full border-2 ${
                        newProjectColor === color
                          ? 'border-ring'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={handleAddProject}>Añadir Proyecto</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
