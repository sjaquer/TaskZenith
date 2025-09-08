'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Trash2, RotateCcw, Timer } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

function useCountdown(targetDate: Date | null) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const distance = targetDate.getTime() - now.getTime();

      if (distance < 0) {
        setCountdown("Listo para limpiar");
        clearInterval(interval);
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

function ClearCompletedTasksButton() {
    const { tasks, deleteCompletedTasks } = useTasks();
    
    const tasksToDelete = useMemo(() => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        return tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) < fiveDaysAgo);
    }, [tasks]);

    const oldestTask = useMemo(() => {
      const completedTasks = tasks.filter(t => t.completed && t.completedAt).sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
      return completedTasks[0] || null;
    }, [tasks]);

    const deletionTargetDate = useMemo(() => {
      if (!oldestTask || !oldestTask.completedAt) return null;
      return addDays(new Date(oldestTask.completedAt), 5);
    }, [oldestTask]);
    
    const countdown = useCountdown(deletionTargetDate);

    return (
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {countdown && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-secondary/50 rounded-md">
            <Timer className="h-4 w-4 text-accent"/>
            <span>Próxima limpieza en: {countdown}</span>
          </div>
        )}
        {tasksToDelete.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Limpiar {tasksToDelete.length} Tarea(s) Antigua(s)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmas la limpieza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán permanentemente las tareas completadas hace más de 5 días.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteCompletedTasks} className="bg-destructive hover:bg-destructive/90">
                  Sí, eliminar antiguas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
}

export function TaskHistory() {
  const { tasks, restoreTask } = useTasks();

  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => task.completed && task.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [tasks]);

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg h-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle className="text-lg font-semibold uppercase tracking-wider">Tareas Completadas</CardTitle>
        <ClearCompletedTasksButton />
      </CardHeader>
      <CardContent>
        {/* Responsive container: On small screens, this renders as a list of cards. On medium and up, it's a table. */}
        <div className="md:hidden">
            {completedTasks.length > 0 ? (
                <div className="space-y-4">
                    {completedTasks.map(task => (
                        <div key={task.id} className="p-4 rounded-lg bg-secondary/60 flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="font-medium whitespace-normal">{task.title}</p>
                                <div className='flex flex-col sm:flex-row sm:items-center gap-2 text-xs'>
                                    <Badge variant="secondary" className="capitalize w-fit">{task.category}</Badge>
                                    <Badge variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'secondary' : 'outline'} className="uppercase w-fit">
                                        {task.priority}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {task.completedAt && format(new Date(task.completedAt), "'Completada el' PPP", { locale: es })}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => restoreTask(task.id)} title="Restaurar Tarea">
                                <RotateCcw className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                    No hay tareas completadas en tu historial.
                </div>
            )}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Completada el</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.length > 0 ? (
                  completedTasks.map(task => (
                      <TableRow key={task.id} className="hover:bg-secondary/60">
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                              <Badge variant="secondary" className="capitalize">{task.category}</Badge>
                          </TableCell>
                          <TableCell>
                               <Badge variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'secondary' : 'outline'} className="uppercase">
                                  {task.priority}
                              </Badge>
                          </TableCell>
                          <TableCell>
                              {task.completedAt && format(new Date(task.completedAt), "PPP", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => restoreTask(task.id)} title="Restaurar Tarea">
                                  <RotateCcw className="h-4 w-4 text-primary" />
                              </Button>
                          </TableCell>
                      </TableRow>
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No hay tareas completadas en tu historial.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
