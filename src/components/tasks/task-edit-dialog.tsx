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
import { useTheme } from '@/contexts/theme-context';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']),
  priority: z.enum(['baja', 'media', 'alta']),
  projectId: z.string().optional(),
  dueDate: z.date().optional().nullable(),
});

type TaskEditDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
};

export function TaskEditDialog({ isOpen, onOpenChange, task }: TaskEditDialogProps) {
  const { projects, updateTask } = useTasks();
  const { layoutConfig } = useTheme();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      category: task.category,
      priority: task.priority,
      projectId: task.projectId || undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    },
  });
  
  useEffect(() => {
    form.reset({
      title: task.title,
      category: task.category,
      priority: task.priority,
      projectId: task.projectId || undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    });
  }, [task, form]);

  const category = form.watch('category');

  const handleDateSelect = (date: Date | undefined, field: any) => {
    if (!date) {
      field.onChange(null);
      return;
    }
    const now = new Date();
    date.setHours(now.getHours());
    date.setMinutes(now.getMinutes());
    date.setSeconds(now.getSeconds());
    field.onChange(date);
  };

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

          {layoutConfig.enableDueDates && (
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP HH:mm", { locale: es }) : <span>Fecha de vencimiento</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => handleDateSelect(date, field)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
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
