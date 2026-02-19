'use client';
import { TaskHistory } from '@/components/tasks/task-history';

export default function HistoryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight font-headline">
          Historial de Tareas
        </h1>
      </div>
      <TaskHistory />
    </div>
  );
}
