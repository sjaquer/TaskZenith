export type Category = 'estudio' | 'trabajo' | 'personal' | 'proyectos';
export type Priority = 'baja' | 'media' | 'alta';
export type KanbanStatus = 'Pendiente' | 'En Progreso' | 'Hecho' | 'Finalizado' | 'Cancelado';

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  completed: boolean;
  completedAt?: Date | null;
  projectId?: string;
  status: KanbanStatus;
}

export interface CustomDailyTask {
  id: string;
  title: string;
}

export interface DailyTask extends CustomDailyTask {
  completed: boolean;
}
