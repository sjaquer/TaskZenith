'use client';

import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '../ui/badge';
import { Book, Briefcase, User, FolderKanban } from 'lucide-react';

const categoryIcons: { [key: string]: React.ElementType } = {
  estudio: Book,
  trabajo: Briefcase,
  personal: User,
  proyectos: FolderKanban,
};

export function DailyDashboard() {
  const { tasks, toggleTaskCompletion } = useTasks();
  
  const todaysTasks = tasks.filter(task => !task.completed).slice(0, 5);
  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.filter(task => !task.completed).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Foco de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysTasks.length > 0 ? (
            <div className="space-y-4">
              {todaysTasks.map(task => {
                const Icon = categoryIcons[task.category];
                return (
                  <div key={task.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-primary/20 transition-colors">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      aria-label={`Marcar ${task.title} como completa`}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${task.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.title}
                      </label>
                    </div>
                    <Badge variant={task.priority === 'alta' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay tareas para hoy. ¡Disfruta tu descanso!</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resumen de Tareas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex justify-between items-center">
             <p className="font-medium">Tareas Pendientes</p>
             <p className="text-2xl font-bold">{pendingCount}</p>
           </div>
           <div className="flex justify-between items-center">
             <p className="font-medium">Tareas Completadas</p>
             <p className="text-2xl font-bold">{completedCount}</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
