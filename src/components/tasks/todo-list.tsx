'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiTaskGenerator } from './ai-task-generator';
import type { Category, Priority, Task } from '@/lib/types';
import { Trash2, Edit, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { TaskEditDialog } from './task-edit-dialog';
import { AiTaskOptimizer } from './ai-task-optimizer';
import { useTheme } from '@/contexts/theme-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

function TaskItem({ task, onToggle, onDelete, onEdit }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void; onEdit: (task: Task) => void; }) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleToggle = () => {
    setIsCompleted(true);
    setTimeout(() => {
        onToggle(task.id);
    }, 500); // Duration of animation
  };

  const priorityColors = {
    baja: 'border-l-4 border-green-500/70',
    media: 'border-l-4 border-yellow-500/70',
    alta: 'border-l-4 border-red-500/70',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      className={`group flex items-center space-x-2 sm:space-x-4 p-4 bg-card/80 backdrop-blur-sm rounded-lg shadow-md transition-all hover:bg-secondary/60 ${
        priorityColors[task.priority]
      } ${isCompleted ? 'task-complete-animation' : ''}`}
    >
      <Checkbox
        id={`task-todo-${task.id}`}
        onCheckedChange={handleToggle}
        aria-label={`Completar ${task.title}`}
      />
      <div className="flex-1 overflow-hidden">
        <label
          htmlFor={`task-todo-${task.id}`}
          className="font-medium leading-none cursor-pointer truncate"
        >
          {task.title}
        </label>
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" />
            <span>{format(new Date(task.dueDate), "d MMM, HH:mm'h'", { locale: es })}</span>
          </div>
        )}
      </div>
      <Badge variant="outline" className="capitalize hidden sm:inline-flex">{task.category}</Badge>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => onEdit(task)}>
            <Edit className="w-4 h-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La tarea será eliminada permanentemente de la base de datos.
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
  );
}

export function TodoList() {
  const { tasks, projects, addTask, toggleTaskCompletion, deleteTask } = useTasks();
  const { layoutConfig } = useTheme();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('media');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const taskPayload: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'userId'>> = {
        title: newTaskTitle,
        category: newTaskCategory,
        priority: newTaskPriority,
        dueDate: dueDate || null,
      };

      if (newTaskCategory === 'proyectos' && newTaskProjectId) {
        taskPayload.projectId = newTaskProjectId;
      }
      
      addTask(taskPayload);
      setNewTaskTitle('');
      setNewTaskProjectId(undefined);
      setDueDate(undefined);
    }
  };
  
  const handleCategoryChange = (value: string) => {
    const category = value as Category;
    setNewTaskCategory(category);
    if (category !== 'proyectos') {
        setNewTaskProjectId(undefined);
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setDueDate(undefined);
      return;
    }
    const now = new Date();
    date.setHours(now.getHours());
    date.setMinutes(now.getMinutes());
    date.setSeconds(now.getSeconds());
    setDueDate(date);
  };

  const pendingTasks = useMemo(() => tasks.filter(task => !task.completed), [tasks]);


  const groupedTasks = useMemo(() => {
    return {
      all: pendingTasks,
      estudio: pendingTasks.filter(t => t.category === 'estudio'),
      trabajo: pendingTasks.filter(t => t.category === 'trabajo'),
      personal: pendingTasks.filter(t => t.category === 'personal'),
      proyectos: pendingTasks.filter(t => t.category === 'proyectos'),
    };
  }, [pendingTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const closeEditDialog = () => {
    setEditingTask(null);
  };

  const renderTaskList = (tasksToRender: Task[]) => {
    if (tasksToRender.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay tareas pendientes en esta categoría.</p>;
    }
    return (
      <div className="space-y-4">
        {tasksToRender.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTaskCompletion} onDelete={deleteTask} onEdit={handleEditTask} />
        ))}
      </div>
    );
  };
  
  const TABS_WITH_CONTENT = [
    { value: 'all', label: 'Todas' },
    { value: 'estudio', label: 'Estudio' },
    { value: 'trabajo', label: 'Trabajo' },
    { value: 'personal', label: 'Personal' },
    { value: 'proyectos', label: 'Proyectos' },
  ];


  return (
    <div className="space-y-6">
      <div className="z-10 relative">
        <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
          Añadir Nueva Tarea
        </h2>
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleAddTask} className="flex flex-col gap-4">
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Añadir una nueva tarea..."
                        className="flex-grow bg-background/50"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Select value={newTaskCategory} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="flex-1 min-w-[120px] capitalize">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="trabajo">Trabajo</SelectItem>
                                <SelectItem value="estudio">Estudio</SelectItem>
                                <SelectItem value="proyectos">Proyectos</SelectItem>
                            </SelectContent>
                        </Select>
                        {newTaskCategory === 'proyectos' && (
                            <Select value={newTaskProjectId} onValueChange={setNewTaskProjectId}>
                                <SelectTrigger className="flex-1 min-w-[120px] capitalize" disabled={projects.length === 0}>
                                    <SelectValue placeholder={projects.length === 0 ? "No hay proyectos" : "Asignar Proyecto"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(project => (
                                        <SelectItem key={project.id} value={project.id} className="capitalize">
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                            <SelectTrigger className="flex-1 min-w-[120px] capitalize">
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     {layoutConfig.enableDueDates && (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP HH:mm", { locale: es }) : <span>Fecha de vencimiento (Opcional)</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="submit" className="w-full">Añadir Tarea</Button>
                        <AiTaskGenerator />
                    </div>
                </form>
            </CardContent>
        </Card>
      </div>
      
      <div className="relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight uppercase text-primary/80">
            Mi Lista de Tareas
          </h2>
          <div className="flex items-center gap-2">
            <AiTaskOptimizer />
          </div>
        </div>
        <Tabs defaultValue="all" className="w-full">
            <div className="overflow-x-auto pb-2">
                <TabsList className="w-full sm:w-auto">
                    {TABS_WITH_CONTENT.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} className="capitalize flex-shrink-0">
                        {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <TabsContent value="all" className="mt-6">{renderTaskList(groupedTasks.all)}</TabsContent>
            <TabsContent value="estudio" className="mt-6">{renderTaskList(groupedTasks.estudio)}</TabsContent>
            <TabsContent value="trabajo" className="mt-6">{renderTaskList(groupedTasks.trabajo)}</TabsContent>
            <TabsContent value="personal" className="mt-6">{renderTaskList(groupedTasks.personal)}</TabsContent>
            <TabsContent value="proyectos" className="mt-6">{renderTaskList(groupedTasks.proyectos)}</TabsContent>
        </Tabs>
      </div>
      {editingTask && (
        <TaskEditDialog
            isOpen={!!editingTask}
            onOpenChange={(open) => !open && closeEditDialog()}
            task={editingTask}
        />
      )}
    </div>
  );
}
