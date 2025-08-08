export type Category = 'study' | 'work' | 'personal' | 'projects';
export type Priority = 'low' | 'medium' | 'high';
export type KanbanStatus = 'Pending' | 'In Progress' | 'Done' | 'Finished' | 'Canceled';

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
