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
import { Button, buttonVariants } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { TodoList } from './todo-list'; 
import { PlusCircle } from 'lucide-react';
import type { DayContentProps } from 'react-day-picker';


const priorityColors: Record<Priority, string> = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baja: 'bg-green-500',
};

function TaskDayContent({ date, tasks }: { date: Date; tasks: Task[] }) {
  const tasksForDay = tasks.filter((task) => task.dueDate && isSameDay(task.dueDate, date));

  return (
    <div className="flex h-full w-full flex-col items-start p-1.5">
      <span className="font-medium text-sm self-start">{format(date, 'd')}</span>
      {tasksForDay.length > 0 && (
        <div className="mt-1 flex flex-1 flex-wrap items-end gap-1">
          {tasksForDay.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className={cn('h-2 w-2 rounded-full', priorityColors[task.priority])}
              title={task.title}
            />
          ))}
          {tasksForDay.length > 3 && (
            <span className="text-xs font-bold text-muted-foreground">+{tasksForDay.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

function DayTasksModal({
  date,
  tasks,
  isOpen,
  onOpenChange,
  onTaskClick,
  onAddTaskClick
}: {
  date: Date | null;
  tasks: Task[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskClick: (task: Task) => void;
  onAddTaskClick: (date: Date) => void;
}) {
    if (!date) return null;
    const { getProjectById, toggleTaskCompletion } = useTasks();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{format(date, "eeee, d 'de' MMMM", { locale: es })}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                {tasks.length > 0 ? (
                    <div className="space-y-4 py-4">
                    {tasks.map((task) => (
                        <div
                        key={task.id}
                        className={cn(
                            'p-3 rounded-lg border-l-4 transition-colors',
                            task.completed ? 'bg-secondary/30' : 'bg-secondary/70'
                        )}
                        style={{
                            borderColor:
                            getProjectById(task.projectId || '')?.color ||
                            `hsl(var(--primary))`,
                        }}
                        >
                        <div className="flex items-start gap-3">
                            <Checkbox
                            id={`schedule-task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                            className="mt-1"
                            />
                            <div
                            className="flex-1 cursor-pointer"
                            onClick={() => onTaskClick(task)}
                            >
                            <p
                                className={cn(
                                'font-medium',
                                task.completed && 'line-through text-muted-foreground'
                                )}
                            >
                                {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {getProjectById(task.projectId || '')?.name || task.category}
                            </p>
                            </div>
                            <Badge
                            variant={
                                task.priority === 'alta'
                                ? 'destructive'
                                : task.priority === 'media'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="capitalize"
                            >
                            {task.priority}
                            </Badge>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="text-muted-foreground text-center py-10 space-y-4">
                        <p>No hay tareas programadas para este día.</p>
                         <Button variant="outline" onClick={() => onAddTaskClick(date)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Tarea
                        </Button>
                    </div>
                )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export function ScheduleView() {
  const { tasks, projects } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [initialTaskDate, setInitialTaskDate] = useState<Date | undefined>(undefined);

  const [activePriorities, setActivePriorities] = useState<Priority[]>(['alta', 'media', 'baja']);
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>([]);

  const tasksWithDueDate = useMemo(() => tasks.filter((task) => !!task.dueDate), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasksWithDueDate.filter((task) => {
      const priorityMatch = activePriorities.includes(task.priority);
      const projectMatch =
        activeProjectIds.length === 0 ||
        (task.projectId && activeProjectIds.includes(task.projectId));
      return priorityMatch && projectMatch;
    });
  }, [tasksWithDueDate, activePriorities, activeProjectIds]);

  const tasksForModal = useMemo(() => {
    if (!modalDate) return [];
    return filteredTasks.filter(
      (task) => task.dueDate && isSameDay(task.dueDate, modalDate)
    );
  }, [filteredTasks, modalDate]);

  const handlePriorityToggle = (priority: Priority) => {
    setActivePriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };
  
  const handleProjectToggle = (projectId: string) => {
    setActiveProjectIds(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  }

  const handleEditTask = (task: Task) => {
    setModalDate(null); // Close day modal
    setEditingTask(task);
  };

  const handleDayClick = (date: Date) => {
    setModalDate(date);
  }
  
  const handleAddTaskClick = (date: Date) => {
      setInitialTaskDate(date);
      setModalDate(null); // Close the day detail modal
      setAddTaskOpen(true); // Open the main task list / add task form
  }

  const priorityFilters: { id: Priority; label: string }[] = [
    { id: 'alta', label: 'Alta' },
    { id: 'media', label: 'Media' },
    { id: 'baja', label: 'Baja' },
  ];

  if (isAddTaskOpen) {
      return <TodoList initialDate={initialTaskDate} onBack={() => setAddTaskOpen(false)} />
  }

  return (
    <>
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                <span className="text-lg font-semibold uppercase tracking-wider">Cronograma</span>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        Filtros ({activePriorities.length + (activeProjectIds.length > 0 ? 1 : 0)})
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                    <div className="space-y-4">
                        <div>
                        <h4 className="font-medium text-sm mb-2">Prioridad</h4>
                        <div className="flex items-center gap-4">
                            {priorityFilters.map((p) => (
                            <div key={p.id} className="flex items-center space-x-2">
                                <Checkbox
                                id={`filter-${p.id}`}
                                checked={activePriorities.includes(p.id)}
                                onCheckedChange={() => handlePriorityToggle(p.id)}
                                />
                                <Label
                                htmlFor={`filter-${p.id}`}
                                className="text-sm font-medium capitalize"
                                >
                                {p.label}
                                </Label>
                            </div>
                            ))}
                        </div>
                        </div>
                        <div>
                        <h4 className="font-medium text-sm mb-2">Proyectos</h4>
                        <ScrollArea className="h-40">
                            <div className="flex flex-col gap-2">
                            {projects.map(project => (
                                <div key={project.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`filter-project-${project.id}`}
                                    checked={activeProjectIds.includes(project.id)}
                                    onCheckedChange={() => handleProjectToggle(project.id)}
                                />
                                <Label
                                    htmlFor={`filter-project-${project.id}`}
                                    className="text-sm font-medium capitalize flex items-center gap-2"
                                >
                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: project.color}}/>
                                    {project.name}
                                </Label>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                            {activeProjectIds.length > 0 && (
                            <Button variant="link" size="sm" onClick={() => setActiveProjectIds([])} className="p-0 h-auto mt-2">Limpiar filtros de proyecto</Button>
                            )}
                        </div>
                    </div>
                    </PopoverContent>
                </Popover>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar
                  mode="single"
                  month={currentMonth}
                  selected={modalDate ?? undefined}
                  onSelect={(day) => day && handleDayClick(day)}
                  onMonthChange={setCurrentMonth}
                  className="p-0"
                  classNames={{
                      months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                      month: 'space-y-4 w-full',
                      table: 'w-full border-collapse space-y-1',
                      head_row: 'flex',
                      head_cell: 'text-muted-foreground rounded-md w-full font-normal text-[0.8rem]',
                      row: 'flex w-full mt-2',
                      cell: 'h-14 md:h-24 w-full text-left p-0 relative',
                      day: cn(
                          buttonVariants({ variant: "ghost" }),
                          "h-full w-full p-0 font-normal aria-selected:opacity-100 flex flex-col items-start"
                        ),
                      day_selected:
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                  }}
                  components={{
                    DayContent: (dayProps: DayContentProps) => (
                      <TaskDayContent date={dayProps.date} tasks={filteredTasks} />
                    ),
                  }}
                />
            </CardContent>
        </Card>
      
        <DayTasksModal
            date={modalDate}
            tasks={tasksForModal}
            isOpen={!!modalDate}
            onOpenChange={(open) => !open && setModalDate(null)}
            onTaskClick={handleEditTask}
            onAddTaskClick={handleAddTaskClick}
        />

        {editingTask && (
            <TaskEditDialog
            isOpen={!!editingTask}
            onOpenChange={(open) => !open && setEditingTask(null)}
            task={editingTask}
            />
        )}
    </>
  );
}
