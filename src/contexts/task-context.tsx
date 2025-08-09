'use client';

import { type Task, type Project, type KanbanStatus, type Category, type Priority } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { firebaseApp } from '@/lib/firebase';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  writeBatch,
  setDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";

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

const db = getFirestore(firebaseApp);
const tasksCollection = collection(db, 'tasks');
const projectsCollection = collection(db, 'projects');

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksSnapshot, projectsSnapshot] = await Promise.all([
                    getDocs(tasksCollection),
                    getDocs(projectsCollection)
                ]);

                const tasksData = tasksSnapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                    ...data,
                    id: doc.id,
                    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
                  } as Task;
                });

                const projectsData = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
                
                setTasks(tasksData);
                setProjects(projectsData);

            } catch (error) {
                console.error("Failed to load from Firestore", error);
                setTasks([]);
                setProjects([]);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchData();
    }, []);

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'status'>) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      ...task,
      id: newTaskId,
      completed: false,
      status: 'Pendiente',
    };
    try {
        await setDoc(doc(db, 'tasks', newTaskId), newTask);
        setTasks((prev) => [newTask, ...prev]);
    } catch (error) {
        console.error("Error adding task: ", error);
    }
  };

  const addAiTasks = async (newTasks: string[], category: Category, priority: Priority) => {
    const batch = writeBatch(db);
    const createdTasks: Task[] = [];

    newTasks.forEach((title, index) => {
        const newTaskId = `task-ai-${Date.now()}-${index}`;
        const newTask: Task = {
            id: newTaskId,
            title,
            category,
            priority,
            completed: false,
            status: 'Pendiente',
        };
        const taskRef = doc(db, 'tasks', newTaskId);
        batch.set(taskRef, newTask);
        createdTasks.push(newTask);
    });

    try {
        await batch.commit();
        setTasks((prev) => [...createdTasks, ...prev]);
    } catch(error) {
        console.error("Error adding AI tasks: ", error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const newCompletedState = !taskToUpdate.completed;
    const updatedTask = {
        ...taskToUpdate,
        completed: newCompletedState,
        completedAt: newCompletedState ? new Date() : null,
        status: newCompletedState ? 'Finalizado' : 'Pendiente'
    } as Task;

    try {
        await setDoc(doc(db, 'tasks', taskId), updatedTask);
        setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task));
    } catch(error) {
        console.error("Error toggling task completion: ", error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: KanbanStatus) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const isCompleted = status === 'Finalizado' || status === 'Cancelado';
    const updatedTask = {
        ...taskToUpdate,
        status,
        completed: isCompleted,
        completedAt: isCompleted && !taskToUpdate.completedAt ? new Date() : (status !== 'Finalizado' && status !== 'Cancelado' ? null : taskToUpdate.completedAt)
    }

    try {
        await setDoc(doc(db, 'tasks', taskId), updatedTask);
         setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
    } catch(error) {
        console.error("Error updating task status: ", error);
    }
  };

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  }

  const addProject = async (project: Omit<Project, 'id'>) => {
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      ...project,
      id: newProjectId,
    };
    try {
        await setDoc(doc(db, 'projects', newProjectId), newProject);
        setProjects(prev => [...prev, newProject]);
    } catch(error) {
        console.error("Error adding project: ", error);
    }
  }
  
  const deleteProject = async (projectId: string) => {
     try {
        await deleteDoc(doc(db, 'projects', projectId));
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Also remove projectId from tasks that have it
        const batch = writeBatch(db);
        const updatedTasks = tasks.map(t => {
            if (t.projectId === projectId) {
                const taskRef = doc(db, 'tasks', t.id);
                const updatedTask = { ...t, projectId: undefined };
                batch.update(taskRef, { projectId: undefined });
                return updatedTask;
            }
            return t;
        });
        await batch.commit();
        setTasks(updatedTasks);

    } catch(error) {
        console.error("Error deleting project: ", error);
    }
  }
  
  const clearAllData = async () => {
    const batch = writeBatch(db);
    tasks.forEach(task => batch.delete(doc(db, 'tasks', task.id)));
    projects.forEach(project => batch.delete(doc(db, 'projects', project.id)));
    
    try {
        await batch.commit();
        setTasks([]);
        setProjects([]);
        // Also clear daily tasks
        const todayKey = `dailyTasks-${new Date().toISOString().split('T')[0]}`;
        localStorage.removeItem(todayKey);
    } catch (error) {
        console.error("Error clearing all data: ", error);
    }
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
    
