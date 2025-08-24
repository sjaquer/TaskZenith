'use client';

import { DailyDashboard } from '@/components/tasks/daily-dashboard';
import { TodoList } from '@/components/tasks/todo-list';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskHistory } from '@/components/tasks/task-history';
import { DailyTodoList } from '@/components/tasks/daily-todo-list';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

function SyncButton() {
  const { syncData, isSyncing } = useTasks();
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      await syncData();
      toast({
        title: '¡Sincronizado!',
        description: 'Tus datos están actualizados.',
        className: 'bg-primary text-primary-foreground',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de Sincronización',
        description: 'No se pudieron obtener los datos más recientes.',
      });
    }
  };

  return (
    <Button onClick={handleSync} disabled={isSyncing} variant="outline">
      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
    </Button>
  );
}

export default function DashboardPage() {
  return (
    <PageWrapper>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-blue-950/20">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex justify-end mb-4">
             <SyncButton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold tracking-tight mb-4 uppercase text-primary/80">
                Panel Principal
              </h2>
              <DailyDashboard />
            </div>

            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold tracking-tight mb-4 uppercase text-primary/80">
                Tareas Diarias
              </h2>
              <DailyTodoList />
            </div>

            <div className="lg:col-span-3">
              <TodoList />
            </div>
            
            <div className="lg:col-span-3">
               <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
                Tablero Kanban
              </h2>
              <KanbanBoard />
            </div>
            
            <div className="lg:col-span-3">
               <h2 className="mb-4 text-2xl font-bold tracking-tight uppercase text-primary/80">
                Historial de Tareas
              </h2>
              <TaskHistory />
            </div>
          </div>
        </main>
      </div>
    </PageWrapper>
  );
}
