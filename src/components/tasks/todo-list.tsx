'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Category, Priority, Task } from '@/lib/types';
import { Trash2, Edit, Clock, ArrowLeft, ChevronsRight, Plus, FolderKanban } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { TaskEditDialog } from './task-edit-dialog';
import { useTheme } from '@/contexts/theme-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { Progress } from '../ui/progress';
import { calculateAIPriorityScore, sortTasksByAIPriority } from '@/lib/ai-priority';
import { BrainCircuit, SortAsc } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { TimeTracker } from './time-tracker';

function useRelativeTime(date: Date | null) {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    if (!date) {
      setRelativeTime('');
      return;
    };

    const updateRelativeTime = () => {
      const now = new Date();
      if (now > date) {
          setRelativeTime(`Venció ${formatDistanceToNowStrict(date, { addSuffix: true, locale: es })}`);
      } else {
          setRelativeTime(`Vence ${formatDistanceToNowStrict(date, { addSuffix: true, locale: es })}`);
      }
    };

    updateRelativeTime();
    const intervalId = setInterval(updateRelativeTime, 60000); 

    return () => clearInterval(intervalId);
  }, [date]);

  return relativeTime;
}


function TaskItem({ task, onToggle, onDelete, onEdit }: { task: Task; onToggle: (id: string, subTaskId?: string) => void; onDelete: (id:string) => void; onEdit: (task: Task) => void; }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const { getProjectById } = useTasks();

  const relativeTime = useRelativeTime(task.dueDate ? new Date(task.dueDate) : null);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  const project = task.projectId ? getProjectById(task.projectId) : undefined;

  const handleToggle = () => {
    setIsCompleted(true);
    setTimeout(() => {
      onToggle(task.id);
    }, 500); 
  };
  
  const priorityColors = {
    baja: 'border-l-4 border-emerald-500/70', // More corporate colors
    media: 'border-l-4 border-amber-500/70',
    alta: 'border-l-4 border-rose-500/70',
  };

  const completedSubtasks = task.subTasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subTasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className={cn(
        "group flex flex-col p-4 bg-background border rounded-lg shadow-sm transition-all hover:shadow-md",
        priorityColors[task.priority],
        isCompleted ? 'opacity-50' : ''
    )}>
        <div className="flex items-start gap-4 w-full">
            <Checkbox
              id={`task-${task.id}`}
              onCheckedChange={handleToggle}
              aria-label={`Completar ${task.title}`}
              className="mt-1"
            />
            <div className="flex-grow flex flex-col gap-2 min-w-0">
                <label htmlFor={`task-${task.id}`} className="font-medium leading-tight cursor-pointer break-words select-none">
                  {task.title}
                </label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    {relativeTime && (
                       <div className={cn("flex items-center gap-1", isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                          <Clock className="w-3 h-3" />
                          <span>{relativeTime}</span>
                       </div>
                    )}
                    {project ? (
                        <div className="flex items-center gap-2 capitalize bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                            {/* <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></span> */}
                            <FolderKanban className="w-3 h-3" />
                            <span>{project.name}</span>
                        </div>
                    ) : (
                        <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">{task.category}</Badge>
                    )}
                    {task.aiPriorityScore !== undefined && task.aiPriorityScore > 50 && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            IA: {task.aiPriorityScore}
                        </Badge>
                    )}
                </div>
            </div>

            <TimeTracker taskId={task.id} initialTime={task.timeSpent || 0} className="mr-2 hidden sm:flex" />
            
            <div className="flex items-center ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(task)}>
                    <Edit className="w-4 h-4" />
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        {task.subTasks && task.subTasks.length > 0 && (
          <div className="pl-8 mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ChevronsRight className="h-3 w-3" />
                  <span>Progreso: {completedSubtasks} de {totalSubtasks}</span>
              </div>
              <Progress value={progress} className="h-1"/>
              {task.subTasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <Checkbox 
                          id={`subtask-${subtask.id}`} 
                          checked={subtask.completed} 
                          onCheckedChange={() => onToggle(task.id, subtask.id)}
                          aria-label={`Completar sub-tarea ${subtask.title}`}
                      />
                      <label 
                        htmlFor={`subtask-${subtask.id}`}
                        className={cn("flex-1 cursor-pointer select-none", subtask.completed && 'line-through text-muted-foreground')}
                      >
                          {subtask.title}
                      </label>
                  </div>
              ))}
          </div>
        )}
    </div>
  );
}

