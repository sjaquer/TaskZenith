'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTasks } from '@/contexts/task-context';
import type { Task, Priority } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { TaskEditDialog } from './task-edit-dialog';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

const priorityFilters: { id: Priority; label: string }[] = [
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' },
];

const priorityDotColor: Record<Priority, string> = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baja: 'bg-green-500',
};

function DayWithTasks(day: Date, tasks: Task[]) {
  const tasksForDay = tasks.filter(task => task.dueDate && isSameDay(task.dueDate, day));
  
  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <span>{format(day, 'd')}</span>
      {tasksForDay.length > 0 && (
        <div className="absolute bottom-1 flex space-x-1">
          {tasksForDay.slice(0, 3).map((task) => (
            <div key={task.id} className={`h-1.5 w-1.5 rounded-full ${priorityDotColor[task.priority]}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectedDayTasks({ date, tasks, onTaskClick }: { date: Date, tasks: Task[], onTaskClick: (task: Task) => void }) {
    const { getProjectById, toggleTaskCompletion } = useTasks();

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{format(date, "eeee, d 'de' MMMM", { locale: es })}</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    {tasks.length > 0 ? (
                        <div className="space-y-4">
                            {tasks.map(task => (
                                <div key={task.id} className={cn("p-3 rounded-lg border-l-4", task.completed ? 'bg-secondary/30' : 'bg-secondary/70')} style={{ borderColor: getProjectById(task.projectId || '')?.color || `hsl(var(--primary))`}}>
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id={`schedule-task-${task.id}`}
                                            checked={task.completed}
                                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 cursor-pointer" onClick={() => onTaskClick(task)}>
                                            <p className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {getProjectById(task.projectId || '')?.name || task.category}
                                            </p>
                                        </div>
                                        <Badge variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'secondary' : 'outline'} className="capitalize">{task.priority}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center pt-10">No hay tareas programadas para este día.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

export function ScheduleView() {
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activePriorities, setActivePriorities] = useState<Priority[]>(['alta', 'media', 'baja']);
  
  const tasksWithDueDate = useMemo(() => tasks.filter(task => !!task.dueDate), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasksWithDueDate.filter(task => activePriorities.includes(task.priority));
  }, [tasksWithDueDate, activePriorities]);
  
  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return filteredTasks.filter(task => task.dueDate && isSameDay(task.dueDate, selectedDay));
  }, [filteredTasks, selectedDay]);

  const handlePriorityToggle = (priority: Priority) => {
    setActivePriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Calendario</span>
                        <div className="flex items-center gap-4">
                            {priorityFilters.map(p => (
                                <div key={p.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`filter-${p.id}`}
                                        checked={activePriorities.includes(p.id)}
                                        onCheckedChange={() => handlePriorityToggle(p.id)}
                                    />
                                    <Label htmlFor={`filter-${p.id}`} className="text-sm font-medium capitalize">{p.label}</Label>
                                </div>
                            ))}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={selectedDay}
                        onSelect={setSelectedDay}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="p-0"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4 w-full",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-16 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-16 w-full p-1 font-normal aria-selected:opacity-100",
                        }}
                        components={{
                            Day: ({ date }) => DayWithTasks(date, filteredTasks),
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            {selectedDay ? (
                <SelectedDayTasks date={selectedDay} tasks={tasksForSelectedDay} onTaskClick={handleEditTask} />
            ) : (
                <Card className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Selecciona un día para ver las tareas</p>
                </Card>
            )}
        </div>
        {editingTask && (
            <TaskEditDialog
                isOpen={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                task={editingTask}
            />
        )}
    </div>
  );
}
