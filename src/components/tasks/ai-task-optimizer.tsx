'use client';

import { useState } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { organizeTasksAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Wand2, ThumbsUp, ThumbsDown, Plus, Trash2, ArrowRight, XCircle } from 'lucide-react';
import type { OrganizedTasks, Task, OrganizedTaskUpdate, OrganizedTaskNew } from '@/lib/types';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function AiTaskOptimizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestedChanges, setSuggestedChanges] = useState<OrganizedTasks | null>(null);
  const [changesToApply, setChangesToApply] = useState<OrganizedTasks | null>(null);
  const { tasks, applyOrganizedTasks } = useTasks();
  const { toast } = useToast();

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setSuggestedChanges(null);
    setChangesToApply(null);

    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length < 2) {
      toast({
        variant: 'destructive',
        title: 'No hay suficientes tareas',
        description: 'Necesitas al menos 2 tareas pendientes para optimizar.',
      });
      setIsOptimizing(false);
      return;
    }

    const result = await organizeTasksAction({ tasks: pendingTasks.map(({id, title, category, priority, projectId}) => ({id, title, category, priority, projectId})) });

    setIsOptimizing(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: result.error,
      });
    } else if (result.updatedTasks.length > 0 || result.newTasks.length > 0 || result.deletedTaskIds.length > 0) {
      setSuggestedChanges(result as OrganizedTasks);
      setChangesToApply(result as OrganizedTasks);
    } else {
      toast({
        title: 'Todo en orden',
        description: 'La IA no encontró ninguna optimización para hacer.',
      });
      setIsOpen(false);
    }
  };
  
  const handleDiscardChange = (type: keyof OrganizedTasks, item: any) => {
    if (!changesToApply) return;

    let newChanges = { ...changesToApply };

    if (type === 'updatedTasks') {
        newChanges.updatedTasks = newChanges.updatedTasks.filter(t => t.id !== (item as OrganizedTaskUpdate).id);
    } else if (type === 'newTasks') {
        newChanges.newTasks = newChanges.newTasks.filter(t => t.title !== (item as OrganizedTaskNew).title);
    } else if (type === 'deletedTaskIds') {
        newChanges.deletedTaskIds = newChanges.deletedTaskIds.filter(id => id !== item);
    }
    
    setChangesToApply(newChanges);
  };

  const handleApplyChanges = async () => {
    if (!changesToApply) return;

    try {
      await applyOrganizedTasks(changesToApply);
      toast({
        title: '¡Tareas optimizadas!',
        description: 'Tu lista de tareas ha sido organizada.',
        className: 'bg-primary text-primary-foreground',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al aplicar cambios',
        description: 'No se pudieron guardar las optimizaciones.',
      });
    } finally {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setSuggestedChanges(null);
    setChangesToApply(null);
    setIsOptimizing(false);
  }

  const getOriginalTask = (id: string) => tasks.find(t => t.id === id);

  const noChangesLeft = !changesToApply || (changesToApply.updatedTasks.length === 0 && changesToApply.newTasks.length === 0 && changesToApply.deletedTaskIds.length === 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          <Wand2 className="mr-2 h-4 w-4" /> Organizar con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asistente de Optimización de Tareas</DialogTitle>
          <DialogDescription>
            Revisa las sugerencias de la IA. Puedes descartar los cambios que no te gusten antes de aplicarlos.
          </DialogDescription>
        </DialogHeader>

        {!suggestedChanges ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8">
            <p className="mb-4 text-muted-foreground">¿Listo para poner en orden tu lista de tareas?</p>
            <Button onClick={handleOptimize} disabled={isOptimizing}>
              {isOptimizing ? 'Optimizando...' : 'Sí, ¡Optimizar mis tareas!'}
            </Button>
          </div>
        ) : (
          <div className="my-4">
            <h3 className="font-semibold mb-4 text-lg">Sugerencias de la IA:</h3>
            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                    {changesToApply && changesToApply.deletedTaskIds.length > 0 && (
                        <Alert>
                            <Trash2 className="h-4 w-4" />
                            <AlertTitle>Tareas a Eliminar / Fusionar</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-5 space-y-1 mt-2">
                                    {changesToApply.deletedTaskIds.map(id => (
                                        <li key={id} className="flex items-center justify-between">
                                            <span className="line-through">{getOriginalTask(id)?.title}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDiscardChange('deletedTaskIds', id)}>
                                                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    {changesToApply && changesToApply.newTasks.length > 0 && (
                        <Alert>
                            <Plus className="h-4 w-4" />
                            <AlertTitle>Nuevas Tareas (Fusionadas)</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-5 space-y-1 mt-2">
                                    {changesToApply.newTasks.map((task, i) => (
                                        <li key={i} className="flex items-center justify-between">
                                            <span>{task.title} <Badge variant="secondary" className="capitalize">{task.priority}</Badge></span>
                                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDiscardChange('newTasks', task)}>
                                                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    {changesToApply && changesToApply.updatedTasks.length > 0 && (
                        <Alert>
                            <Wand2 className="h-4 w-4" />
                            <AlertTitle>Tareas Actualizadas</AlertTitle>
                            <AlertDescription>
                                <ul className="space-y-2 mt-2">
                                    {changesToApply.updatedTasks.map(task => {
                                        const original = getOriginalTask(task.id);
                                        if (!original) return null;
                                        return (
                                            <li key={task.id} className="text-xs p-2 rounded-md bg-secondary/50 flex items-center justify-between">
                                                <div>
                                                    <p className="line-through text-muted-foreground">{original.title} [<span className="capitalize">{original.priority}</span>]</p>
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRight className="h-3 w-3 text-primary" />
                                                        <p>{task.title || original.title} [<Badge variant="outline" className="capitalize">{task.priority || original.priority}</Badge>]</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDiscardChange('updatedTasks', task)}>
                                                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                                </Button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                     {noChangesLeft && (
                        <div className="text-center text-muted-foreground p-4">
                            <p>No hay cambios para aplicar. O todo se ha descartado.</p>
                        </div>
                     )}
                </div>
            </ScrollArea>
          </div>
        )}

        {suggestedChanges && (
            <DialogFooter className="mt-6">
                <Button variant="ghost" onClick={handleClose}>
                    <ThumbsDown className="mr-2 h-4 w-4"/> Rechazar Todo
                </Button>
                <Button onClick={handleApplyChanges} disabled={noChangesLeft}>
                    <ThumbsUp className="mr-2 h-4 w-4"/> Aplicar Cambios Aceptados
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
