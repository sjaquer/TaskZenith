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
  runTransaction
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
  addAiTasks: (newTasks: string[], category: Category, priority: Priority) => void;
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
    }, [customDailyTasks]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksSnapshot, projectsSnapshot] = await Promise.all([
                    getDocs(tasksCollection),
                    getDocs(projectsCollection),
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
                await fetchDailyTasks();

            } catch (error) {
                console.error("Failed to load from Firestore", error);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchData();
    }, [fetchDailyTasks]);

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

  const deleteTask = async (taskId: string) => {
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
        console.error("Error deleting task: ", error);
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
    
    // Also delete daily tasks and custom daily tasks config
    const todayStr = new Date().toISOString().split('T')[0];
    batch.delete(doc(dailyTasksCollection, todayStr));
    batch.delete(customDailyTasksDoc);

    try {
        await batch.commit();
        setTasks([]);
        setProjects([]);
        const newDaily = defaultDailyTasks.map(t => ({...t, completed: false}));
        setDailyTasks(newDaily);
        setCustomDailyTasks(defaultDailyTasks);
        // Set the new default daily tasks for today
        await setDoc(doc(dailyTasksCollection, todayStr), { tasks: newDaily });
        await setDoc(customDailyTasksDoc, { tasks: defaultDailyTasks });
    } catch (error) {
        console.error("Error clearing all data: ", error);
    }
  }

  const toggleDailyTask = async (taskId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyStatusDocRef = doc(dailyTasksCollection, todayStr);
    
    const updatedDailyTasks = dailyTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setDailyTasks(updatedDailyTasks);
    try {
        await setDoc(dailyStatusDocRef, { tasks: updatedDailyTasks });
    } catch (error) {
        console.error("Error updating daily task status:", error);
        // Revert UI change on error
        setDailyTasks(dailyTasks);
    }
  };

  const updateCustomDailyTasks = async (newCustomTasks: CustomDailyTask[]) => {
    setCustomDailyTasks(newCustomTasks);
    try {
      await setDoc(customDailyTasksDoc, { tasks: newCustomTasks });
      // Force a refresh of today's tasks
      await fetchDailyTasks();
    } catch (error) {
      console.error("Error updating custom daily tasks:", error);
    }
  };


  return (
    <TaskContext.Provider value={{ tasks, projects, dailyTasks, customDailyTasks, isLoaded, addTask, deleteTask, toggleTaskCompletion, updateTaskStatus, getProjectById, addProject, deleteProject, addAiTasks, clearAllData, toggleDailyTask, updateCustomDailyTasks }}>
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
    