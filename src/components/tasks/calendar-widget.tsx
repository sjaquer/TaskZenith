'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTasks } from '@/contexts/task-context';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { tasks } = useTasks();

  const tasksForDate = tasks.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return date && 
           taskDate.getDate() === date.getDate() &&
           taskDate.getMonth() === date.getMonth() &&
           taskDate.getFullYear() === date.getFullYear();
  });

  return (
    <div className="h-full flex flex-col lg:flex-row gap-2 p-2 overflow-hidden">
      {/* Calendar Area - Flexible and scrollable */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow-sm p-2 sm:p-3 pointer-events-auto bg-background mx-auto scale-[0.85] sm:scale-90 lg:scale-100 transition-transform origin-center"
        />
      </div>

      {/* Tasks List Area - Responsive side or bottom */}
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
                            <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${task.completed ? 'bg-emerald-500' : 'bg-primary'}`} />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {task.title}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] text-muted-foreground border px-1 rounded bg-background/50">
                                        {task.priority}
                                    </span>
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
                    <p className="text-xs text-center">Sin tareas programadas</p>
                </div>
            )}
        </ScrollArea>
      </div>
    </div>
  );
}
