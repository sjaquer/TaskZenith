export type Category = 'estudio' | 'trabajo' | 'personal' | 'proyectos';
export type Priority = 'baja' | 'media' | 'alta';
export type KanbanStatus = 'Pendiente' | 'En Progreso' | 'Hecho' | 'Finalizado' | 'Cancelado';

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  completed: boolean;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  dueDate?: Date | null;
  projectId?: string;
  status: KanbanStatus;
  userId: string;
}

export interface CustomDailyTask {
  id: string;
  title: string;
}

export interface DailyTask extends CustomDailyTask {
  completed: boolean;
}


// Types for AI Task Organizer
export interface OrganizedTaskUpdate {
  id: string;
  title?: string;
  priority?: Priority;
}

export interface OrganizedTaskNew {
  title: string;
  priority: Priority;
  category: Category;
  projectId?: string;
}

export interface OrganizedTasks {
  updatedTasks: OrganizedTaskUpdate[];
  newTasks: OrganizedTaskNew[];
  deletedTaskIds: string[];
}

export type ProfileIcon = 'user' | 'whale' | 'crab' | 'fish' | 'bird' | 'turtle';

export interface UserProfile {
  displayName?: string;
  profileIcon?: ProfileIcon;
}
