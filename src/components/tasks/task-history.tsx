'use client';

import { useMemo } from 'react';
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
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ClearCompletedTasksButton() {
    const { tasks, deleteCompletedTasks } = useTasks();
    const completedCount = useMemo(() => {
      return tasks.filter(t => t.completed).length
    }, [tasks]);
  
    if (completedCount === 0) return null;
  
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" /> Limpiar {completedCount} Tarea(s) Completada(s)
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la limpieza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente todas tus tareas completadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCompletedTasks} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar completadas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
}

export function TaskHistory() {
  const { tasks } = useTasks();

  const completedTasks = useMemo(() => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    return tasks
      .filter(task => task.completed && task.completedAt && new Date(task.completedAt) > fifteenDaysAgo)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [tasks]);

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg h-full">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <CardTitle className="text-lg font-semibold uppercase tracking-wider">Tareas Completadas (Últimos 15 días)</CardTitle>
        <ClearCompletedTasksButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarea</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="text-right">Completada el</TableHead>
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
                        <TableCell className="text-right">
                            {task.completedAt && format(new Date(task.completedAt), "PPP", { locale: es })}
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No hay tareas completadas en los últimos 15 días.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
