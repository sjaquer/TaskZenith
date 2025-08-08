'use client';

import { type Task, type Project, type KanbanStatus, type Category, type Priority } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'status'>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: KanbanStatus) => void;
  getProjectById: (projectId: string) => Project | undefined;
  addProject: (project: Omit<Project, 'id'>) => void;
  deleteProject: (projectId: string) => void;
  addAiTasks: (newTasks: string[], category: Category, priority: Priority) => void;
  clearAllData: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const initialProjects: Project[] = [];
const initialTasks: Task[] = [];

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedTasks = localStorage.getItem('tasks');
            const storedProjects = localStorage.getItem('projects');

            if (storedTasks) {
                setTasks(JSON.parse(storedTasks).map((task: Task) => ({
                    ...task,
                    completedAt: task.completedAt ? new Date(task.completedAt) : null,
                })));
            } else {
                setTasks(initialTasks);
            }

            if (storedProjects) {
                setProjects(JSON.parse(storedProjects));
            } else {
                setProjects(initialProjects);
            }
        } catch (error) {
            console.error("Failed to load from localStorage", error);
            setTasks(initialTasks);
            setProjects(initialProjects);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('projects', JSON.stringify(projects));
        }
    }, [tasks, projects, isLoaded]);

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false,
      status: 'Pendiente',
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const addAiTasks = (newTasks: string[], category: Category, priority: Priority) => {
    const createdTasks: Task[] = newTasks.map((title, index) => ({
      id: `task-ai-${Date.now()}-${index}`,
      title,
      category,
      priority,
      completed: false,
      status: 'Pendiente',
    }));
    setTasks((prev) => [...createdTasks, ...prev]);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : null, status: !task.completed ? 'Finalizado' : 'Pendiente' }
          : task
      )
    );
  };

  const updateTaskStatus = (taskId: string, status: KanbanStatus) => {
    setTasks(prev => 
      prev.map(task => {
        if (task.id === taskId) {
          const isCompleted = status === 'Finalizado' || status === 'Cancelado';
          return { ...task, status, completed: isCompleted, completedAt: isCompleted && !task.completedAt ? new Date() : (status !== 'Finalizado' && status !== 'Cancelado' ? null : task.completedAt) };
        }
        return task;
      })
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
  
  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    // Also remove projectId from tasks that have it
    setTasks(prev => prev.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t));
  }
  
  const clearAllData = () => {
    setTasks(initialTasks);
    setProjects(initialProjects);
    // Also clear daily tasks
    const todayKey = `dailyTasks-${new Date().toISOString().split('T')[0]}`;
    localStorage.removeItem(todayKey);
    // This will cause daily tasks to regenerate on next load/refresh
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <TaskContext.Provider value={{ tasks, projects, addTask, toggleTaskCompletion, updateTaskStatus, getProjectById, addProject, deleteProject, addAiTasks, clearAllData }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks debe ser usado dentro de un TaskProvider');
  }
  return context;
};
    