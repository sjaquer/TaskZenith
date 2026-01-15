'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODES = {
  work: { label: 'Enfoque', minutes: 25 },
  shortBreak: { label: 'Descanso', minutes: 5 },
  longBreak: { label: 'Largo', minutes: 15 },
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'work') setSessions(s => s + 1);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

  return (
    <div className="h-full flex flex-col p-2 space-y-2">
      {/* Header Compacto */}
      <div className="flex justify-between items-center bg-secondary/30 rounded-lg p-2">
         <div className="flex items-center gap-2 font-bold text-foreground/80">
            {mode === 'work' ? <Briefcase className="w-4 h-4"/> : <Coffee className="w-4 h-4"/>}
            <span className="text-sm">{MODES[mode].label}</span>
         </div>
         <div className="text-xs font-mono bg-background px-2 py-0.5 rounded border">
            Sesiones: {sessions}
         </div>
      </div>

      {/* Timer Display - Responsivo */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-2">
          <div className="relative z-10 text-[clamp(2.5rem,8vw,5rem)] font-black tabular-nums tracking-tighter leading-none text-primary">
            {formatTime(timeLeft)}
          </div>
          <Progress value={progress} className="h-2 w-3/4" />
      </div>

      {/* Controles */}
      <div className="grid grid-cols-3 gap-1 mb-2">
          {(Object.keys(MODES) as TimerMode[]).map((m) => (
            <button 
                key={m}
                onClick={() => changeMode(m)}
                className={`text-[10px] font-bold py-1 rounded transition-all truncate border
                  ${mode === m 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-muted text-muted-foreground border-transparent'
                  }`}
            >
                {MODES[m].label}
            </button>
          ))}
      </div>

      <div className="flex gap-2">
        <Button 
            size="sm"
            className={`flex-1 font-bold ${isActive ? 'bg-amber-500 hover:bg-amber-600' : ''}`} 
            onClick={toggleTimer}
        >
            {isActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isActive ? 'Pausa' : 'Iniciar'}
        </Button>
        <Button variant="outline" size="sm" onClick={resetTimer}>
            <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
