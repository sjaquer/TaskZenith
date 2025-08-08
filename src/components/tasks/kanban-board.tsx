'use client';

import { useMemo, useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import type { KanbanStatus, Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectLegend } from './project-legend';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const columns: KanbanStatus[] = ['Pendiente', 'En Progreso', 'Hecho', 'Finalizado', 'Cancelado'];
const statusToColor: Record<KanbanStatus, string> = {
  'Pendiente': 'bg-gray-500',
  'En Progreso': 'bg-blue-500',
  'Hecho': 'bg-green-500',
  'Finalizado': 'bg-purple-500',
  'Cancelado': 'bg-red-500'
}

function KanbanCard({ task }: { task: Task }) {
  const { getProjectById, updateTaskStatus } = useTasks();
  const project = task.projectId ? getProjectById(task.projectId) : undefined;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
  };
  
  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="mb-4 p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing bg-card/80 backdrop-blur-sm"
      style={{ borderTop: `4px solid ${project?.color || 'transparent'}` }}
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-start">
            <p className="font-medium text-sm mb-2">{task.title}</p>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground"><MoreHorizontal size={16} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {columns.filter(c => c !== task.status).map(status => (
                        <DropdownMenuItem key={status} onClick={() => updateTaskStatus(task.id, status)}>
                            Mover a {status}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground">{project?.name || 'Sin Proyecto'}</p>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ status, tasks }: { status: KanbanStatus; tasks: Task[] }) {
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
      className={`flex-1 min-w-[280px] rounded-lg p-2 transition-colors ${isOver ? 'bg-primary/20' : 'bg-secondary/30'}`}
    >
      <div className="flex items-center gap-2 p-2 mb-4">
        <span className={`w-3 h-3 rounded-full ${statusToColor[status]}`}></span>
        <h3 className="font-semibold">{status}</h3>
        <span className="text-sm text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="space-y-4 min-h-[200px]">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { tasks } = useTasks();

  const groupedTasks = useMemo(() => {
    return columns.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    }, {} as Record<KanbanStatus, Task[]>);
  }, [tasks]);

  return (
    <div className="space-y-4">
        <ProjectLegend />
        <div className="flex gap-6 pb-4 overflow-x-auto">
            {columns.map((status) => (
                <KanbanColumn key={status} status={status} tasks={groupedTasks[status] || []} />
            ))}
        </div>
    </div>
  );
}
