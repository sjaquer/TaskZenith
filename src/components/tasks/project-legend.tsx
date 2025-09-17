
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
import { Plus, Palette, Trash2, Settings, ShieldAlert, Edit, X } from 'lucide-react';
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
        <Button variant="destructive" size="sm" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Borrar datos de la cuenta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente todas tus tareas y proyectos de esta cuenta. Por favor, introduce el PIN <strong>{correctPin}</strong> para confirmar.
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
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const { updateProject } = useTasks();

  const handleSave = () => {
    updateProject(projectId, { name, description });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar Proyecto: <span className="capitalize font-bold text-primary">{currentName}</span></AlertDialogTitle>
          <AlertDialogDescription>
            Puedes cambiar el nombre y la descripción de tu proyecto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 my-4">
          <div>
            <Label htmlFor="projectName" className="mb-2 block">Nombre del Proyecto</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del proyecto"
              className="capitalize"
            />
          </div>
          <div>
            <Label htmlFor="projectDescription" className="mb-2 block">Descripción del Proyecto</Label>
            <Textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el objetivo principal de este proyecto..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Guardar Cambios</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export function ProjectLegend({ onProjectSelect, selectedProjectId }: { onProjectSelect: (projectId: string | null) => void, selectedProjectId: string | null }) {
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap p-4 rounded-lg bg-card/80 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase w-full sm:w-auto">Proyectos:</h3>
      <div className="flex flex-wrap gap-2">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Button
              key={project.id}
              variant={selectedProjectId === project.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onProjectSelect(project.id)}
              className="flex items-center gap-2 capitalize"
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No hay proyectos. Añade uno para empezar.</p>
        )}
        {selectedProjectId && (
            <Button variant="ghost" size="sm" onClick={() => onProjectSelect(null)}>
                <X className="h-4 w-4 mr-2" />
                Mostrar Todos
            </Button>
        )}
      </div>
      <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
        <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-grow">
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
            <Button variant="outline" size="sm" disabled={projects.length === 0} className="flex-grow">
              <Settings className="h-4 w-4 mr-2" />
              Gestionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 sm:w-96">
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
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará el proyecto <strong className="capitalize">{project.name}</strong> y todas las tareas asociadas a él.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteProject(project.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sí, eliminar proyecto
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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

    