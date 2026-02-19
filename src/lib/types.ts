export type UserRole = 'admin' | 'operator';

export type Category = 'development' | 'design' | 'marketing' | 'management' | 'other';
export type Priority = 'baja' | 'media' | 'alta';
export type KanbanStatus = 'Pendiente' | 'En Progreso' | 'Hecho' | 'Finalizado' | 'Cancelado';

// Funciones internas dentro de un grupo (sub-roles)
export type MemberFunction =
  | 'marketing'
  | 'administración'
  | 'desarrollo'
  | 'diseño'
  | 'soporte'
  | 'ventas'
  | 'recursos humanos'
  | 'otro';

export const MEMBER_FUNCTIONS: { value: MemberFunction; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'administración', label: 'Administración' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'diseño', label: 'Diseño' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'recursos humanos', label: 'Recursos Humanos' },
  { value: 'otro', label: 'Otro' },
];

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string; 
}

// ==================== GRUPOS / EMPRESAS ====================

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;           // color representativo del grupo
  createdBy: string;       // uid del admin que lo creó
  createdAt: number;       // timestamp ms
  inviteCode: string;      // código único para unirse
}

export interface GroupMember {
  id: string;              // doc id (= uid del miembro)
  uid: string;             // uid del usuario
  displayName: string;
  email: string;
  role: UserRole;          // rol de la cuenta (admin / operator)
  memberFunction: MemberFunction; // función interna en el grupo
  joinedAt: number;        // timestamp ms
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdBy: string; // userId of creator
  assignedTo?: string[]; // userIds of assigned operators
}

export type TaskFormValues = Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'createdBy'>> & { initialDate?: Date };

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
  createdBy: string; // Admin or creator
  assignedTo?: string; // Operator ID (Deprecated in favor of assigneeIds)
  assigneeIds?: string[]; // List of user IDs for joint tasks
  aiPriorityScore?: number; // Calculated score
  timeSpent?: number; // Time tracked in seconds
  estimatedTime?: number; // Estimated minutes
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_completed' | 'task_assigned' | 'message' | 'alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  link?: string;
  fromUserId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  channelId: string; // 'general' or specific projectId
  createdAt: number;
  readBy?: string[];
}
