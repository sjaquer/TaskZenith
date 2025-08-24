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
import { Mic, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processVoiceCommandAction } from '@/lib/actions';
import type { Task } from '@/lib/types';

export function VoiceTaskGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { projects, addVoiceTasks, getProjectById } = useTasks();
  const { toast } = useToast();

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // SpeechRecognition is a browser-only API
    if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'es-ES';

            recognition.onresult = (event) => {
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

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
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
      toast({
        variant: 'destructive',
        title: 'Comando vacío',
        description: 'Por favor, di algo para crear una tarea.',
      });
      return;
    }
    
    setIsProcessing(true);
    if(isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }
    
    const projectContext = projects.map(p => ({ id: p.id, name: p.name }));

    const result = await processVoiceCommandAction({ command: transcript, projectContext });
    setIsProcessing(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error al procesar',
        description: result.error,
      });
    } else if (result.tasks && result.tasks.length > 0) {
      addVoiceTasks(result.tasks);

      const taskDetails = result.tasks.map(task => {
        let detail = `- "${task.title}" (Prioridad: ${task.priority}, Categoría: ${task.category}`;
        if (task.projectId) {
          const project = getProjectById(task.projectId);
          detail += `, Proyecto: ${project?.name || 'N/A'}`;
        }
        return detail + ')';
      }).join('\n');

      toast({
        title: `¡${result.tasks.length} tarea(s) creada(s)!`,
        description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{taskDetails}</code></pre>,
        className: 'bg-primary text-primary-foreground',
      });
      setIsOpen(false);
    } else {
        toast({
            title: 'No se crearon tareas',
            description: 'No pudimos identificar ninguna tarea en tu comando. Inténtalo de nuevo.',
        });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      setTranscript('');
      setIsProcessing(false);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
         <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-20"
        >
          <Mic className="h-8 w-8" />
          <span className="sr-only">Crear por Voz</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="text-primary" /> Crear Tareas por Voz
          </DialogTitle>
          <DialogDescription>
            Presiona el botón y dí lo que necesitas. Por ejemplo: &quot;Crear una tarea de trabajo para revisar el informe trimestral con prioridad alta&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 border-2 border-dashed rounded-md min-h-[100px] text-muted-foreground">
            {transcript || 'Esperando tu comando...'}
        </div>
        <div className="flex justify-center my-4">
            <Button onClick={handleListen} size="lg" className={`rounded-full h-16 w-16 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}>
                {isListening ? <StopCircle size={32} /> : <Mic size={32} />}
            </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleProcessCommand} className="w-full" disabled={isProcessing || transcript.length === 0}>
            {isProcessing ? 'Procesando...' : 'Crear Tareas desde el Comando'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
