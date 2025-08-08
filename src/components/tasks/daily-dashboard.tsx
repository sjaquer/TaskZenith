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
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-1 md:col-span-2 bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold uppercase tracking-wider">Foco de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysTasks.length > 0 ? (
            <div className="space-y-4">
              {todaysTasks.map(task => {
                const Icon = categoryIcons[task.category];
                return (
                  <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/60 transition-colors">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      aria-label={`Marcar ${task.title} como completa`}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${task.id}`}
                        className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.title}
                      </label>
                    </div>
                    <Badge variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'secondary' : 'outline'}>{task.priority.toUpperCase()}</Badge>
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
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold uppercase tracking-wider">Pendientes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
            <p className="text-6xl font-bold text-accent">{pendingCount}</p>
        </CardContent>
      </Card>
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold uppercase tracking-wider">Completadas</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
            <p className="text-6xl font-bold text-primary">{completedCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
