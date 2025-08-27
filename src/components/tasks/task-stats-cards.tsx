'use client';

import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { Check, ListTodo } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function TaskStatsCards() {
  const { tasks } = useTasks();
  const { user } = useAuth();

  const stats = useMemo(() => {
    const userTasks = user ? tasks.filter(task => task.userId === user.uid) : [];
    const pending = userTasks.filter(task => !task.completed).length;
    const completed = userTasks.filter(task => task.completed).length;
    return { pending, completed };
  }, [tasks, user]);

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium uppercase">PENDIENTES</CardTitle>
          <ListTodo className="w-5 h-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-accent">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">Tareas por completar.</p>
        </CardContent>
      </Card>
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium uppercase">COMPLETADAS</CardTitle>
          <Check className="w-5 h-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{stats.completed}</div>
           <p className="text-xs text-muted-foreground">Total de tareas finalizadas.</p>
        </CardContent>
      </Card>
    </>
  );
}
