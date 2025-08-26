'use client';

import { useMemo } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertOctagon, Info } from 'lucide-react';
import type { Task } from '@/lib/types';
import { TaskEditDialog } from './task-edit-dialog';
import { useState } from 'react';

function PriorityTaskItem({ task }: { task: Task }) {
  const { getProjectById } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const project = task.projectId ? getProjectById(task.projectId) : undefined;
  
  return (
    <>
      <div 
        className="flex items-start justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
        onClick={() => setEditingTask(task)}
      >
        <div className="flex-1">
          <p className="font-medium text-sm">{task.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {task.category}
            {project && ` / ${project.name}`}
          </p>
        </div>
        <div className="text-xs text-right text-muted-foreground">
          {/* Potentially add more info here if needed */}
        </div>
      </div>
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

export function HighPriorityTasksWidget() {
  const { tasks } = useTasks();

  const highPriorityTasks = useMemo(() => {
    return tasks.filter(
      (task) => !task.completed && task.priority === 'alta'
    ).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [tasks]);

  const hasTasks = highPriorityTasks.length > 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold uppercase tracking-wider">Tareas Prioritarias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasTasks ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <Info className="w-8 h-8 mb-2 text-accent" />
            <p className="text-sm">Aquí aparecerán tus tareas marcadas como de alta prioridad.</p>
          </div>
        ) : (
            <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold mb-2 text-red-500">
                <AlertOctagon className="w-4 h-4" />
                Atención Requerida
                </h3>
                <div className="space-y-1">
                {highPriorityTasks.map(task => <PriorityTaskItem key={task.id} task={task} />)}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
