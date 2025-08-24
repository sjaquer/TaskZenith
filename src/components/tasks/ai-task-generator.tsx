'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bot, Plus, Sparkles } from 'lucide-react';
import { generateAiTasksAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Category, Priority, Task } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  activityDescription: z.string().min(10, 'Por favor, describe la actividad en al menos 10 caracteres.'),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']),
  priority: z.enum(['baja', 'media', 'alta']),
  projectId: z.string().optional(),
});

export function AiTaskGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [numberOfTasks, setNumberOfTasks] = useState(3);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addAiTasks, projects, getProjectById, tasks } = useTasks();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityDescription: '',
      category: 'personal',
      priority: 'media',
      projectId: undefined,
    },
  });

  const category = form.watch('category');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setGeneratedTasks([]);

    let projectContext;
    if (values.category === 'proyectos' && values.projectId) {
      const project = getProjectById(values.projectId);
      if (project) {
        projectContext = {
          name: project.name,
          description: project.description,
          existingTasks: tasks.filter(t => t.projectId === values.projectId).map(t => t.title),
        };
      }
    }
    
    const result = await generateAiTasksAction({ 
      activityDescription: values.activityDescription,
      numberOfTasks,
      projectContext
    });

    setIsGenerating(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.tasks) {
      setGeneratedTasks(result.tasks);
    }
  }

  function handleAddTasks() {
    const { category, priority, projectId } = form.getValues();
    addAiTasks(generatedTasks, category as Category, priority as Priority, projectId);
    toast({
      title: '¡Éxito!',
      description: `${generatedTasks.length} tareas han sido añadidas a tu lista.`,
      className: 'bg-primary text-primary-foreground',
    });
    setGeneratedTasks([]);
    setIsOpen(false);
    form.reset();
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setGeneratedTasks([]);
      setNumberOfTasks(3);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bot className="mr-2 h-4 w-4" /> Generar con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" /> Generador de Tareas con IA
          </DialogTitle>
          <DialogDescription>
            Describe una actividad y la dividiremos en tareas manejables para ti. Para mejores resultados en proyectos, añade una descripción al proyecto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="activityDescription"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descripción de la Actividad</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Ej: Planear una fiesta de cumpleaños sorpresa para un amigo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="trabajo">Trabajo</SelectItem>
                            <SelectItem value="estudio">Estudio</SelectItem>
                            <SelectItem value="proyectos">Proyectos</SelectItem>
                        </SelectContent>
                        </Select>
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecciona una prioridad" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                        </Select>
                    </FormItem>
                    )}
                />
                </div>
                {category === 'proyectos' && (
                <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Proyecto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger disabled={projects.length === 0}>
                            <SelectValue placeholder={projects.length > 0 ? "Selecciona un proyecto" : "No hay proyectos"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {projects.map(project => (
                            <SelectItem key={project.id} value={project.id} className="capitalize">
                                {project.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                <div className="space-y-2">
                    <Label>Número de tareas: {numberOfTasks}</Label>
                    <Slider defaultValue={[3]} min={1} max={10} step={1} onValueChange={(value) => setNumberOfTasks(value[0])} />
                </div>

                <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? 'Generando...' : 'Generar Tareas'}
                </Button>
            </form>
            </Form>
            {generatedTasks.length > 0 && (
            <div className="mt-4 space-y-2">
                <h3 className="font-semibold">Tareas Sugeridas:</h3>
                <ScrollArea className="h-40 w-full rounded-md border">
                  <div className="p-4 space-y-2">
                    {generatedTasks.map((task, index) => (
                      <p key={index} className="text-sm p-2 bg-secondary/50 rounded-md">{task}</p>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={handleAddTasks} className="w-full mt-2">
                <Plus className="mr-2 h-4 w-4" /> Añadir a Mi Lista
                </Button>
            </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
