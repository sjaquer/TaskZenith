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
import type { CustomDailyTask } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type DailyTaskItemProps = {
    task: { id: string; title: string; completed: boolean; time?: string };
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
        <div className="flex-1 flex justify-between items-center">
          <label
              htmlFor={`daily-${task.id}`}
              className={`font-medium leading-none cursor-pointer ${
              task.completed ? 'line-through text-muted-foreground' : ''
              }`}
          >
              {task.title}
          </label>
          {task.time && (
            <span className="text-xs text-muted-foreground bg-secondary/70 px-2 py-1 rounded-md">{task.time}</span>
          )}
        </div>
        </div>
    );
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

export function DailyTodoList() {
  const { dailyTasks, toggleDailyTask, updateCustomDailyTasks, customDailyTasks, isLoaded } = useTasks();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editableCustomTasks, setEditableCustomTasks] = useState<CustomDailyTask[]>([]);

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
  
  const handleTimeChange = (id: string, newTime: string) => {
    setEditableCustomTasks(editableCustomTasks.map(task => task.id === id ? { ...task, time: newTime === "none" ? undefined : newTime } : task));
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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight uppercase text-primary/80">
          TAREAS DIARIAS
        </h2>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                <Timer className="w-4 h-4 text-accent" />
                <span className="hidden sm:inline">{timeRemaining} para reiniciar</span>
                <span className="sm:hidden">{timeRemaining}</span>
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
                         <Select value={task.time || "none"} onValueChange={(value) => handleTimeChange(task.id, value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Hora" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin hora</SelectItem>
                                {hours.map(h => minutes.map(m => (
                                    <SelectItem key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</SelectItem>
                                )))}
                            </SelectContent>
                        </Select>
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
          {dailyTasks.sort((a,b) => (a.time || "25").localeCompare(b.time || "25")).map(task => (
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
