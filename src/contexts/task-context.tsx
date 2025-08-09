'use client';

import { type Task, type Project, type KanbanStatus, type Category, type Priority, type DailyTask, type CustomDailyTask } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { firebaseApp } from '@/lib/firebase';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  writeBatch,
  setDoc,
  deleteDoc,
  Timestamp,
  getDoc,
  runTransaction,
  updateDoc,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  getDocsFromCache
} from "firebase/firestore";

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyTasks: DailyTask[];
  customDailyTasks: CustomDailyTask[];
  isLoaded: boolean;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'status'>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: KanbanStatus) => void;
  getProjectById: (projectId: string) => Project | undefined;
  addProject: (project: Omit<Project, 'id'>) => void;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, data: Partial<Omit<Project, 'id'>>) => void;
  addAiTasks: (newTasks: string[], category: Category, priority: Priority, projectId?: string) => void;
  addVoiceTasks: (newTasks: Omit<Task, 'id' | 'completed' | 'status'>[]) => void;
  clearAllData: () => void;
  toggleDailyTask: (taskId: string) => void;
  updateCustomDailyTasks: (tasks: CustomDailyTask[]) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const db = getFirestore(firebaseApp);
const tasksCollection = collection(db, 'tasks');
const projectsCollection = collection(db, 'projects');
const dailyTasksCollection = collection(db, 'dailyTasks');
const customDailyTasksDoc = doc(db, 'config', 'customDailyTasks');


