'use client';

import { type Task, type Project, type KanbanStatus, type Category, type Priority, type DailyTask, type CustomDailyTask, type OrganizedTasks, type SubTask } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  writeBatch,
  setDoc,
  deleteDoc,
  Timestamp,
  runTransaction,
  updateDoc,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyTasks: DailyTask[];
  customDailyTasks: CustomDailyTask[];
  isLoaded: boolean;
  isSyncing: boolean;
  addTask: (task: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'userId'>>) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'userId'>>) => void;
  toggleTaskCompletion: (taskId: string, subTaskId?: string) => void;
  restoreTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: KanbanStatus) => void;
  getProjectById: (projectId: string) => Project | undefined;
  addProject: (project: Omit<Project, 'id' | 'userId'>) => void;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, data: Partial<Omit<Project, 'id' | 'userId'>>) => void;
  addAiTasks: (newTasks: string[], category: Category, priority: Priority, projectId?: string) => void;
  addVoiceTasks: (newTasks: (Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'userId'>)[]) => void;
  clearAllData: () => void;
  toggleDailyTask: (taskId: string) => void;
  updateCustomDailyTasks: (tasks: CustomDailyTask[]) => void;
  applyOrganizedTasks: (organizedTasks: OrganizedTasks) => Promise<void>;
  deleteCompletedTasks: () => void;
  syncData: () => Promise<void>;
  clearLocalData: () => void;
  addSubTask: (taskId: string, subTaskTitle: string) => void;
  updateSubTask: (taskId: string, subTaskId: string, data: Partial<Omit<SubTask, 'id'>>) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const defaultDailyTasks: CustomDailyTask[] = [
    { id: 'daily-1', title: 'Hacer la cama', time: '08:00' },
    { id: 'daily-2', title: 'Meditar 10 minutos', time: '08:15' },
    { id: 'daily-3', title: 'Revisar la agenda del día', time: '08:30' },
    { id: 'daily-4', title: 'Beber un vaso de agua al despertar' },
    { id: 'daily-5', title: 'Planificar las 3 tareas más importantes' },
];

