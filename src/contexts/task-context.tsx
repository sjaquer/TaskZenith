'use client';

import { type Task, type Project, type KanbanStatus } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  { id: 'proj-1', name: 'Rediseño Web', color: '#0B7ABF' },
  { id: 'proj-2', name: 'App Móvil', color: '#16a34a' },
  { id: 'proj-3', name: 'Marketing Q3', color: '#F2BB13' },
];

const initialTasks: Task[] = [
  { id: 'task-1', title: 'Revisar Capítulo 5 para examen', category: 'estudio', priority: 'alta', completed: false, status: 'Pendiente' },
  { id: 'task-2', title: 'Preparar presentación para cliente', category: 'trabajo', priority: 'media', completed: false, status: 'En Progreso', projectId: 'proj-1' },
  { id: 'task-3', title: 'Salir a correr 30 minutos', category: 'personal', priority: 'baja', completed: true, completedAt: new Date(Date.now() - 3600 * 1000), status: 'Finalizado' },
  { id: 'task-4', title: 'Finalizar maquetas de UI', category: 'proyectos', priority: 'alta', completed: false, status: 'En Progreso', projectId: 'proj-1' },
  { id: 'task-5', title: 'Agendar reunión de equipo', category: 'trabajo', priority: 'media', completed: false, status: 'Pendiente' },
  { id: 'task-6', title: 'Planear viaje de fin de semana', category: 'personal', priority: 'baja', completed: false, status: 'Pendiente'},
  { id: 'task-7', title: 'Desarrollar API de backend para login', category: 'proyectos', priority: 'alta', completed: false, status: 'Hecho', projectId: 'proj-2' },
];

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

  const addAiTasks = (newTasks: string[], category: Task['category'], priority: Task['priority']) => {
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
          const isCompleted = status === 'Finalizado' || status === 'Hecho';
          return { ...task, status, completed: isCompleted, completedAt: isCompleted && !task.completedAt ? new Date() : task.completedAt };
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
  
  if (!isLoaded) {
    return null; // O un spinner de carga
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
    throw new Error('useTasks debe ser usado dentro de un TaskProvider');
  }
  return context;
};
