'use client';

import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { Check, ListTodo, AlertCircle, Clock } from 'lucide-react';

export function TaskStatsCards() {
  const { tasks } = useTasks();

  const stats = useMemo(() => {
    const pending = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;
    const highPriority = tasks.filter(task => !task.completed && task.priority === 'alta').length;
    const overdue = tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < new Date()).length;
    return { pending, completed, highPriority, overdue };
  }, [tasks]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 h-full p-2 content-start">
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg flex flex-col justify-between overflow-hidden min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2 sm:p-4">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Pendientes</CardTitle>
          <ListTodo className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.pending}</div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">Tareas activas</p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-emerald-500/20 shadow-lg flex flex-col justify-between overflow-hidden min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2 sm:p-4">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Hechas</CardTitle>
          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-500">{stats.completed}</div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">Finalizadas</p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-rose-500/20 shadow-lg flex flex-col justify-between overflow-hidden min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2 sm:p-4">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Alta Prio</CardTitle>
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-rose-500">{stats.highPriority}</div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">Urgentes</p>
        </CardContent>
      </Card>
      
      <Card className="bg-card/80 backdrop-blur-sm border-amber-500/20 shadow-lg flex flex-col justify-between overflow-hidden min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2 sm:p-4">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Vencidas</CardTitle>
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500">{stats.overdue}</div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">Retrasadas</p>
        </CardContent>
      </Card>
    </div>
  );
}