const getLocalStorageKey = (userId: string, key: 'tasks' | 'projects') => `taskzenith_${userId}_${key}`;

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
    const [customDailyTasks, setCustomDailyTasks] = useState<CustomDailyTask[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const userId = user?.uid;

    const getCollections = useCallback(() => {
        if (!userId) throw new Error("No user ID found");
        const userDocRef = doc(db, 'users', userId);
        return {
            tasksCollection: collection(userDocRef, 'tasks'),
            projectsCollection: collection(userDocRef, 'projects'),
            dailyTasksCollection: collection(userDocRef, 'dailyTasks'),
            customDailyTasksDoc: doc(userDocRef, 'config', 'customDailyTasks'),
        };
    }, [userId]);
    
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
        setDailyTasks([]);
        setCustomDailyTasks([]);
        setIsLoaded(false);
    }, [userId]);

    const syncData = useCallback(async () => {
        if (!userId) return;
        setIsSyncing(true);
        try {
            const { tasksCollection, projectsCollection } = getCollections();
            
            const tasksSnapshot = await getDocs(query(tasksCollection));
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

            const projectsSnapshot = await getDocs(query(projectsCollection));
            const projectsData = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
            setProjects(projectsData);
            
        } catch (error) {
            console.error("Error fetching from Firestore:", error);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, [userId, getCollections]);
    
    const fetchDailyTasks = useCallback(async () => {
        if (!userId) return;
        
        const { dailyTasksCollection, customDailyTasksDoc } = getCollections();
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyStatusDocRef = doc(dailyTasksCollection, todayStr);
    
        try {
            await runTransaction(db, async (transaction) => {
              const dailyStatusDoc = await transaction.get(dailyStatusDocRef);
              
              const customTasksSnapshot = await transaction.get(customDailyTasksDoc);
              let finalCustomTasks;
              
              if (customTasksSnapshot.exists()) {
                finalCustomTasks = customTasksSnapshot.data().tasks;
              } else {
                finalCustomTasks = defaultDailyTasks;
                transaction.set(customDailyTasksDoc, { tasks: finalCustomTasks });
              }
              setCustomDailyTasks(finalCustomTasks);
        
              if (dailyStatusDoc.exists()) {
                const existingDailyTasks = dailyStatusDoc.data().tasks as DailyTask[];
                // Sync with latest custom tasks
                const syncedDailyTasks = finalCustomTasks.map((ct: CustomDailyTask) => {
                    const existing = existingDailyTasks.find(dt => dt.id === ct.id);
                    return existing ? { ...ct, ...existing } : { ...ct, completed: false };
                });
                setDailyTasks(syncedDailyTasks);
                if (JSON.stringify(syncedDailyTasks) !== JSON.stringify(existingDailyTasks)) {
                    transaction.set(dailyStatusDocRef, { tasks: syncedDailyTasks });
                }

              } else {
                const newDailyTasks = finalCustomTasks.map((task: CustomDailyTask) => ({ ...task, completed: false }));
                transaction.set(dailyStatusDocRef, { tasks: newDailyTasks });
                setDailyTasks(newDailyTasks);
              }
            });
        } catch (e) {
            console.log("Could not fetch daily tasks, possibly offline.", e);
        }
    }, [userId, getCollections]);


    useEffect(() => {
      const loadInitialData = async () => {
        if (userId) {
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
          
          if (localTasks.length > 0 || localProjects.length > 0) {
            setTasks(localTasks);
            setProjects(localProjects);
          } else {
            await syncData();
          }
          
          await fetchDailyTasks();
          setIsLoaded(true);
        } else {
          clearLocalData();
        }
      };
    
      if (!authLoading) {
        loadInitialData();
      }
    }, [userId, authLoading, syncData, fetchDailyTasks, clearLocalData]);


  const addTask = async (task: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'userId'>>) => {
    if (!userId) return;
    const { tasksCollection } = getCollections();
    const newDocRef = doc(tasksCollection);

    const taskPayload: Omit<Task, 'id'> = {
        title: task.title!,
        category: task.category!,
        priority: task.priority!,
        createdAt: new Date(),
        dueDate: task.dueDate || null,
        userId: userId,
        completed: false,
        status: 'Pendiente',
        completedAt: null,
        subTasks: [],
    };

    if (task.category === 'proyectos' && task.projectId) {
        taskPayload.projectId = task.projectId;
    }

    const newTask: Task = { ...taskPayload, id: newDocRef.id };

    setTasks((prev) => [newTask, ...prev]);

    try {
        await setDoc(newDocRef, taskPayload);
    } catch (error) {
        console.error("Error adding task: ", error);
        setTasks((prev) => prev.filter(t => t.id !== newDocRef.id));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;
    const { tasksCollection } = getCollections();
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
    const { tasksCollection } = getCollections();
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

  const updateTask = async (taskId: string, data: Partial<Omit<Task, 'id' | 'userId'>>) => {
    if (!userId) return;
    const { tasksCollection } = getCollections();
    const originalTasks = [...tasks];
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...data } as Task : task))
    );
  
    try {
      const taskRef = doc(tasksCollection, taskId);
      await updateDoc(taskRef, data as any);
    } catch (error) {
      console.error('Error updating task: ', error);
      setTasks(originalTasks);
    }
  };

  const addAiTasks = async (newTasks: string[], category: Category, priority: Priority, projectId?: string) => {
    if (!userId) return;
    const { tasksCollection } = getCollections();
    const batch = writeBatch(db);
    const createdTasks: Task[] = [];

    newTasks.forEach((title) => {
        const newDocRef = doc(tasksCollection);
        const newTaskData: Omit<Task, 'id'> = {
            title,
            category,
            priority,
            userId,
            completed: false,
            status: 'Pendiente',
            createdAt: new Date(),
            completedAt: null
        };
        if (category === 'proyectos' && projectId) {
          newTaskData.projectId = projectId;
        }

        const newTask: Task = { ...newTaskData, id: newDocRef.id };
        batch.set(newDocRef, newTaskData);
        createdTasks.push(newTask);
    });

    setTasks((prev) => [...createdTasks, ...prev]);
    try {
        await batch.commit();
    } catch(error) {
        console.error("Error adding AI tasks: ", error);
        setTasks((prev) => prev.filter(t => !createdTasks.some(ct => ct.id === t.id)));
    }
  };

  const addVoiceTasks = async (newTasks: (Omit<Task, 'id' | 'completed' | 'status' | 'completedAt' | 'createdAt' | 'userId'>)[]) => {
    if (!userId) return;
    const { tasksCollection } = getCollections();
    const batch = writeBatch(db);
    const createdTasks: Task[] = [];

    newTasks.forEach((task) => {
        const newDocRef = doc(tasksCollection);
        const newTaskData: Omit<Task, 'id'> = {
            ...task,
            userId,
            completed: false,
            status: 'Pendiente',
            createdAt: new Date(),
            completedAt: null
        };
        
        const newTask: Task = { ...newTaskData, id: newDocRef.id };
        batch.set(newDocRef, newTaskData);
        createdTasks.push(newTask);
    });

    setTasks((prev) => [...createdTasks, ...prev]);
    try {
        await batch.commit();
    } catch(error) {
        console.error("Error adding AI tasks: ", error);
        setTasks((prev) => prev.filter(t => !createdTasks.some(ct => ct.id === t.id)));
    }
  };

  const toggleTaskCompletion = (taskId: string, subTaskId?: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
  
    if (subTaskId) {
      // Toggle a subtask
      const updatedSubTasks = taskToUpdate.subTasks?.map(st =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      ) || [];
      
      const allSubTasksCompleted = updatedSubTasks.every(st => st.completed);
      
      updateTask(taskId, { subTasks: updatedSubTasks, completed: allSubTasksCompleted, completedAt: allSubTasksCompleted ? new Date() : null });
  
    } else {
      // Toggle the main task
      const newCompletedState = !taskToUpdate.completed;
      const updatedSubTasks = taskToUpdate.subTasks?.map(st => ({ ...st, completed: newCompletedState }));

      updateTask(taskId, {
          completed: newCompletedState,
          completedAt: newCompletedState ? new Date() : null,
          status: newCompletedState ? 'Finalizado' : 'Pendiente',
          subTasks: updatedSubTasks
      });
    }
  };

  const restoreTask = async (taskId: string) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate || !userId) return;

    const updatedData = {
      completed: false,
      completedAt: null,
      status: 'Pendiente' as KanbanStatus,
    };

    updateTask(taskId, updatedData);
  };

  const updateTaskStatus = async (taskId: string, status: KanbanStatus) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate || !userId) return;
    const { tasksCollection } = getCollections();
  
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
  
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updatedTaskData } as Task : task))
    );
  
    try {
      await updateDoc(doc(tasksCollection, taskId), updatedTaskData as any);
    } catch (error) {
      console.error('Error updating task status: ', error);
      setTasks(tasks); // Revert
    }
  };

  const addSubTask = (taskId: string, subTaskTitle: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
  
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}-${Math.random()}`,
      title: subTaskTitle,
      completed: false,
    };
  
    const newSubTasks = [...(taskToUpdate.subTasks || []), newSubTask];
    updateTask(taskId, { subTasks: newSubTasks });
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

  const addProject = async (project: Omit<Project, 'id' | 'userId'>) => {
    if (!userId) return;
    const { projectsCollection } = getCollections();
    const newDocRef = doc(projectsCollection);

    const projectPayload: Omit<Project, 'id'> = {
      ...project,
      userId,
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

  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'userId'>>) => {
    if (!userId) return;
    const { projectsCollection } = getCollections();
    const projectRef = doc(projectsCollection, projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } as Project : p));
    try {
      await updateDoc(projectRef, data);
    } catch (error) {
      console.error("Error updating project:", error);
      // Revert is handled by the state already set before the try block
    }
  };
  
  const deleteProject = async (projectId: string) => {
    if (!userId) return;
    const { tasksCollection, projectsCollection } = getCollections();
    
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
    const { tasksCollection, projectsCollection, dailyTasksCollection, customDailyTasksDoc } = getCollections();
    
    // Clear local state and localStorage
    clearLocalData();
    
    try {
        const batch = writeBatch(db);
        const tasksSnapshot = await getDocs(query(tasksCollection));
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const projectsSnapshot = await getDocs(query(projectsCollection));
        projectsSnapshot.forEach(doc => batch.delete(doc.ref));

        const dailyTasksSnapshot = await getDocs(query(dailyTasksCollection));
        dailyTasksSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const customDailyDocSnap = await getDoc(customDailyTasksDoc);
        if (customDailyDocSnap.exists()) {
          batch.delete(customDailyTasksDoc);
        }

        await batch.commit();

        const newDaily = defaultDailyTasks.map(t => ({...t, completed: false}));
        setDailyTasks(newDaily);
        setCustomDailyTasks(defaultDailyTasks);

    } catch (error) {
        console.error("Error clearing all data: ", error);
    }
  }

  const toggleDailyTask = async (taskId: string) => {
    if (!userId) return;
    const { dailyTasksCollection } = getCollections();
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyStatusDocRef = doc(dailyTasksCollection, todayStr);
    
    const updatedDailyTasks = dailyTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setDailyTasks(updatedDailyTasks);
    try {
        await setDoc(dailyStatusDocRef, { tasks: updatedDailyTasks }, { merge: true });
    } catch (error) {
        console.error("Error updating daily task status:", error);
        setDailyTasks(dailyTasks);
    }
  };

  const updateCustomDailyTasks = async (newCustomTasks: CustomDailyTask[]) => {
    if (!userId) return;
    const { customDailyTasksDoc } = getCollections();
    const oldCustomDailyTasks = customDailyTasks;
    setCustomDailyTasks(newCustomTasks);
    try {
      await setDoc(customDailyTasksDoc, { tasks: newCustomTasks });
      await fetchDailyTasks();
    } catch (error) {
      console.error("Error updating custom daily tasks:", error);
      setCustomDailyTasks(oldCustomDailyTasks);
    }
  };
  
  const applyOrganizedTasks = async (organizedTasks: OrganizedTasks) => {
    if (!userId) return;
    const { tasksCollection } = getCollections();
    const { updatedTasks, newTasks, deletedTaskIds } = organizedTasks;
    const originalTasks = [...tasks];

    let tempTasks = [...tasks];
    tempTasks = tempTasks.filter(t => !deletedTaskIds.includes(t.id));
    tempTasks = tempTasks.map(t => {
        const found = updatedTasks.find(ut => ut.id === t.id);
        return found ? { ...t, ...found } as Task : t;
    });
    const tasksToAdd = newTasks.map((nt) => ({
      id: doc(tasksCollection).id,
      ...nt,
      userId,
      completed: false,
      status: 'Pendiente',
      createdAt: new Date(),
      completedAt: null,
    } as Task));

    setTasks([...tempTasks, ...tasksToAdd]);

    try {
      const batch = writeBatch(db);

      deletedTaskIds.forEach(id => {
          batch.delete(doc(tasksCollection, id));
      });

      updatedTasks.forEach(task => {
          const { id, ...data } = task;
          batch.update(doc(tasksCollection, id), data);
      });

      tasksToAdd.forEach(task => {
          const { id, ...data } = task;
          batch.set(doc(tasksCollection, id), data as any);
      });

      await batch.commit();

    } catch (error) {
      console.error("Error applying organized tasks:", error);
      setTasks(originalTasks); // Revert on error
      throw error;
    }
  }


  return (
    <TaskContext.Provider value={{ tasks, projects, dailyTasks, customDailyTasks, isLoaded, isSyncing, addTask, deleteTask, updateTask, toggleTaskCompletion, restoreTask, updateTaskStatus, getProjectById, addProject, deleteProject, updateProject, addAiTasks, addVoiceTasks, clearAllData, toggleDailyTask, updateCustomDailyTasks, applyOrganizedTasks, deleteCompletedTasks, syncData, clearLocalData, addSubTask, updateSubTask, deleteSubTask }}>
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
