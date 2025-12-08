'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTasks } from '@/contexts/task-context';
import type { Task, Category, Priority, SubTask } from '@/lib/types';
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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';

const subTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'El título no puede estar vacío.'),
  completed: z.boolean(),
});

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']),
  priority: z.enum(['baja', 'media', 'alta']),
  projectId: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  subTasks: z.array(subTaskSchema).optional(),
});

type TaskEditDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
};

export function TaskEditDialog({ isOpen, onOpenChange, task }: TaskEditDialogProps) {
  const { projects, updateTask, updateSubTask, addSubTask, deleteSubTask } = useTasks();
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
      subTasks: task.subTasks || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subTasks",
  });
  
  useEffect(() => {
    form.reset({
      title: task.title,
      category: task.category,
      priority: task.priority,
      projectId: task.projectId || undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      subTasks: task.subTasks || [],
    });
  }, [task, form]);

  const category = form.watch('category');

  const handleDateTimeChange = (
    newVal: string | Date | undefined,
    field: any,
    type: 'date' | 'hour' | 'minute' | 'ampm'
  ) => {
    let currentDate = field.value ? new Date(field.value) : new Date();
  
    switch (type) {
      case 'date':
        if (newVal instanceof Date) {
          const newDate = new Date(newVal);
          currentDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        }
        break;
      case 'hour':
        const newHour = parseInt(newVal as string, 10);
        const currentHour12 = currentDate.getHours() % 12;
        const isPM = currentDate.getHours() >= 12;
        let finalHour = newHour;
        if(isPM && newHour !== 12) finalHour += 12;
        if(!isPM && newHour === 12) finalHour = 0;
        currentDate.setHours(finalHour);
        break;
      case 'minute':
        currentDate.setMinutes(parseInt(newVal as string, 10));
        break;
      case 'ampm':
        const hour = currentDate.getHours();
        if (newVal === 'PM' && hour < 12) {
          currentDate.setHours(hour + 12);
        } else if (newVal === 'AM' && hour >= 12) {
          currentDate.setHours(hour - 12);
        }
        break;
    }
    field.onChange(new Date(currentDate));
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

  const handleAddNewSubtask = () => {
    const newSubtask: SubTask = {
      id: `sub-${Date.now()}`,
      title: 'Nueva sub-tarea',
      completed: false
    };
    // Append to form state
    append(newSubtask);
    // Persist in context
    addSubTask(task.id, newSubtask.title);
  }
  

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
                      {field.value ? format(field.value, "PPPp", { locale: es }) : <span>Fecha de vencimiento</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => handleDateTimeChange(date, field, 'date')}
                      initialFocus
                    />
                    <div className="p-2 border-t flex items-center justify-center gap-2">
                        <Label>Hora:</Label>
                         <Select
                            value={String(field.value ? new Date(field.value).getHours() % 12 || 12 : '12')}
                            onValueChange={(value) => handleDateTimeChange(value, field, 'hour')}
                         >
                            <SelectTrigger className="w-auto flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h)}>{String(h)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Label>:</Label>
                        <Select
                            value={String(field.value ? new Date(field.value).getMinutes() : '0').padStart(2, '0')}
                            onValueChange={(value) => handleDateTimeChange(value, field, 'minute')}
                        >
                            <SelectTrigger className="w-auto flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => i).map(m => <SelectItem key={m} value={String(m)}>{String(m).padStart(2, '0')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select
                            value={field.value && new Date(field.value).getHours() >= 12 ? 'PM' : 'AM'}
                            onValueChange={(value) => handleDateTimeChange(value, field, 'ampm')}
                        >
                            <SelectTrigger className="w-auto flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
          )}

            <div>
              <Label>Sub-tareas</Label>
              <div className="mt-2 space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Controller
                      name={`subTasks.${index}.completed`}
                      control={form.control}
                      render={({ field: checkField }) => (
                        <Checkbox
                          checked={checkField.value}
                          onCheckedChange={(checked) => {
                            checkField.onChange(checked);
                            updateSubTask(task.id, field.id, { completed: !!checked });
                          }}
                        />
                      )}
                    />
                     <Controller
                      name={`subTasks.${index}.title`}
                      control={form.control}
                      render={({ field: inputField }) => (
                        <Input
                          {...inputField}
                          onBlur={(e) => {
                            inputField.onBlur();
                            updateSubTask(task.id, field.id, { title: e.target.value });
                          }}
                          className={cn(form.getValues(`subTasks.${index}.completed`) && "line-through text-muted-foreground")}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        remove(index);
                        deleteSubTask(task.id, field.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleAddNewSubtask}>
                  <Plus className="mr-2 h-4 w-4" /> Añadir Sub-tarea
                </Button>
              </div>
            </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
