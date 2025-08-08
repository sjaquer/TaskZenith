'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Timer } from 'lucide-react';

const initialDailyTasks = [
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

const getStorageKey = () => {
  const today = new Date();
  return `dailyTasks-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
};

export function DailyTodoList() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const storageKey = getStorageKey();
    const storedTasks = localStorage.getItem(storageKey);
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      localStorage.removeItem(
        `dailyTasks-${new Date(Date.now() - 86400000).toISOString().split('T')[0]}`
      );
      const newTasks = initialDailyTasks.map(task => ({ ...task, completed: false }));
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
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mis Quehaceres Diarios</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>{timeRemaining} para reiniciar</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                aria-label={`Marcar ${task.title} como completa`}
              />
              <label
                htmlFor={task.id}
                className={`flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
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
