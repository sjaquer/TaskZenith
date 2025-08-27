'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Mic, StopCircle, Bot, Check, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processVoiceCommandAction } from '@/lib/actions';
import type { Task, Category, Priority, Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

// This is the type that comes from the AI flow
type ProcessedTask = Omit<Task, 'id' | 'completed' | 'status' | 'completedAt'> & { localId: number };

export function VoiceTaskGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedTasks, setProcessedTasks] = useState<ProcessedTask[]>([]);
  const { projects, addVoiceTasks, getProjectById } = useTasks();
  const { toast } = useToast();

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
        }
    }
  }, []);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setTranscript('');
        setProcessedTasks([]);
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-ES';

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscript + interimTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            toast({
                variant: 'destructive',
                title: 'Error de Voz',
                description: 'No se pudo iniciar el reconocimiento de voz. Revisa los permisos del micrófono.',
            });
        };

        recognitionRef.current.start();
        setIsListening(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'El reconocimiento de voz no es compatible con este navegador.',
        });
      }
    }
  };

  const handleProcessCommand = async () => {
    if (!transcript.trim()) {
      toast({ variant: 'destructive', title: 'Comando vacío', description: 'Por favor, di algo para crear una tarea.' });
      return;
    }
    
    setIsProcessing(true);
    if(isListening) {
        recognitionRef.current?.stop();
    }
    
    const projectContext = projects.map(p => ({ id: p.id, name: p.name }));
    const result = await processVoiceCommandAction({ command: transcript, projectContext });
    setIsProcessing(false);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error al procesar', description: result.error });
    } else if (result.tasks && result.tasks.length > 0) {
      setProcessedTasks(result.tasks.map((task, index) => ({...task, localId: index})));
    } else {
        toast({ title: 'No se crearon tareas', description: 'No pudimos identificar ninguna tarea en tu comando. Inténtalo de nuevo.' });
    }
  };
  
  const handleTaskDetailChange = (localId: number, field: 'category' | 'priority' | 'projectId', value: string) => {
    setProcessedTasks(currentTasks => 
        currentTasks.map(task => {
            if (task.localId === localId) {
                const updatedTask = { ...task, [field]: value };
                // If category changes to something other than 'proyectos', remove projectId
                if (field === 'category' && value !== 'proyectos') {
                    delete updatedTask.projectId;
                }
                return updatedTask;
            }
            return task;
        })
    );
  };

  const handleConfirmAndAddTasks = () => {
    if(processedTasks.length === 0) return;
    
    addVoiceTasks(processedTasks);
    
    const taskDetails = processedTasks.map(task => {
        let detail = `- "${task.title}" (Prioridad: ${task.priority}, Categoría: ${task.category}`;
        if (task.projectId) {
          const project = getProjectById(task.projectId);
          detail += `, Proyecto: ${project?.name || 'N/A'}`;
        }
        return detail + ')';
      }).join('\n');

      toast({
        title: `¡${processedTasks.length} tarea(s) creada(s)!`,
        description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{taskDetails}</code></pre>,
        className: 'bg-primary text-primary-foreground',
      });

    handleCloseDialog();
  }

  const resetState = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    }
    setTranscript('');
    setIsProcessing(false);
    setProcessedTasks([]);
  }

  const handleCloseDialog = () => {
    resetState();
    setIsOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCloseDialog();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
         <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-4 sm:right-6 h-16 w-16 rounded-full shadow-lg z-20"
        >
          <Mic className="h-8 w-8" />
          <span className="sr-only">Crear por Voz</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="text-primary" /> Crear Tareas por Voz
          </DialogTitle>
          <DialogDescription>
            {processedTasks.length === 0 ? 
            'Presiona el micrófono y dí lo que necesitas. Por ejemplo: "Crear una tarea de trabajo para revisar el informe trimestral con prioridad alta".'
            : 'Revisa las tareas que hemos entendido. Puedes hacer ajustes antes de añadirlas a tu lista.'
            }
          </DialogDescription>
        </DialogHeader>

        {processedTasks.length === 0 ? (
            <>
                <div className="my-4 p-4 border-2 border-dashed rounded-md min-h-[100px] text-muted-foreground">
                    {isListening ? <em>Escuchando...</em> : transcript || 'Esperando tu comando...'}
                </div>
                <div className="flex justify-center my-4">
                    <Button onClick={handleListen} size="lg" className={`rounded-full h-16 w-16 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary'}`}>
                        {isListening ? <StopCircle size={32} /> : <Mic size={32} />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={handleProcessCommand} className="w-full" disabled={isProcessing || transcript.length === 0}>
                        <Bot className="mr-2" /> {isProcessing ? 'Procesando...' : 'Procesar Comando'}
                    </Button>
                </DialogFooter>
            </>
        ) : (
            <div className="space-y-4 my-4">
                <ScrollArea className="h-[40vh] pr-4">
                    <div className="space-y-4">
                    {processedTasks.map((task) => (
                        <Card key={task.localId} className="p-4 bg-secondary/50">
                            <p className="font-semibold mb-3">{task.title}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <Select value={task.category} onValueChange={(v) => handleTaskDetailChange(task.localId, 'category', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="personal">Personal</SelectItem>
                                        <SelectItem value="trabajo">Trabajo</SelectItem>
                                        <SelectItem value="estudio">Estudio</SelectItem>
                                        <SelectItem value="proyectos">Proyectos</SelectItem>
                                    </SelectContent>
                                </Select>
                                {task.category === 'proyectos' && (
                                     <Select value={task.projectId} onValueChange={(v) => handleTaskDetailChange(task.localId, 'projectId', v)}>
                                        <SelectTrigger disabled={projects.length === 0}>
                                            <SelectValue placeholder={projects.length > 0 ? "Selecciona Proyecto" : "No hay proyectos"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Select value={task.priority} onValueChange={(v) => handleTaskDetailChange(task.localId, 'priority', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="baja">Baja</SelectItem>
                                        <SelectItem value="media">Media</SelectItem>
                                        <SelectItem value="alta">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Card>
                    ))}
                    </div>
                </ScrollArea>
                 <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={resetState} className="w-full sm:w-auto">
                        <RotateCcw className="mr-2" /> Empezar de Nuevo
                    </Button>
                    <Button onClick={handleConfirmAndAddTasks} className="w-full sm:w-auto">
                       <Check className="mr-2" /> Añadir {processedTasks.length} Tarea(s) a Mi Lista
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
