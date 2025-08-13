'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTasks } from '@/contexts/task-context';
import type { Task, Category, Priority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']),
  priority: z.enum(['baja', 'media', 'alta']),
  projectId: z.string().optional(),
});

type TaskEditDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
};

export function TaskEditDialog({ isOpen, onOpenChange, task }: TaskEditDialogProps) {
  const { projects, updateTask } = useTasks();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      category: task.category,
      priority: task.priority,
      projectId: task.projectId || undefined,
    },
  });
  
  useEffect(() => {
    form.reset({
      title: task.title,
      category: task.category,
      priority: task.priority,
      projectId: task.projectId || undefined,
    });
  }, [task, form]);

  const category = form.watch('category');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const dataToUpdate: Partial<Task> = {
        ...values,
        projectId: values.category === 'proyectos' ? values.projectId : undefined,
    };
    
    if (dataToUpdate.projectId === undefined) {
        delete dataToUpdate.projectId;
    }

    updateTask(task.id, dataToUpdate);

    toast({
      title: '¡Tarea actualizada!',
      description: 'Los cambios se han guardado correctamente.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Realiza los cambios necesarios en tu tarea y guárdalos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título de la Tarea</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Categoría</Label>
                <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="trabajo">Trabajo</SelectItem>
                                <SelectItem value="estudio">Estudio</SelectItem>
                                <SelectItem value="proyectos">Proyectos</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            <div>
                <Label>Prioridad</Label>
                <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
          </div>
          
          {category === 'proyectos' && (
            <div>
              <Label>Proyecto</Label>
              <Controller
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <SelectTrigger disabled={projects.length === 0}>
                            <SelectValue placeholder={projects.length > 0 ? "Selecciona un proyecto" : "No hay proyectos"} />
                        </SelectTrigger>
                        <SelectContent>
                        {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id} className="capitalize">
                            {project.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  )}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
