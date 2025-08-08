import { DailyDashboard } from '@/components/tasks/daily-dashboard';
import { TodoList } from '@/components/tasks/todo-list';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskHistory } from '@/components/tasks/task-history';
import { DailyTodoList } from '@/components/tasks/daily-todo-list';
import { Bot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-blue-950/50">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold">TaskZenith</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-12 md:p-8">
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Panel Principal
          </h2>
          <DailyDashboard />
        </section>
        
        <Separator className="bg-white/10" />

        <section>
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Tareas Diarias
          </h2>
          <DailyTodoList />
        </section>

        <Separator className="bg-white/10" />
        
        <section>
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Mi Lista de Tareas
          </h2>
          <TodoList />
        </section>

        <Separator className="bg-white/10" />
        
        <section>
           <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Tablero Kanban del Proyecto
          </h2>
          <KanbanBoard />
        </section>
        
        <Separator className="bg-white/10" />
        
        <section>
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Historial de Tareas
          </h2>
          <TaskHistory />
        </section>
      </main>
    </div>
  );
}
