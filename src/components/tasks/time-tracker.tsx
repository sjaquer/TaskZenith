'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Clock } from 'lucide-react';
import { useTasks } from '@/contexts/task-context';
import { cn } from '@/lib/utils';

interface TimeTrackerProps {
  taskId: string;
  initialTime?: number; // in seconds
  className?: string;
}

export function TimeTracker({ taskId, initialTime = 0, className }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(initialTime);
  const { updateTask } = useTasks();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } 

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
     // Persist when stopping (or ideally periodically, but simplified for now)
     if (!isRunning && elapsed !== initialTime) {
        updateTask(taskId, { timeSpent: elapsed });
     }
  }, [isRunning, elapsed, initialTime, taskId, updateTask]);

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening task details
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs font-mono bg-secondary/50 rounded-md px-2 py-1", className)}>
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className={cn("min-w-[40px] text-center", isRunning ? "text-primary font-bold" : "text-muted-foreground")}>
            {formatTime(elapsed)}
        </span>
        <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-6 w-6 rounded-full hover:bg-background", isRunning && "text-red-500 hover:text-red-600 hover:bg-red-100")}
            onClick={toggleTimer}
            title={isRunning ? "Detener temporizador" : "Iniciar temporizador"}
        >
            {isRunning ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
        </Button>
    </div>
  );
}
