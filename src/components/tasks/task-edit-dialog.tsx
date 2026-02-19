'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
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
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '@/lib/calendar-utils';
import { CalendarIcon, Plus, Trash2, CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

const subTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'El título no puede estar vacío.'),
  completed: z.boolean(),
});

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  category: z.enum(['development', 'design', 'marketing', 'management', 'other']),
  priority: z.enum(['baja', 'media', 'alta']),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
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
  const { role } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      category: task.category,
      priority: task.priority,
      projectId: task.projectId || undefined,
      assignedTo: task.assignedTo || undefined,
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
      assignedTo: task.assignedTo || undefined,
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
    };
    
    // Clean undefined fields
    Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);

    updateTask(task.id, dataToUpdate);

    toast({
      title: '¡Tarea actualizada!',
      description: 'Los cambios se han guardado correctamente.',
    });
    onOpenChange(false);
  };

  const openCalendar = (type: 'google' | 'outlook') => {
      const url = type === 'google' ? generateGoogleCalendarUrl({...task, ...form.getValues()}) : generateOutlookCalendarUrl({...task, ...form.getValues()});
      window.open(url, '_blank');
  };

  const handleAddNewSubtask = () => {
    const created = addSubTask(task.id, 'Nueva sub-tarea');
    if (created) {
      append(created);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la tarea.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridad" />
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
            <div className="grid gap-2">
              <Label>Departamento / Categoría</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Desarrollo</SelectItem>
                      <SelectItem value="design">Diseño</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="management">Gestión</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          {/* Project Selection */}
           <div className="grid gap-2">
              <Label>Proyecto</Label>
              <Controller
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin Proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignación</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
           </div>
           
           {/* Assignment for Admins */}
           {role === 'admin' && (
                <div className="grid gap-2">
                    <Label>Asignar a (ID de Usuario)</Label>
                    <Input {...form.register('assignedTo')} placeholder="ID de Usuario" />
                </div>
           )}

          <div className="grid gap-2">
                 <Label>Fecha de Vencimiento / Hora</Label>
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
                            {field.value ? (
                              format(field.value, "PPP HH:mm", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="flex">
                             <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => handleDateTimeChange(date, field, 'date')}
                                initialFocus
                              />
                              <div className="p-3 border-l flex flex-col gap-2">
                                  <Label className="text-xs">Hora</Label>
                                  <div className="flex gap-1">
                                      <Select 
                                        onValueChange={(val) => handleDateTimeChange(val, field, 'hour')} 
                                        value={field.value ? String(field.value.getHours() % 12 || 12) : "12"}
                                      >
                                        <SelectTrigger className="w-[60px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                                <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>

                                      <Select
                                        onValueChange={(val) => handleDateTimeChange(val, field, 'minute')}
                                        value={field.value ? String(field.value.getMinutes()).padStart(2, '0') : "00"}
                                        >
                                        <SelectTrigger className="w-[60px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['00', '15', '30', '45'].map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>

                                      <Select
                                        onValueChange={(val) => handleDateTimeChange(val, field, 'ampm')}
                                        value={field.value ? (field.value.getHours() >= 12 ? 'PM' : 'AM') : "AM"}
                                        >
                                        <SelectTrigger className="w-[60px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AM">AM</SelectItem>
                                            <SelectItem value="PM">PM</SelectItem>
                                        </SelectContent>
                                      </Select>
                                  </div>
                              </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
          </div>

          <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Label>Subtareas</Label>
                 <Button type="button" variant="ghost" size="sm" onClick={handleAddNewSubtask}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                 </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-md border border-border/40 p-2">
                 {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Checkbox 
                            checked={form.watch(`subTasks.${index}.completed`)}
                            onCheckedChange={(checked) => {
                                 const val = checked === true;
                                 form.setValue(`subTasks.${index}.completed`, val);
                            }}
                        />
                        <Input 
                            {...form.register(`subTasks.${index}.title` as const)} 
                            className="h-8"
                        />
                         <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                 ))}
                 {fields.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Sin subtareas.</p>}
              </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <div className="flex gap-2 mr-auto w-full sm:w-auto justify-center sm:justify-start">
                 <Button type="button" variant="outline" size="sm" onClick={() => openCalendar('google')}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Google
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => openCalendar('outlook')}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Outlook
                </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