export function TodoList({ initialDate, onBack }: { initialDate?: Date, onBack?: () => void }) {
  const { tasks, projects, addTask, toggleTaskCompletion, deleteTask } = useTasks();
  const { role } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('development');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('media');
  // Replaced separate project logic with just optional project assignment
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(initialDate);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Sorting State
  const [sortByAI, setSortByAI] = useState(false);


  useEffect(() => {
    setDueDate(initialDate);
  }, [initialDate]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const taskPayload: any = { // Relaxed type due to form logic
        title: newTaskTitle,
        category: newTaskCategory,
        priority: newTaskPriority,
        dueDate: dueDate || null,
        projectId: newTaskProjectId === 'none' ? undefined : newTaskProjectId
      };
      
      // Clean undefined
      Object.keys(taskPayload).forEach(key => taskPayload[key] === undefined && delete taskPayload[key]);

      addTask(taskPayload);
      setNewTaskTitle('');
      setDueDate(undefined);
      if (onBack) onBack();
    }
  };


  const handleDateTimeChange = (
    newVal: string | Date | undefined,
    type: 'date' | 'hour' | 'minute' | 'ampm'
  ) => {
    let currentDate = dueDate || new Date();
  
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
    setDueDate(new Date(currentDate));
  };
  

  const pendingTasks = useMemo(() => {
    let filtered = tasks.filter(task => !task.completed);
    if (sortByAI && role) {
        return sortTasksByAIPriority(filtered, role);
    }
    return filtered;
  }, [tasks, sortByAI, role]);


  const groupedTasks = useMemo(() => {
    return {
      all: pendingTasks,
      // Group by new categories? 
      // For now, let's just make tabs for "All" unless detailed segregation is needed.
      // Or map tabs to new categories.
    };
  }, [pendingTasks]);


  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Quick Add Form */}
      <Card className="border-dashed border-2 shadow-none bg-muted/20">
        <CardContent className="pt-6">
          <form onSubmit={handleAddTask} className="flex flex-col gap-4">
            <div className="flex gap-2">
                <Input
                  placeholder="¿Qué tarea tienes pendiente?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-background"
                />
            </div>
            
            <div className="flex flex-wrap gap-2">
                <Select value={newTaskPriority} onValueChange={(val: Priority) => setNewTaskPriority(val)}>
                  <SelectTrigger className="w-[110px] bg-background">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={newTaskCategory} onValueChange={(val: Category) => setNewTaskCategory(val)}>
                  <SelectTrigger className="w-[130px] bg-background">
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
                
                 <Select value={newTaskProjectId || "none"} onValueChange={(val) => setNewTaskProjectId(val)}>
                  <SelectTrigger className="w-[130px] bg-background">
                     <SelectValue placeholder="Proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin Proyecto</SelectItem>
                    {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>


                <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[140px] pl-3 text-left font-normal bg-background",
                          !dueDate && "text-muted-foreground"
                        )}
                        type="button"
                      >
                        {dueDate ? (
                          format(dueDate, "dd/MM HH:mm", { locale: es })
                        ) : (
                          <span>Sin fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate || undefined}
                          onSelect={(date) => handleDateTimeChange(date, 'date')}
                          initialFocus
                        />
                         {/* Time picker simplified here, could be elaborate */}
                    </PopoverContent>
                </Popover>

                <Button type="submit" disabled={!newTaskTitle.trim()}>
                    <Plus className="w-4 h-4 mr-2" /> Agregar Tarea
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>


      {/* Task List - Simplified to just a list for now, tabs were cluttering */}
      {/* If needed we can bring back tabs for Priorities or Categories */}
      
      <div className="flex justify-between items-center pb-2">
         <h3 className="font-semibold text-sm text-muted-foreground">Tareas Pendientes</h3>
         <Button 
            variant={sortByAI ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setSortByAI(!sortByAI)}
            className="text-xs"
         >
            <BrainCircuit className="w-3 h-3 mr-2" />
            {sortByAI ? "Orden Inteligente Activo" : "Ordenar por IA"}
         </Button>
      </div>

      <div className="space-y-4">
         {pendingTasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <p>No tienes tareas asignadas pendientes.</p>
            </div>
         ) : (
            pendingTasks.map(task => (
                <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTaskCompletion} 
                    onDelete={deleteTask} 
                    onEdit={handleEditTask} 
                />
            ))
         )}
      </div>

      {editingTask && (
        <TaskEditDialog
          isOpen={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
        />
      )}
    </div>
  );
}


