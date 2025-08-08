import { DailyDashboard } from '@/components/tasks/daily-dashboard';
import { TodoList } from '@/components/tasks/todo-list';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskHistory } from '@/components/tasks/task-history';
import { Bot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-accent" />
          <h1 className="text-xl font-semibold font-headline">TaskZenith</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-8 md:p-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Panel Principal
          </h1>
          <DailyDashboard />
        </section>
        
        <Separator />
        
        <section>
          <h1 className="mb-4 text-3xl font-bold tracking-tight font-headline">
            Lista de Tareas
          </h1>
          <TodoList />
        </section>

        <Separator />
        
        <section>
           <h1 className="mb-4 text-3xl font-bold tracking-tight font-headline">
            Tablero Kanban del Proyecto
          </h1>
          <KanbanBoard />
        </section>
        
        <Separator />
        
        <section>
          <h1 className="mb-4 text-3xl font-bold tracking-tight font-headline">
            Historial de Tareas
          </h1>
          <TaskHistory />
        </section>
      </main>
    </div>
  );
}
