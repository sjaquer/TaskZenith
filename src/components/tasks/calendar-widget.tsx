'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTasks } from '@/contexts/task-context';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Priority } from '@/lib/types';

const priorityColors: Record<Priority, string> = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baja: 'bg-emerald-500',
};

export function CalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { tasks } = useTasks();

  // Mapa de fechas con tareas para mostrar indicadores en el calendario
  const taskDatesMap = useMemo(() => {
    const map = new Map<string, { count: number; priorities: Priority[] }>();
    tasks.forEach(task => {
      if (!task.dueDate) return;
      const d = new Date(task.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = map.get(key) || { count: 0, priorities: [] };
      existing.count++;
      if (!existing.priorities.includes(task.priority)) {
        existing.priorities.push(task.priority);
      }
      map.set(key, existing);
    });
    return map;
  }, [tasks]);

  const tasksForDate = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return date && 
             taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => {
      // Ordenar: no completadas primero, luego por prioridad
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pOrder: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }, [tasks, date]);

  // Modificador para días con tareas
  const modifiers = useMemo(() => {
    const daysWithTasks: Date[] = [];
    tasks.forEach(task => {
      if (task.dueDate) {
        daysWithTasks.push(new Date(task.dueDate));
      }
    });
    return { hasTasks: daysWithTasks };
  }, [tasks]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-2 p-2 overflow-hidden">
      {/* Calendar Area */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={modifiers}
          modifiersClassNames={{
            hasTasks: 'has-tasks-dot',
          }}
          className="rounded-md border shadow-sm p-2 sm:p-3 pointer-events-auto bg-background mx-auto scale-[0.85] sm:scale-90 lg:scale-100 transition-transform origin-center"
          components={{
            DayContent: ({ date: dayDate }) => {
              const key = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
              const info = taskDatesMap.get(key);
              return (
                <div className="relative flex flex-col items-center">
                  <span>{dayDate.getDate()}</span>
                  {info && (
                    <div className="flex gap-0.5 mt-0.5">
                      {info.priorities.slice(0, 3).map((p, i) => (
                        <div
                          key={i}
                          className={cn('w-1 h-1 rounded-full', priorityColors[p])}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
      </div>

      {/* Tasks List Area */}
      <div className="flex-1 min-h-0 flex flex-col border rounded-lg bg-secondary/10 overflow-hidden">
        <div className="p-3 border-b bg-secondary/20 font-medium text-sm flex items-center gap-2">
           <CalendarIcon className="w-4 h-4 text-primary" />
           <span className="truncate">
             {date?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long'})}
           </span>
           <Badge variant="secondary" className="ml-auto text-xs">{tasksForDate.length}</Badge>
        </div>
        
        <ScrollArea className="flex-1 p-0">
            {tasksForDate.length > 0 ? (
                <div className="divide-y divide-border/50">
                    {tasksForDate.map(task => (
                        <div key={task.id} className="p-3 hover:bg-secondary/30 transition-colors flex items-start gap-3 group">
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-1.5 shrink-0',
                              task.completed ? 'bg-emerald-500' : priorityColors[task.priority]
                            )} />
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-sm truncate',
                                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                )}>
                                    {task.title}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className={cn(
                                      "text-[10px] border px-1.5 py-0.5 rounded capitalize",
                                      task.priority === 'alta' && 'text-red-500 border-red-500/30 bg-red-500/10',
                                      task.priority === 'media' && 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
                                      task.priority === 'baja' && 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
                                    )}>
                                        {task.priority}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground border px-1.5 py-0.5 rounded bg-background/50 capitalize">
                                        {task.status}
                                    </span>
                                    {task.dueDate && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(task.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground gap-2">
                    <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 opacity-40" />
                    </div>
                    <p className="text-xs text-center">Sin tareas programadas para este día</p>
                </div>
            )}
        </ScrollArea>
      </div>
    </div>
  );
}
