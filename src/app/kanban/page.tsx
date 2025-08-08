import { AppShell } from '@/components/layout/app-shell';
import { KanbanBoard } from '@/components/tasks/kanban-board';

export default function KanbanPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Project Kanban Board
          </h1>
        </div>
        <KanbanBoard />
      </div>
    </AppShell>
  );
}
