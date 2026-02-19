'use client';
import { ScheduleView } from '@/components/tasks/schedule-view';

export default function SchedulePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight font-headline">
          Cronograma de Tareas
        </h1>
      </div>
      <ScheduleView />
    </div>
  );
}
