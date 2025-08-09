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
import { Plus, Palette, Trash2, Settings, ShieldAlert, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';

const colorPalette = [
  '#0B7ABF', // Custom Blue
  '#F2BB13', // Custom Yellow
  '#16a34a', // green-600
  '#db2777', // pink-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
];

function DeleteDataConfirmation() {
  const { clearAllData } = useTasks();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const correctPin = '901230';

  const handleConfirm = () => {
    if (pin === correctPin) {
      clearAllData();
      setError('');
      setIsDialogOpen(false);
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setPin('');
      setError('');
    }
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Borrar todos los datos
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente todas tus tareas y proyectos. Por favor, introduce el PIN <strong>{correctPin}</strong> para confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Introduce el PIN de confirmación"
          className="my-4"
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">Confirmar Borrado</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ProjectEditDialog({ projectId, currentName, currentDescription, onOpenChange, isOpen }: { projectId: string; currentName: string; currentDescription?: string; isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [description, setDescription] = useState(currentDescription || '');
  const { updateProject } = useTasks();

  const handleSave = () => {
    updateProject(projectId, { description });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar Proyecto: <span className="capitalize font-bold text-primary">{currentName}</span></AlertDialogTitle>
          <AlertDialogDescription>
            Añade o edita la descripción de tu proyecto para dar más contexto a la IA al generar tareas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el objetivo principal de este proyecto..."
          className="my-4 min-h-[120px]"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Guardar Cambios</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export function ProjectLegend() {
  const { projects, addProject, deleteProject } = useTasks();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(colorPalette[0]);
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [isManagePopoverOpen, setIsManagePopoverOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject({ name: newProjectName, color: newProjectColor, description: '' });
      setNewProjectName('');
      setNewProjectColor(colorPalette[0]);
      setIsAddPopoverOpen(false);
    }
  };

  const projectToEdit = projects.find(p => p.id === editingProject);

  return (
    <div className="flex items-center gap-4 flex-wrap p-4 rounded-lg bg-card/80 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase">Proyectos:</h3>
      {projects.length > 0 ? (
        projects.map((project) => (
          <div key={project.id} className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-sm font-medium capitalize">{project.name}</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No hay proyectos. Añade uno para empezar.</p>
      )}
      <div className="flex gap-2 ml-auto">
        <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">NUEVO PROYECTO</h4>
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
                    placeholder="Ej: Informe Trimestral"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label><Palette className="w-4 h-4 inline-block mr-1" />Color</Label>
                  <div className="col-span-2 flex gap-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewProjectColor(color)}
                        className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          newProjectColor === color
                            ? 'border-accent ring-2 ring-accent'
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

        <Popover open={isManagePopoverOpen} onOpenChange={setIsManagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={projects.length === 0}>
              <Settings className="h-4 w-4 mr-2" />
              Gestionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96">
             <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">GESTIONAR PROYECTOS</h4>
                   <p className="text-sm text-muted-foreground">
                    Edita o elimina los proyectos que ya no necesites.
                  </p>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                    {projects.map(project => (
                        <div key={project.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                           <div className="flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
                                <span className="text-sm font-medium capitalize">{project.name}</span>
                            </div>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditingProject(project.id)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteProject(project.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <DeleteDataConfirmation />
             </div>
          </PopoverContent>
        </Popover>
        {projectToEdit && (
          <ProjectEditDialog
            isOpen={!!editingProject}
            onOpenChange={(open) => !open && setEditingProject(null)}
            projectId={projectToEdit.id}
            currentName={projectToEdit.name}
            currentDescription={projectToEdit.description}
          />
        )}
      </div>
    </div>
  );
}
    
