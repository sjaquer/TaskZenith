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
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { VoiceTaskGenerator } from './voice-task-generator';


function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
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

  return (
    <div
      className={`group flex items-center space-x-4 p-4 bg-card/80 backdrop-blur-sm rounded-lg shadow-md transition-all hover:bg-secondary/60 ${
        priorityColors[task.priority]
      } ${isCompleted ? 'task-complete-animation' : ''}`}
    >
      <Checkbox
        id={`task-todo-${task.id}`}
        onCheckedChange={handleToggle}
        aria-label={`Completar ${task.title}`}
      />
      <div className="flex-1">
        <label
          htmlFor={`task-todo-${task.id}`}
          className="font-medium leading-none cursor-pointer"
        >
          {task.title}
        </label>
      </div>
      <Badge variant="outline" className="capitalize">{task.category}</Badge>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
}


export function TodoList() {
  const { tasks, projects, addTask, toggleTaskCompletion, deleteTask } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('media');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>(undefined);


  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask({ 
        title: newTaskTitle, 
        category: newTaskCategory, 
        priority: newTaskPriority,
        projectId: newTaskCategory === 'proyectos' ? newTaskProjectId : undefined,
      });
      setNewTaskTitle('');
      setNewTaskProjectId(undefined);
    }
  };
  
  const handleCategoryChange = (value: string) => {
    const category = value as Category;
    setNewTaskCategory(category);
    if (category !== 'proyectos') {
        setNewTaskProjectId(undefined);
    }
  }

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

  const renderTaskList = (tasksToRender: Task[]) => {
    if (tasksToRender.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay tareas pendientes en esta categoría.</p>;
    }
    return (
      <div className="space-y-4">
        {tasksToRender.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTaskCompletion} onDelete={deleteTask} />
        ))}
      </div>
    );
  };
  
  const TABS_WITH_CONTENT = [
    { value: 'all', label: 'Todas', tasks: groupedTasks.all },
    { value: 'estudio', label: 'Estudio', tasks: groupedTasks.estudio },
    { value: 'trabajo', label: 'Trabajo', tasks: groupedTasks.trabajo },
    { value: 'personal', label: 'Personal', tasks: groupedTasks.personal },
    { value: 'proyectos', label: 'Proyectos', tasks: groupedTasks.proyectos },
  ].filter(tab => tab.tasks.length > 0 || tab.value === 'all' || tab.value === 'personal');


  return (
    <div className="space-y-6">
      <div className="z-10 relative">
        <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
          Añadir Nueva Tarea
        </h2>
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardContent className="p-6">
                <form onSubmit={handleAddTask} className="flex flex-col gap-4">
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Añadir una nueva tarea..."
                        className="flex-grow bg-background/50"
                    />
                    <div className="flex flex-col md:flex-row gap-2">
                        <Select value={newTaskCategory} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="w-full capitalize">
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
                                <SelectTrigger className="w-full capitalize" disabled={projects.length === 0}>
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
                            <SelectTrigger className="w-full capitalize">
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                        <Button type="submit" className="w-full">Añadir Tarea</Button>
                        <AiTaskGenerator />
                        <VoiceTaskGenerator />
                    </div>
                </form>
            </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
          Mi Lista de Tareas
        </h2>
        <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-start items-center flex-wrap gap-4">
                <TabsList>
                    {TABS_WITH_CONTENT.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
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
    </div>
  );
}
