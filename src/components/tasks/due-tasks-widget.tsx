'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, CalendarCheck2, Info } from 'lucide-react';
import type { Task } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function useRelativeTime(date: Date | null) {
    const [relativeTime, setRelativeTime] = useState('');
  
    useEffect(() => {
      if (!date) return;
  
      const updateRelativeTime = () => {
        setRelativeTime(formatDistanceToNow(date, { addSuffix: true, locale: es }));
      };
  
      updateRelativeTime();
      const intervalId = setInterval(updateRelativeTime, 60000); // Actualiza cada minuto
  
      return () => clearInterval(intervalId);
    }, [date]);
  
    return relativeTime;
}

function DueTaskItem({ task }: { task: Task }) {
    const { getProjectById } = useTasks();
    const relativeTime = useRelativeTime(task.dueDate ? new Date(task.dueDate) : null);
    const project = task.projectId ? getProjectById(task.projectId) : null;
  
    return (
      <div className="flex items-start justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors">
        <div className="flex-1">
          <p className="font-medium text-sm">{task.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {project ? project.name : task.category}
          </p>
        </div>
        <div className="text-xs text-right text-muted-foreground">
          <div className="flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>
    );
}

export function DueTasksWidget() {
  const { tasks } = useTasks();

  const { overdue, upcoming } = useMemo(() => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const overdueTasks = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate) < now
    ).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    const upcomingTasks = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate) > now && new Date(task.dueDate) <= twentyFourHoursFromNow
    ).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    return { overdue: overdueTasks, upcoming: upcomingTasks };
  }, [tasks]);

  const hasTasks = overdue.length > 0 || upcoming.length > 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold uppercase tracking-wider">Tareas Urgentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasTasks ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <Info className="w-8 h-8 mb-2 text-accent" />
            <p className="text-sm">Aquí aparecerán tus tareas con fecha de vencimiento próxima.</p>
            <p className="text-xs mt-1">¡Asigna fechas a tus tareas para verlas aquí!</p>
          </div>
        ) : (
            <>
            {overdue.length > 0 && (
            <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold mb-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                Vencidas
                </h3>
                <div className="space-y-1">
                {overdue.map(task => <DueTaskItem key={task.id} task={task} />)}
                </div>
            </div>
            )}
            {upcoming.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-2 text-yellow-500">
                    <CalendarCheck2 className="w-4 h-4" />
                    Próximas a Vencer (24h)
                    </h3>
                    <div className="space-y-1">
                    {upcoming.map(task => <DueTaskItem key={task.id} task={task} />)}
                    </div>
                </div>
            )}
            </>
        )}
      </CardContent>
    </Card>
  );
}
