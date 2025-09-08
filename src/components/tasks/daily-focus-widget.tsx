'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { generateDailyPlanAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react';
import type { DailyPlan } from '@/lib/types';
import { TaskEditDialog } from './task-edit-dialog';
import type { Task } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

function LoadingState() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="space-y-3">
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function DailyFocusWidget() {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setPlan(null);
    const pendingTasks = tasks
        .filter(t => !t.completed)
        .map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            category: t.category,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
            projectId: t.projectId
        }));

    if (pendingTasks.length === 0) {
        toast({
            title: '¡Todo listo!',
            description: 'No tienes tareas pendientes. ¡Buen trabajo!',
        });
        setIsLoading(false);
        return;
    }

    const result = await generateDailyPlanAction({
      tasks: pendingTasks,
      userName: user?.displayName || undefined,
    });
    
    setIsLoading(false);
    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Error de IA', description: result.error });
    } else {
      setPlan(result);
    }
  };
  
  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if(task) {
        setEditingTask(task);
    }
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold uppercase tracking-wider">Foco del Día</CardTitle>
      </CardHeader>
      <CardContent>
        {!plan && !isLoading && (
            <div className="text-center">
                <p className="mb-4 text-muted-foreground">Obtén un plan de acción inteligente para hoy.</p>
                <Button onClick={handleGeneratePlan} disabled={isLoading}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar mi plan para hoy
                </Button>
            </div>
        )}
        
        {isLoading && <LoadingState />}

        {plan && (
            <div className="space-y-4">
                <p className="font-semibold text-primary italic">"{plan.motivationalMessage}"</p>
                
                <h4 className="font-bold">Tu plan de ataque para hoy:</h4>
                <ul className="space-y-3">
                    {plan.suggestedTasks.map(suggestedTask => (
                        <li key={suggestedTask.id} className="flex gap-4">
                            <Lightbulb className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                            <div className="flex-1">
                                <button onClick={() => handleTaskClick(suggestedTask.id)} className="text-left hover:underline font-medium">
                                    {suggestedTask.title}
                                </button>
                                <p className="text-xs text-muted-foreground">{suggestedTask.reason}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <Button variant="ghost" onClick={handleGeneratePlan} disabled={isLoading} className="w-full mt-4">
                     <Sparkles className="mr-2 h-4 w-4" />
                     Generar un nuevo plan
                </Button>
            </div>
        )}
        {editingTask && (
            <TaskEditDialog 
                isOpen={!!editingTask} 
                onOpenChange={(open) => !open && setEditingTask(null)}
                task={editingTask}
            />
        )}
      </CardContent>
    </Card>
  );
}
