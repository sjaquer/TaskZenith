'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Timer, Settings, Plus, Trash2 } from 'lucide-react';
import { useTasks } from '@/contexts/task-context';

type DailyTaskItemProps = {
    task: { id: string; title: string; completed: boolean };
    onToggle: (id: string) => void;
};
  
function DailyTaskItem({ task, onToggle }: DailyTaskItemProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleToggle = () => {
      if (!task.completed) {
        setIsAnimating(true);
        setTimeout(() => {
          onToggle(task.id);
          setIsAnimating(false);
        }, 600); // Duration of celebration animation
      } else {
        onToggle(task.id); // Allow un-checking without animation
      }
    };

    return (
        <div
        className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/60 transition-all ${
            isAnimating ? 'task-celebrate-animation' : ''
        }`}
        >
        <Checkbox
            id={`daily-${task.id}`}
            checked={task.completed}
            onCheckedChange={handleToggle}
            aria-label={`Marcar ${task.title} como completa`}
        />
        <label
            htmlFor={`daily-${task.id}`}
            className={`flex-1 font-medium leading-none cursor-pointer ${
            task.completed ? 'line-through text-muted-foreground' : ''
            }`}
        >
            {task.title}
        </label>
        </div>
    );
}

export function DailyTodoList() {
  const { dailyTasks, toggleDailyTask, updateCustomDailyTasks, customDailyTasks, isLoaded } = useTasks();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableCustomTasks, setEditableCustomTasks] = useState(customDailyTasks);

  useEffect(() => {
    if (isLoaded) {
      setEditableCustomTasks(customDailyTasks);
    }
  }, [customDailyTasks, isLoaded]);
  
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

  const handleCustomTaskChange = (id: string, newTitle: string) => {
    setEditableCustomTasks(editableCustomTasks.map(task => task.id === id ? { ...task, title: newTitle } : task));
  };

  const addNewCustomTask = () => {
    setEditableCustomTasks([...editableCustomTasks, { id: `custom-daily-${Date.now()}`, title: '' }]);
  };

  const removeCustomTask = (id: string) => {
    setEditableCustomTasks(editableCustomTasks.filter(task => task.id !== id));
  };

  const saveCustomTasks = () => {
    updateCustomDailyTasks(editableCustomTasks.filter(t => t.title.trim() !== ''));
    setIsDialogOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setEditableCustomTasks(customDailyTasks);
    }
    setIsDialogOpen(open);
  }

  const completedCount = dailyTasks.filter(task => task.completed).length;
  const progress = dailyTasks.length > 0 ? (completedCount / dailyTasks.length) * 100 : 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight uppercase text-primary/80">
          TAREAS DIARIAS
        </h2>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4 text-accent" />
                <span>{timeRemaining} para reiniciar</span>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>EDITAR TAREAS DIARIAS</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
                    {editableCustomTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                        <Input 
                            value={task.title} 
                            onChange={(e) => handleCustomTaskChange(task.id, e.target.value)}
                            className="flex-grow"
                            placeholder="Nueva tarea diaria..."
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {dailyTasks.map(task => (
            <DailyTaskItem key={task.id} task={task} onToggle={toggleDailyTask} />
          ))}
        </div>
        <div>
          <Progress value={progress} className="w-full h-2 bg-secondary/80" />
          <p className="text-right text-xs text-muted-foreground mt-2">{completedCount} de {dailyTasks.length} completadas</p>
        </div>
      </CardContent>
    </Card>
  );
}
