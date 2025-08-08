'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Timer, Settings, Plus, Trash2 } from 'lucide-react';

const defaultDailyTasks = [
  { id: 'daily-1', title: 'Hacer la cama' },
  { id: 'daily-2', title: 'Meditar 10 minutos' },
  { id: 'daily-3', title: 'Revisar la agenda del día' },
  { id: 'daily-4', title: 'Beber un vaso de agua al despertar' },
  { id: 'daily-5', title: 'Planificar las 3 tareas más importantes' },
];

type DailyTask = {
  id: string;
  title: string;
  completed: boolean;
};

const getStorageKey = () => `dailyTasks-${new Date().toISOString().split('T')[0]}`;
const getCustomTasksKey = () => 'customDailyTasks';

export function DailyTodoList() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customTasks, setCustomTasks] = useState<Omit<DailyTask, 'completed'>[]>([]);

  useEffect(() => {
    const customTasksStored = localStorage.getItem(getCustomTasksKey());
    const initialTasks = customTasksStored ? JSON.parse(customTasksStored) : defaultDailyTasks;
    setCustomTasks(initialTasks);

    const storageKey = getStorageKey();
    const storedTasks = localStorage.getItem(storageKey);
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      const yesterdayKey = `dailyTasks-${new Date(Date.now() - 86400000).toISOString().split('T')[0]}`;
      localStorage.removeItem(yesterdayKey);
      const newTasks = initialTasks.map((task: Omit<DailyTask, 'completed'>) => ({ ...task, completed: false }));
      setTasks(newTasks);
      localStorage.setItem(storageKey, JSON.stringify(newTasks));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
    }
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleCustomTaskChange = (id: string, newTitle: string) => {
    setCustomTasks(customTasks.map(task => task.id === id ? { ...task, title: newTitle } : task));
  };

  const addNewCustomTask = () => {
    setCustomTasks([...customTasks, { id: `daily-${Date.now()}`, title: '' }]);
  };

  const removeCustomTask = (id: string) => {
    setCustomTasks(customTasks.filter(task => task.id !== id));
  };

  const saveCustomTasks = () => {
    localStorage.setItem(getCustomTasksKey(), JSON.stringify(customTasks));
    const newTasks = customTasks.map(task => ({ ...task, completed: false }));
    setTasks(newTasks);
    localStorage.setItem(getStorageKey(), JSON.stringify(newTasks));
    setIsDialogOpen(false);
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4 text-accent" />
          <span>{timeRemaining} para reiniciar</span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>EDITAR TAREAS DIARIAS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
              {customTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <Input 
                    value={task.title} 
                    onChange={(e) => handleCustomTaskChange(task.id, e.target.value)}
                    className="flex-grow"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeCustomTask(task.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addNewCustomTask} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Añadir Tarea
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={saveCustomTasks}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/60 transition-colors"
            >
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                aria-label={`Marcar ${task.title} como completa`}
              />
              <label
                htmlFor={task.id}
                className={`flex-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </label>
            </div>
          ))}
        </div>
        <div>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-right text-xs text-muted-foreground mt-2">{completedCount} de {tasks.length} completadas</p>
        </div>
      </CardContent>
    </Card>
  );
}
