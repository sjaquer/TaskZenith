'use client';

import { type Task, type Project, type KanbanStatus } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'status'>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: KanbanStatus) => void;
  getProjectById: (projectId: string) => Project | undefined;
  addProject: (project: Omit<Project, 'id'>) => void;
  addAiTasks: (newTasks: string[], category: Task['category'], priority: Task['priority']) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const initialProjects: Project[] = [
  { id: 'proj-1', name: 'Website Redesign', color: 'hsl(210 40% 96.1%)' },
  { id: 'proj-2', name: 'Mobile App Launch', color: 'hsl(142.1 76.2% 86.3%)' },
  { id: 'proj-3', name: 'Marketing Campaign', color: 'hsl(47.9 95.8% 83.1%)' },
];

const initialTasks: Task[] = [
  { id: 'task-1', title: 'Review Chapter 5 for exam', category: 'study', priority: 'high', completed: false, status: 'Pending' },
  { id: 'task-2', title: 'Prepare presentation for client', category: 'work', priority: 'medium', completed: false, status: 'In Progress', projectId: 'proj-1' },
  { id: 'task-3', title: 'Go for a 30-minute run', category: 'personal', priority: 'low', completed: true, completedAt: new Date(Date.now() - 3600 * 1000), status: 'Finished' },
  { id: 'task-4', title: 'Finalize UI mockups', category: 'projects', priority: 'high', completed: false, status: 'In Progress', projectId: 'proj-1' },
  { id: 'task-5', title: 'Schedule team meeting', category: 'work', priority: 'medium', completed: false, status: 'Pending' },
  { id: 'task-6', title: 'Plan weekend trip', category: 'personal', priority: 'low', completed: false, status: 'Pending'},
  { id: 'task-7', title: 'Develop backend API for login', category: 'projects', priority: 'high', completed: false, status: 'Done', projectId: 'proj-2' },
];

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false,
      status: 'Pending',
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const addAiTasks = (newTasks: string[], category: Task['category'], priority: Task['priority']) => {
    const createdTasks: Task[] = newTasks.map((title, index) => ({
      id: `task-ai-${Date.now()}-${index}`,
      title,
      category,
      priority,
      completed: false,
      status: 'Pending',
    }));
    setTasks((prev) => [...createdTasks, ...prev]);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : null }
          : task
      )
    );
  };

  const updateTaskStatus = (taskId: string, status: KanbanStatus) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      )
    );
  };

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  }

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
    };
    setProjects(prev => [...prev, newProject]);
  }

  return (
    <TaskContext.Provider value={{ tasks, projects, addTask, toggleTaskCompletion, updateTaskStatus, getProjectById, addProject, addAiTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
