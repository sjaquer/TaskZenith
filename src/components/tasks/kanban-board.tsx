'use client';

import { useMemo, useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import type { KanbanStatus, Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectLegend } from './project-legend';
import { MoreHorizontal, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TaskEditDialog } from './task-edit-dialog';

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

function KanbanColumn({ status, tasks, onEdit }: { status: KanbanStatus; tasks: Task[]; onEdit: (task: Task) => void }) {
  const { updateTaskStatus } = useTasks();
  const [isOver, setIsOver] = useState(false);

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
      <div className="space-y-4 min-h-[200px] p-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { tasks } = useTasks();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return tasks;
    return tasks.filter(task => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const groupedTasks = useMemo(() => {
    return columns.reduce((acc, status) => {
      acc[status] = filteredTasks.filter((task) => task.status === status);
      return acc;
    }, {} as Record<KanbanStatus, Task[]>);
  }, [filteredTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const closeEditDialog = () => {
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
        <ProjectLegend onProjectSelect={setSelectedProjectId} selectedProjectId={selectedProjectId} />
        <div className="flex gap-6 pb-4 overflow-x-auto">
            {columns.map((status) => (
                <KanbanColumn key={status} status={status} tasks={groupedTasks[status] || []} onEdit={handleEditTask} />
            ))}
        </div>
        {editingTask && (
            <TaskEditDialog
                isOpen={!!editingTask}
                onOpenChange={(open) => !open && closeEditDialog()}
                task={editingTask}
            />
        )}
    </div>
  );
}
