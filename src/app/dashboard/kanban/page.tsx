'use client';
import { KanbanBoard } from '@/components/tasks/kanban-board';

export default function KanbanPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight font-headline">
          Tablero Kanban
        </h1>
      </div>
      <KanbanBoard />
    </div>
  );
}
