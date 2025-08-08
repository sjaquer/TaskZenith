import { DailyDashboard } from '@/components/tasks/daily-dashboard';
import { TodoList } from '@/components/tasks/todo-list';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskHistory } from '@/components/tasks/task-history';
import { DailyTodoList } from '@/components/tasks/daily-todo-list';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-blue-950/20">
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          <div className="lg:col-span-2 xl:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 uppercase text-primary/80">
              Panel Principal
            </h2>
            <DailyDashboard />
          </div>

          <div className="lg:col-span-2 xl:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight mb-4 uppercase text-primary/80">
              Tareas Diarias
            </h2>
            <DailyTodoList />
          </div>

          <div className="md:col-span-2 lg:col-span-4 xl:col-span-5">
            <TodoList />
          </div>
          
          <div className="md:col-span-2 lg:col-span-4 xl:col-span-3">
             <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
              Tablero Kanban
            </h2>
            <KanbanBoard />
          </div>
          
          <div className="md:col-span-2 lg:col-span-4 xl:col-span-2">
             <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
              Historial de Tareas
            </h2>
            <TaskHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
