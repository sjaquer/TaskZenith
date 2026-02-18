'use client';

import { type Task, type Project, type KanbanStatus, type SubTask } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  writeBatch,
  setDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';

// Helper para convertir Date a Timestamp de Firestore
const dateToTimestamp = (date: Date | null | undefined): Timestamp | null => {
  if (!date) return null;
  try {
    return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
  } catch {
    return null;
  }
};

// Helper para sanitizar datos antes de enviar a Firestore
const sanitizeForFirestore = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === 'dueDate' || key === 'createdAt' || key === 'completedAt' || key === 'startedAt') {
      sanitized[key] = value ? dateToTimestamp(value) : null;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  isLoaded: boolean;
  isSyncing: boolean;
  addTask: (task: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'createdBy'>>) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'createdBy'>>) => void;
  toggleTaskCompletion: (taskId: string, subTaskId?: string) => void;
  restoreTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: KanbanStatus) => void;
  getProjectById: (projectId: string) => Project | undefined;
  addProject: (project: Omit<Project, 'id' | 'createdBy'>) => void;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'createdBy'>>) => void;
  clearAllData: () => void;
  deleteCompletedTasks: () => void;
  syncData: () => Promise<void>;
  clearLocalData: () => void;
  addSubTask: (taskId: string, subTaskTitle: string) => SubTask | undefined;
  updateSubTask: (taskId: string, subTaskId: string, data: Partial<Omit<SubTask, 'id'>>) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const getLocalStorageKey = (userId: string, key: 'tasks' | 'projects') => `taskzenith_corp_${userId}_${key}`;

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const { user, role, loading: authLoading } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const hasSynced = useRef(false);

    const userId = user?.uid;

    // Use root collections for shared corporate data
    const tasksCollection = collection(db, 'tasks');
    const projectsCollection = collection(db, 'projects');

    // Effect to persist state to localStorage whenever it changes
    useEffect(() => {
      if (userId && isLoaded) {
        localStorage.setItem(getLocalStorageKey(userId, 'tasks'), JSON.stringify(tasks));
        localStorage.setItem(getLocalStorageKey(userId, 'projects'), JSON.stringify(projects));
      }
    }, [tasks, projects, userId, isLoaded]);

    const clearLocalData = useCallback(() => {
        if (userId) {
          localStorage.removeItem(getLocalStorageKey(userId, 'tasks'));
          localStorage.removeItem(getLocalStorageKey(userId, 'projects'));
        }
        setTasks([]);
        setProjects([]);
        setIsLoaded(false);
    }, [userId]);

    const syncData = useCallback(async () => {
        if (!userId) return;
        setIsSyncing(true);
        try {
            // ADMIN sees ALL Tasks. OPERATOR sees ASSIGNED tasks.
            let qTasks = query(tasksCollection);
            
            if (role === 'operator') {
                qTasks = query(tasksCollection, where('assignedTo', '==', userId));
            }

            const tasksSnapshot = await getDocs(qTasks);
            const tasksData = tasksSnapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id, 
                createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
                startedAt: data.startedAt ? (data.startedAt as Timestamp).toDate() : null,
                completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
                dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : null,
              } as Task
            });
            setTasks(tasksData);

            // ADMIN sees ALL Projects. OPERATOR sees projects they are part of? 
            // For now, let's let everyone see all projects to facilitate collaboration context.
            // Or if strict, filter by members. Assuming 'members' array exists on Project if needed.
            // We kept Project simple in type definition, so let's show all for now.
            const projectsSnapshot = await getDocs(query(projectsCollection));
            const projectsData = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
            setProjects(projectsData);
            
        } catch (error) {
            console.error("Error fetching from Firestore:", error);
            // Don't throw to avoid crashing UI, just log
        } finally {
            setIsSyncing(false);
        }
    }, [userId, role]);
    

    useEffect(() => {
      const loadInitialData = async () => {
        if (userId && !hasSynced.current) {
          hasSynced.current = true;
          let localTasks: Task[] = [];
          let localProjects: Project[] = [];
          
          try {
            const storedTasks = localStorage.getItem(getLocalStorageKey(userId, 'tasks'));
            if (storedTasks) {
              localTasks = JSON.parse(storedTasks, (key, value) => {
                if (key.endsWith('At') || key === 'dueDate' || key === 'createdAt') {
                  return value ? new Date(value) : null;
                }
                return value;
              });
            }
            
            const storedProjects = localStorage.getItem(getLocalStorageKey(userId, 'projects'));
            if (storedProjects) {
              localProjects = JSON.parse(storedProjects);
            }
          } catch(e) {
            console.error("Failed to parse data from localStorage", e);
          }
          
          // Cargar datos locales inmediatamente para UI rápida
          if (localTasks.length > 0) {
             setTasks(localTasks);
          }
          if (localProjects.length > 0) {
             setProjects(localProjects);
          }

          // Siempre sincronizar con Firestore para tener datos frescos
          try {
            await syncData();
          } catch (error) {
            console.error('Error syncing data:', error);
          }
          
          setIsLoaded(true);
        } else if (!userId) {
          hasSynced.current = false;
          clearLocalData();
        }
      };
    
      if (!authLoading) {
        loadInitialData();
      }
    }, [userId, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps


  const addTask = async (task: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'createdBy'>>) => {
    if (!userId) return;
    const newDocRef = doc(tasksCollection);

    const now = new Date();
    const taskPayload: Omit<Task, 'id'> = {
        title: task.title!,
        category: task.category!,
        priority: task.priority!,
        createdAt: now,
        dueDate: task.dueDate || null,
        createdBy: userId,
        completed: false,
        status: 'Pendiente',
        completedAt: null,
        subTasks: [],
        assignedTo: task.assignedTo || userId,
        projectId: task.projectId
    };
    
    // Remove undefined keys
    Object.keys(taskPayload).forEach(key => (taskPayload as any)[key] === undefined && delete (taskPayload as any)[key]);

    const newTask: Task = { ...taskPayload, id: newDocRef.id };

    // Actualización optimista de UI
    setTasks((prev) => [newTask, ...prev]);

    try {
        // Convertir fechas a Timestamps para Firestore
        const firestorePayload = sanitizeForFirestore(taskPayload);
        await setDoc(newDocRef, firestorePayload);
    } catch (error) {
        console.error("Error adding task: ", error);
        setTasks((prev) => prev.filter(t => t.id !== newDocRef.id));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;
    const originalTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    try {
        await deleteDoc(doc(tasksCollection, taskId));
    } catch (error) {
        console.error("Error deleting task: ", error);
        setTasks(originalTasks);
    }
  };

  const deleteCompletedTasks = async () => {
    if (!userId) return;
    
    // Corporate policy: Maybe only Admins can delete old tasks?
    // For now, allow it but standard logic.
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const tasksToDelete = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) < fiveDaysAgo);
    if (tasksToDelete.length === 0) return;

    const tasksToKeep = tasks.filter(t => !tasksToDelete.some(deleted => deleted.id === t.id));
    setTasks(tasksToKeep);

    try {
        const batch = writeBatch(db);
        tasksToDelete.forEach(task => {
            batch.delete(doc(tasksCollection, task.id));
        });
        await batch.commit();
    } catch (error) {
        console.error("Error deleting completed tasks: ", error);
        setTasks(tasks); // Revert
    }
  };

  const updateTask = async (taskId: string, data: Partial<Omit<Task, 'id' | 'createdBy'>>) => {
    if (!userId) return;
    const originalTasks = [...tasks];
    
    // Clean data - remover undefined
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
    );

    // Actualización optimista en UI
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...cleanedData } as Task : task))
    );
  
    try {
      const taskRef = doc(tasksCollection, taskId);
      // Convertir fechas a Timestamps para Firestore
      const firestorePayload = sanitizeForFirestore(cleanedData);
      await updateDoc(taskRef, firestorePayload);
    } catch (error) {
      console.error('Error updating task: ', error);
      setTasks(originalTasks);
    }
  };

  const toggleTaskCompletion = async (taskId: string, subTaskId?: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
  
    if (subTaskId) {
        const updatedSubTasks = taskToUpdate.subTasks?.map(st =>
          st.id === subTaskId ? { ...st, completed: !st.completed } : st
        ) || [];
      
        const allSubTasksCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
        const nextStatus: KanbanStatus = allSubTasksCompleted
          ? 'Finalizado'
          : 'En Progreso';

        await updateTask(taskId, { 
          subTasks: updatedSubTasks, 
          completed: allSubTasksCompleted, 
          completedAt: allSubTasksCompleted ? new Date() : null,
          status: nextStatus
        });

    } else {
        const newCompletedState = !taskToUpdate.completed;
        await updateTaskStatus(taskId, newCompletedState ? 'Finalizado' : 'Pendiente');
    }
  };

  const restoreTask = async (taskId: string) => {
    updateTask(taskId, {
      completed: false,
      completedAt: null,
      status: 'Pendiente',
    });
  };

  const updateTaskStatus = async (taskId: string, status: KanbanStatus) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate || !userId) return;
  
    const isCompleted = status === 'Finalizado' || status === 'Cancelado';
    const updatedTaskData: Partial<Task> = {
      status,
      completed: isCompleted,
    };
  
    if (isCompleted) {
      if (!taskToUpdate.completedAt) {
        updatedTaskData.completedAt = new Date();
      }
    } else {
      updatedTaskData.completedAt = null;
    }

    if (status === 'En Progreso' && !taskToUpdate.startedAt) {
      updatedTaskData.startedAt = new Date();
    }
  
    updateTask(taskId, updatedTaskData);
  };

  const addSubTask = (taskId: string, subTaskTitle: string): SubTask | undefined => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
  
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}-${Math.random()}`,
      title: subTaskTitle,
      completed: false,
    };
  
    const newSubTasks = [...(taskToUpdate.subTasks || []), newSubTask];
    updateTask(taskId, { subTasks: newSubTasks });
    return newSubTask;
  };
  
  const updateSubTask = (taskId: string, subTaskId: string, data: Partial<Omit<SubTask, 'id'>>) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
  
    const newSubTasks = taskToUpdate.subTasks?.map(st =>
      st.id === subTaskId ? { ...st, ...data } : st
    ) || [];
  
    updateTask(taskId, { subTasks: newSubTasks });
  };

  const deleteSubTask = (taskId: string, subTaskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
  
    const newSubTasks = taskToUpdate.subTasks?.filter(st => st.id !== subTaskId) || [];
    updateTask(taskId, { subTasks: newSubTasks });
  };


  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  }

  const addProject = async (project: Omit<Project, 'id' | 'createdBy'>) => {
    if (!userId) return;
    const newDocRef = doc(projectsCollection);

    const projectPayload: Omit<Project, 'id'> = {
      ...project,
      createdBy: userId,
    }

    const newProject: Project = { ...projectPayload, id: newDocRef.id };

    setProjects(prev => [...prev, newProject]);
    try {
        await setDoc(newDocRef, projectPayload);
    } catch(error) {
        console.error("Error adding project: ", error);
        setProjects(prev => prev.filter(p => p.id !== newDocRef.id));
    }
  }

  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'createdBy'>>) => {
    if (!userId) return;
    const projectRef = doc(projectsCollection, projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } as Project : p));
    try {
      await updateDoc(projectRef, data);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };
  
  const deleteProject = async (projectId: string) => {
    if (!userId) return;
    
    const tasksToDelete = tasks.filter(t => t.projectId === projectId);
    const tasksToKeep = tasks.filter(t => t.projectId !== projectId);
    const projectsToKeep = projects.filter(p => p.id !== projectId);
    
    setProjects(projectsToKeep);
    setTasks(tasksToKeep);
    
    try {
        const batch = writeBatch(db);
        batch.delete(doc(projectsCollection, projectId));
        tasksToDelete.forEach(t => {
            const taskRef = doc(tasksCollection, t.id);
            batch.delete(taskRef);
        });
        await batch.commit();
    } catch(error) {
        console.error("Error deleting project and its tasks: ", error);
        setProjects(projects);
        setTasks(tasks);
    }
  }
  
  const clearAllData = async () => {
    if (!userId) return;
    
    // Dangerous in corporate environment! Disable for operators
    if (role !== 'admin') {
        console.warn("Only admins can clear data");
        return;
    }

    clearLocalData();
    
    try {
        const batch = writeBatch(db);
        // Warning: This only deletes what we have loaded in memory/query. 
        // Real bulk delete needs a Cloud Function or recursive delete.
        tasks.forEach(t => batch.delete(doc(tasksCollection, t.id)));
        projects.forEach(p => batch.delete(doc(projectsCollection, p.id)));

        await batch.commit();

    } catch (error) {
        console.error("Error clearing all data: ", error);
    }
  }


  return (
    <TaskContext.Provider value={{ tasks, projects, isLoaded, isSyncing, addTask, deleteTask, updateTask, toggleTaskCompletion, restoreTask, updateTaskStatus, getProjectById, addProject, deleteProject, updateProject, clearAllData, deleteCompletedTasks, syncData, clearLocalData, addSubTask, updateSubTask, deleteSubTask }}>
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