const defaultDailyTasks: CustomDailyTask[] = [
    { id: 'daily-1', title: 'Hacer la cama' },
    { id: 'daily-2', title: 'Meditar 10 minutos' },
    { id: 'daily-3', title: 'Revisar la agenda del día' },
    { id: 'daily-4', title: 'Beber un vaso de agua al despertar' },
    { id: 'daily-5', title: 'Planificar las 3 tareas más importantes' },
];

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
    const [customDailyTasks, setCustomDailyTasks] = useState<CustomDailyTask[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const fetchDailyTasks = useCallback(async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyStatusDocRef = doc(dailyTasksCollection, todayStr);
    
        try {
            await runTransaction(db, async (transaction) => {
              const dailyStatusDoc = await transaction.get(dailyStatusDocRef);
              
              let finalCustomTasks = customDailyTasks;
              if (customDailyTasks.length === 0) {
                const customTasksSnapshot = await transaction.get(customDailyTasksDoc);
                if (customTasksSnapshot.exists()) {
                  finalCustomTasks = customTasksSnapshot.data().tasks;
                } else {
                  finalCustomTasks = defaultDailyTasks;
                  transaction.set(customDailyTasksDoc, { tasks: finalCustomTasks });
                }
                setCustomDailyTasks(finalCustomTasks);
              }
        
              if (dailyStatusDoc.exists()) {
                setDailyTasks(dailyStatusDoc.data().tasks as DailyTask[]);
              } else {
                const newDailyTasks = finalCustomTasks.map(task => ({ ...task, completed: false }));
                transaction.set(dailyStatusDocRef, { tasks: newDailyTasks });
                setDailyTasks(newDailyTasks);
        
                // Clean up old daily tasks docs
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                const oldDocRef = doc(dailyTasksCollection, yesterdayStr);
                const oldDoc = await transaction.get(oldDocRef);
                if (oldDoc.exists()) {
                  transaction.delete(oldDocRef);
                }
              }
            });
        } catch (e) {
            // Likely offline, which is fine for this part.
            // We can rely on the last known state or defaults.
            console.log("Could not fetch daily tasks, possibly offline.");
        }
    }, [customDailyTasks]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Try to get data from cache first for a fast startup
                const [tasksCache, projectsCache] = await Promise.all([
                    getDocsFromCache(tasksCollection),
                    getDocsFromCache(projectsCollection)
                ]);

                if (!tasksCache.empty || !projectsCache.empty) {
                    const tasksData = tasksCache.docs.map(doc => ({ ...doc.data(), id: doc.id, completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : null }) as Task);
                    const projectsData = projectsCache.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
                    setTasks(tasksData);
                    setProjects(projectsData);
                    await fetchDailyTasks();
                    setIsLoaded(true);
                }
            } catch (error) {
                console.log("No data in cache, will fetch from server.", error);
            }

            // Set up listeners for real-time updates from server (will also work offline)
            const unsubscribeTasks = onSnapshot(tasksCollection, (snapshot) => {
                const tasksData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : null }) as Task);
                setTasks(tasksData);
                if (!isLoaded) fetchDailyTasks(); // ensure daily tasks are loaded after first data fetch
                setIsLoaded(true);
            }, (error) => {
                console.error("Error listening to tasks:", error);
                setIsLoaded(true); // Mark as loaded even on error to unblock UI
            });

            const unsubscribeProjects = onSnapshot(projectsCollection, (snapshot) => {
                const projectsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
                setProjects(projectsData);
            }, (error) => {
                console.error("Error listening to projects:", error);
            });
            
            return () => {
                unsubscribeTasks();
                unsubscribeProjects();
            };
        };

        fetchData();
    }, [fetchDailyTasks, isLoaded]);

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'status'>) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      ...task,
      id: newTaskId,
      completed: false,
      status: 'Pendiente',
      completedAt: null
    };

    // Optimistic UI update
    setTasks((prev) => [newTask, ...prev]);

    try {
        await setDoc(doc(db, 'tasks', newTaskId), newTask);
    } catch (error) {
        console.error("Error adding task: ", error);
        // Revert on error
        setTasks((prev) => prev.filter(t => t.id !== newTaskId));
    }
  };

  const deleteTask = async (taskId: string) => {
    const originalTasks = tasks;
    // Optimistic UI Update
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
        console.error("Error deleting task: ", error);
        // Revert
        setTasks(originalTasks);
    }
  };

  const addAiTasks = async (newTasks: string[], category: Category, priority: Priority, projectId?: string) => {
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
            projectId: category === 'proyectos' ? projectId : undefined,
        };
        const taskRef = doc(db, 'tasks', newTaskId);
        batch.set(taskRef, newTask);
        createdTasks.push(newTask);
    });

    // Optimistic update
    setTasks((prev) => [...createdTasks, ...prev]);
    try {
        await batch.commit();
    } catch(error) {
        console.error("Error adding AI tasks: ", error);
        // Revert
        setTasks((prev) => prev.filter(t => !createdTasks.some(ct => ct.id === t.id)));
    }
  };

  const addVoiceTasks = async (newTasks: Omit<Task, 'id' | 'completed' | 'status'>[]) => {
    const batch = writeBatch(db);
    const createdTasks: Task[] = [];

    newTasks.forEach((task, index) => {
        const newTaskId = `task-voice-${Date.now()}-${index}`;
        const newTask: Task = {
            ...task,
            id: newTaskId,
            completed: false,
            status: 'Pendiente',
        };
        const taskRef = doc(db, 'tasks', newTaskId);
        batch.set(taskRef, newTask);
        createdTasks.push(newTask);
    });

    // Optimistic update
    setTasks((prev) => [...createdTasks, ...prev]);
    try {
        await batch.commit();
    } catch(error) {
        console.error("Error adding voice tasks: ", error);
         // Revert
        setTasks((prev) => prev.filter(t => !createdTasks.some(ct => ct.id === t.id)));
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

    const originalTasks = tasks;
    // Optimistic UI update
    setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task));

    try {
        await updateDoc(doc(db, 'tasks', taskId), {
            completed: updatedTask.completed,
            completedAt: updatedTask.completedAt,
            status: updatedTask.status
        });
    } catch(error) {
        console.error("Error toggling task completion: ", error);
        // Revert
        setTasks(originalTasks);
    }
  };

  const updateTaskStatus = async (taskId: string, status: KanbanStatus) => {
    const originalTasks = [...tasks];
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;
  
    const isCompleted = status === 'Finalizado' || status === 'Cancelado';
    const updatedTaskData = {
      status,
      completed: isCompleted,
      completedAt:
        isCompleted && !taskToUpdate.completedAt
          ? new Date()
          : status !== 'Finalizado' && status !== 'Cancelado'
          ? null
          : taskToUpdate.completedAt,
    };
  
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updatedTaskData } : task))
    );
  
    try {
      await updateDoc(doc(db, 'tasks', taskId), updatedTaskData);
    } catch (error) {
      console.error('Error updating task status: ', error);
      // Revert on error
      setTasks(originalTasks);
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

    const originalProjects = projects;
    // Optimistic update
    setProjects(prev => [...prev, newProject]);
    try {
        await setDoc(doc(db, 'projects', newProjectId), newProject);
    } catch(error) {
        console.error("Error adding project: ", error);
        // Revert
        setProjects(originalProjects);
    }
  }

  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id'>>) => {
    const projectRef = doc(db, 'projects', projectId);
    const originalProjects = projects;
    // Optimistic update
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
    try {
      await updateDoc(projectRef, data);
    } catch (error) {
      console.error("Error updating project:", error);
      // Revert
      setProjects(originalProjects);
    }
  };
  
  const deleteProject = async (projectId: string) => {
    const originalProjects = projects;
    const originalTasks = tasks;
     
    // Optimistic Update
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t));
    
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'projects', projectId));
        
        tasks.forEach(t => {
            if (t.projectId === projectId) {
                const taskRef = doc(db, 'tasks', t.id);
                batch.update(taskRef, { projectId: undefined });
            }
        });
        await batch.commit();
    } catch(error) {
        console.error("Error deleting project: ", error);
        // Revert
        setProjects(originalProjects);
        setTasks(originalTasks);
    }
  }
  
  const clearAllData = async () => {
    const originalTasks = tasks;
    const originalProjects = projects;

    setTasks([]);
    setProjects([]);
    
    try {
        const batch = writeBatch(db);
        tasks.forEach(task => batch.delete(doc(db, 'tasks', task.id)));
        projects.forEach(project => batch.delete(doc(db, 'projects', project.id)));
        
        // Also delete daily tasks and custom daily tasks config
        const todayStr = new Date().toISOString().split('T')[0];
        batch.delete(doc(dailyTasksCollection, todayStr));
        batch.delete(customDailyTasksDoc);

        await batch.commit();
        const newDaily = defaultDailyTasks.map(t => ({...t, completed: false}));
        setDailyTasks(newDaily);
        setCustomDailyTasks(defaultDailyTasks);
        // Set the new default daily tasks for today
        await setDoc(doc(dailyTasksCollection, todayStr), { tasks: newDaily });
        await setDoc(customDailyTasksDoc, { tasks: defaultDailyTasks });
    } catch (error) {
        console.error("Error clearing all data: ", error);
        // Revert
        setTasks(originalTasks);
        setProjects(originalProjects);
    }
  }

  const toggleDailyTask = async (taskId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyStatusDocRef = doc(dailyTasksCollection, todayStr);
    
    const originalDailyTasks = dailyTasks;
    const updatedDailyTasks = dailyTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setDailyTasks(updatedDailyTasks);
    try {
        await setDoc(dailyStatusDocRef, { tasks: updatedDailyTasks });
    } catch (error) {
        console.error("Error updating daily task status:", error);
        // Revert UI change on error
        setDailyTasks(originalDailyTasks);
    }
  };

  const updateCustomDailyTasks = async (newCustomTasks: CustomDailyTask[]) => {
    const originalCustomTasks = customDailyTasks;
    setCustomDailyTasks(newCustomTasks);
    try {
      await setDoc(customDailyTasksDoc, { tasks: newCustomTasks });
      // Force a refresh of today's tasks
      await fetchDailyTasks();
    } catch (error) {
      console.error("Error updating custom daily tasks:", error);
      setCustomDailyTasks(originalCustomTasks);
    }
  };


  return (
    <TaskContext.Provider value={{ tasks, projects, dailyTasks, customDailyTasks, isLoaded, addTask, deleteTask, toggleTaskCompletion, updateTaskStatus, getProjectById, addProject, deleteProject, updateProject, addAiTasks, addVoiceTasks, clearAllData, toggleDailyTask, updateCustomDailyTasks }}>
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
