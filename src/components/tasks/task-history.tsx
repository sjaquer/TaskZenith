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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function TaskHistory() {
  const { tasks } = useTasks();

  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => task.completed && task.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [tasks]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Tareas Completadas</CardTitle>
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
                    <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{task.category}</Badge>
                        </TableCell>
                        <TableCell>
                             <Badge variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'outline' : 'secondary'}>
                                {task.priority}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {format(new Date(task.completedAt!), "PPP", { locale: es })}
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Aún no hay tareas completadas. ¡Sigue adelante!
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
