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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

function DayWithTasks({
  date,
  tasks,
  onTaskClick,
}: {
  date: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const tasksForDay = tasks
    .filter((task) => task.dueDate && isSameDay(task.dueDate, date))
    .sort((a, b) => {
        const priorityOrder = { alta: 1, media: 2, baja: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return (
    <div className="relative flex flex-col h-full">
      <span className="font-medium text-sm p-1.5">{format(date, 'd')}</span>
      <div className="flex-1 overflow-y-auto mt-1 space-y-1 px-1 tiny-scrollbar">
        {tasksForDay.map((task) => (
          <button
            key={task.id}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
            className={cn(
              'w-full text-left text-xs px-1.5 py-0.5 rounded-sm truncate transition-colors',
              task.priority === 'alta'
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-100'
                : task.priority === 'media'
                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100'
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-100'
            )}
          >
            {task.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectedDayTasks({
  date,
  tasks,
  onTaskClick,
}: {
  date: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
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
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 rounded-lg border-l-4',
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
            <p className="text-muted-foreground text-center pt-10">
              No hay tareas programadas para este día.
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function ScheduleView() {
  const { tasks, projects } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activePriorities, setActivePriorities] = useState<Priority[]>([
    'alta',
    'media',
    'baja',
  ]);
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

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return filteredTasks.filter(
      (task) => task.dueDate && isSameDay(task.dueDate, selectedDay)
    );
  }, [filteredTasks, selectedDay]);

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
    setEditingTask(task);
  };

  const priorityFilters: { id: Priority; label: string }[] = [
    { id: 'alta', label: 'Alta' },
    { id: 'media', label: 'Media' },
    { id: 'baja', label: 'Baja' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-lg font-semibold uppercase tracking-wider">Cronograma</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Filtros ({activePriorities.length + (activeProjectIds.length > 0 ? 1: 0)})
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
              selected={selectedDay}
              onSelect={setSelectedDay}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="p-0"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4 w-full',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell:
                  'text-muted-foreground rounded-md w-full font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: 'h-24 text-sm text-left p-0 relative [&:has([aria-selected])]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-24 w-full p-0 font-normal aria-selected:opacity-100 flex flex-col items-start',
              }}
              components={{
                Day: ({ date }) => (
                  <DayWithTasks
                    date={date}
                    tasks={filteredTasks}
                    onTaskClick={handleEditTask}
                  />
                ),
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        {selectedDay ? (
          <SelectedDayTasks
            date={selectedDay}
            tasks={tasksForSelectedDay}
            onTaskClick={handleEditTask}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">
              Selecciona un día para ver las tareas
            </p>
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
