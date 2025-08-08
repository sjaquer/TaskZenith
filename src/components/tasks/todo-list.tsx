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

function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
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
      className={`flex items-center space-x-4 p-4 bg-card/80 backdrop-blur-sm rounded-lg shadow-md transition-all hover:bg-secondary/60 ${
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
    </div>
  );
}


export function TodoList() {
  const { tasks, addTask, toggleTaskCompletion } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('media');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask({ title: newTaskTitle, category: newTaskCategory, priority: newTaskPriority });
      setNewTaskTitle('');
    }
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

  const renderTaskList = (tasksToRender: Task[]) => {
    if (tasksToRender.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay tareas pendientes en esta categoría.</p>;
    }
    return (
      <div className="space-y-4">
        {tasksToRender.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTaskCompletion} />
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
  ].filter(tab => tab.tasks.length > 0 || tab.value === 'all');


  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
          Mi Lista de Tareas
        </h2>
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardContent className="p-6">
                <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4">
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Añadir una nueva tarea..."
                        className="flex-grow bg-background/50"
                    />
                    <div className="flex gap-2">
                        <Select value={newTaskCategory} onValueChange={(v) => setNewTaskCategory(v as Category)}>
                            <SelectTrigger className="w-full md:w-[130px] capitalize">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="trabajo">Trabajo</SelectItem>
                                <SelectItem value="estudio">Estudio</SelectItem>
                                <SelectItem value="proyectos">Proyectos</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                            <SelectTrigger className="w-full md:w-[120px] capitalize">
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baja">Baja</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full md:w-auto">Añadir Tarea</Button>
                     <AiTaskGenerator />
                </form>
            </CardContent>
        </Card>
      </div>

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
  );
}
