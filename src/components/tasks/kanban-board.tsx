'use client';

import { useMemo, useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import type { KanbanStatus, Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectLegend } from './project-legend';
import { MoreHorizontal, Edit, KanbanSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TaskEditDialog } from './task-edit-dialog';
import Link from 'next/link';

const columns: KanbanStatus[] = ['Pendiente', 'En Progreso', 'Hecho', 'Finalizado', 'Cancelado'];
const statusToColor: Record<KanbanStatus, string> = {
  'Pendiente': 'bg-gray-400',
  'En Progreso': 'bg-blue-500',
  'Hecho': 'bg-yellow-500',
  'Finalizado': 'bg-green-500',
  'Cancelado': 'bg-red-500'
}

function KanbanCard({ task, onEdit }: { task: Task, onEdit: (task: Task) => void }) {
  const { getProjectById, updateTaskStatus } = useTasks();
  const project = task.projectId ? getProjectById(task.projectId) : undefined;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
  };
  
  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="mb-4 p-4 rounded-lg shadow-md cursor-grab active:cursor-grabbing bg-card/90 backdrop-blur-sm"
      style={{ borderLeft: `5px solid ${project?.color || 'hsl(var(--primary))'}` }}
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-start">
            <p className="font-medium text-sm mb-2 mr-2">{task.title}</p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex-shrink-0 text-muted-foreground hover:text-foreground"><MoreHorizontal size={16} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Tarea
                    </DropdownMenuItem>
                    {columns.filter(c => c !== task.status).map(status => (
                        <DropdownMenuItem key={status} onClick={() => updateTaskStatus(task.id, status)}>
                            Mover a {status}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground capitalize">{project?.name || 'Sin Proyecto'}</p>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ status, tasks }: { status: KanbanStatus; tasks: Task[]; }) {
  const { updateTaskStatus } = useTasks();
  const [isOver, setIsOver] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
        updateTaskStatus(taskId, status);
    }
    setIsOver(false);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[280px] sm:min-w-[300px] rounded-lg p-3 transition-colors ${isOver ? 'bg-primary/20' : 'bg-secondary/30'}`}
    >
      <div className="flex items-center gap-3 p-2 mb-4">
        <span className={`w-3 h-3 rounded-full ${statusToColor[status]}`}></span>
        <h3 className="font-semibold uppercase tracking-wider">{status}</h3>
        <span className="text-sm font-bold text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <div className="space-y-4 p-1 max-h-[500px] overflow-y-auto">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={handleEditTask} />
        ))}
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

export function KanbanBoard({ taskLimit }: { taskLimit?: number }) {
  const { tasks, projects } = useTasks();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const projectTasks = useMemo(() => {
    const allProjectTasks = tasks.filter(task => task.projectId);
    if (!selectedProjectId) {
      return allProjectTasks;
    }
    return allProjectTasks.filter(task => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);


  const groupedTasks = useMemo(() => {
    return columns.reduce((acc, status) => {
      let tasksForColumn = projectTasks.filter((task) => task.status === status);
      if (taskLimit) {
        tasksForColumn = tasksForColumn.slice(0, taskLimit);
      }
      acc[status] = tasksForColumn;
      return acc;
    }, {} as Record<KanbanStatus, Task[]>);
  }, [projectTasks, taskLimit]);
  
  const showButton = taskLimit && projectTasks.some(task => {
    const column = groupedTasks[task.status];
    return column && column.length >= taskLimit;
  });

  if (projects.length === 0) {
    return (
        <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card/80">
            <KanbanSquare className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold">El tablero Kanban es para proyectos.</h3>
            <p className="text-sm">Crea tu primer proyecto para empezar a usar el tablero.</p>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        <ProjectLegend onProjectSelect={setSelectedProjectId} selectedProjectId={selectedProjectId} />
        <div className="flex flex-col md:flex-row gap-6 pb-4 overflow-x-auto">
            {columns.map((status) => (
                <KanbanColumn 
                    key={status} 
                    status={status} 
                    tasks={groupedTasks[status] || []} 
                />
            ))}
        </div>
        {showButton && (
            <div className="text-center mt-4">
                <Button asChild variant="secondary">
                    <Link href="/dashboard/kanban">Ver tablero completo</Link>
                </Button>
            </div>
        )}
    </div>
  );
}
