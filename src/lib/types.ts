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

export type TaskFormValues = Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'userId'>> & { initialDate?: Date };

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
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
  subTasks?: SubTask[];
  userId: string;
}

export interface CustomDailyTask {
  id: string;
  title: string;
  time?: string; // e.g., "09:00"
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

// Types for AI Daily Plan
export interface DailyPlan {
    motivationalMessage: string;
    suggestedTasks: {
        id: string;
        title: string;
        reason: string;
    }[];
}
