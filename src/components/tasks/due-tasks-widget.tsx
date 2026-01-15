'use client';

import { useMemo } from 'react';
import { useTasks } from '@/contexts/task-context';
import { AlertTriangle, Clock, CalendarCheck } from 'lucide-react';
import type { Task } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function useRelativeTime(date: Date | null) {
    if (!date) return '';
    const now = new Date();
    const isPast = now > date;
    const distance = formatDistanceToNowStrict(date, { addSuffix: true, locale: es });
    return isPast ? `Venció ${distance}` : `Vence ${distance}`;
}

function DueTaskItem({ task }: { task: Task }) {
    const { getProjectById } = useTasks();
    const relativeTime = useRelativeTime(task.dueDate ? new Date(task.dueDate) : null);
    const project = task.projectId ? getProjectById(task.projectId) : null;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
    return (
      <div className={`
        flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-md mb-2 border transition-colors
        ${isOverdue ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10' : 'bg-background border-border hover:bg-secondary/50'}
      `}>
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
             <span className={`font-medium text-sm truncate ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                {task.title}
             </span>
             {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] h-5 px-1 truncate max-w-[100px]">
                {project ? project.name : (task.category || 'Sin categoría')}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 mt-2 sm:mt-0 text-xs text-muted-foreground whitespace-nowrap bg-secondary/50 px-2 py-1 rounded shrink-0">
            <Clock className="w-3 h-3" />
            <span>{relativeTime}</span>
        </div>
      </div>
    );
}

export function DueTasksWidget() {
  const { tasks } = useTasks();

  const { overdue, upcoming } = useMemo(() => {
    const now = new Date();
    const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const overdueTasks = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate) < now
    ).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    const upcomingTasks = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate) > now && new Date(task.dueDate) <= fortyEightHours
    ).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    return { overdue: overdueTasks, upcoming: upcomingTasks };
  }, [tasks]);

  const hasTasks = overdue.length > 0 || upcoming.length > 0;

  return (
    <div className="h-full flex flex-col">
        {!hasTasks ? (
           <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground p-6 border-2 border-dashed rounded-lg bg-muted/10 h-full">
            <CalendarCheck className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm font-medium">¡Todo en orden!</p>
            <p className="text-xs opacity-70 mt-1">No hay tareas urgentes para las próximas 48h.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 h-full pr-3 -mr-3">
             <div className="space-y-4 pb-2">
                {overdue.length > 0 && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-destructive mb-2 sticky top-0 bg-background/95 backdrop-blur py-1 z-10 border-b">
                            Atención Requerida ({overdue.length})
                        </h4>
                        <div>
                            {overdue.map(task => <DueTaskItem key={task.id} task={task} />)}
                        </div>
                    </div>
                )}

                {upcoming.length > 0 && (
                    <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2 sticky top-0 bg-background/95 backdrop-blur py-1 z-10 border-b">
                            Próximas 48h ({upcoming.length})
                        </h4>
                        <div>
                            {upcoming.map(task => <DueTaskItem key={task.id} task={task} />)}
                        </div>
                    </div>
                )}
             </div>
          </ScrollArea>
        )}
    </div>
  );
}
