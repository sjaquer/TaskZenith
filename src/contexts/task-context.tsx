'use client';

import { type Task, type Project, type KanbanStatus, type Category, type Priority, type DailyTask, type CustomDailyTask, type OrganizedTasks } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { firebaseApp } from '@/lib/firebase';
import { 
  getFirestore, 
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
} from "firebase/firestore";

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyTasks: DailyTask[];
  customDailyTasks: CustomDailyTask[];
  isLoaded: boolean;
  isSyncing: boolean;
  addTask: (task: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt'>>) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'completed'>>) => void;
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
  applyOrganizedTasks: (organizedTasks: OrganizedTasks) => Promise<void>;
  deleteCompletedTasks: () => void;
  syncData: () => Promise<void>;
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
    const [isSyncing, setIsSyncing] = useState(false);

    const saveDataToLocalStorage = (tasks: Task[], projects: Project[]) => {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('projects', JSON.stringify(projects));
    };

    const syncData = async () => {
        setIsSyncing(true);
        try {
            const tasksSnapshot = await getDocs(tasksCollection);
            const tasksData = tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : null }) as Task);
            setTasks(tasksData);

            const projectsSnapshot = await getDocs(projectsCollection);
            const projectsData = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);
            setProjects(projectsData);
            
            saveDataToLocalStorage(tasksData, projectsData);
        } catch (error) {
            console.error("Error fetching from Firestore:", error);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    };


    useEffect(() => {
      const loadData = async () => {
          const localTasks = localStorage.getItem('tasks');
          const localProjects = localStorage.getItem('projects');
  
          if (localTasks && localProjects) {
              const parsedTasks = JSON.parse(localTasks) as Task[];
              const parsedProjects = JSON.parse(localProjects) as Project[];
              setTasks(parsedTasks.map(t => ({...t, completedAt: t.completedAt ? new Date(t.completedAt) : null})));
              setProjects(parsedProjects);
          } else {
              // First time load or empty localStorage
              await syncData();
          }
          await fetchDailyTasks();
          setIsLoaded(true);
      };
      
      loadData();
    }, []);

    useEffect(() => {
      // Persist changes to local storage whenever tasks or projects change
      if (isLoaded) {
          saveDataToLocalStorage(tasks, projects);
      }
    }, [tasks, projects, isLoaded]);

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
            console.log("Could not fetch daily tasks, possibly offline.", e);
        }
    }, [customDailyTasks]);

  const addTask = async (task: Partial<Omit<Task, 'id' | 'completed' | 'status' | 'completedAt'>>) => {
    const newTaskId = `task-${Date.now()}`;
    
    const taskPayload: Omit<Task, 'id' | 'completed' | 'status' | 'completedAt'> = {
        title: task.title!,
        category: task.category!,
        priority: task.priority!,
    };

    if (task.category === 'proyectos' && task.projectId) {
        taskPayload.projectId = task.projectId;
    }

    const newTask: Task = {
      ...taskPayload,
      id: newTaskId,
      completed: false,
      status: 'Pendiente',
      completedAt: null
    } as Task;

    setTasks((prev) => [newTask, ...prev]);

    try {
        const { id, ...taskDataForFirestore } = newTask;
        const dataToSend: Partial<Omit<Task, 'id'>> = { ...taskDataForFirestore };
        if (dataToSend.projectId === undefined) {
          delete dataToSend.projectId;
        }

        await setDoc(doc(db, 'tasks', newTaskId), dataToSend);
    } catch (error) {
        console.error("Error adding task: ", error);
        setTasks((prev) => prev.filter(t => t.id !== newTaskId));
    }
  };

  const deleteTask = async (taskId: string) => {
    const originalTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
        console.error("Error deleting task: ", error);
        setTasks(originalTasks);
    }
  };

  const deleteCompletedTasks = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    const tasksToKeep = tasks.filter(t => !t.completed);
    setTasks(tasksToKeep);

    try {
        const batch = writeBatch(db);
        completedTasks.forEach(task => {
            batch.delete(doc(db, 'tasks', task.id));
        });
        await batch.commit();
    } catch (error) {
        console.error("Error deleting completed tasks: ", error);
        setTasks(tasks); // Revert
    }
  };

  const updateTask = async (taskId: string, data: Partial<Omit<Task, 'id'>>) => {
    const originalTasks = [...tasks];
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...data } : task))
    );
  
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, data);
    } catch (error) {
      console.error('Error updating task: ', error);
      setTasks(originalTasks);
    }
  };

  const addAiTasks = async (newTasks: string[], category: Category, priority: Priority, projectId?: string) => {
    const batch = writeBatch(db);
    const createdTasks: Task[] = [];

    newTasks.forEach((title, index) => {
        const newTaskId = `task-ai-${Date.now()}-${index}`;
        const newTaskData: Omit<Task, 'id'> = {
            title,
            category,
            priority,
            completed: false,
            status: 'Pendiente',
            completedAt: null
        };
        if (category === 'proyectos' && projectId) {
          newTaskData.projectId = projectId;
        }

        const newTask: Task = {
            ...newTaskData,
            id: newTaskId,
        };
        const taskRef = doc(db, 'tasks', newTaskId);
        batch.set(taskRef, newTaskData);
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

  const addVoiceTasks = async (newTasks: Omit<Task, 'id' | 'completed' | 'status'>[]) => {
    const batch = writeBatch(db);
    const createdTasks: Task[] = [];

    newTasks.forEach((task, index) => {
        const newTaskId = `task-voice-${Date.now()}-${index}`;
        const taskDataForFirestore: Partial<Task> = {
            ...task,
            completed: false,
            status: 'Pendiente',
        };
        if (taskDataForFirestore.projectId === undefined) {
          delete taskDataForFirestore.projectId;
        }

        const newTask: Task = {
            id: newTaskId,
            ...taskDataForFirestore,
        } as Task;
        
        const taskRef = doc(db, 'tasks', newTaskId);
        batch.set(taskRef, taskDataForFirestore);
        createdTasks.push(newTask);
    });

    setTasks((prev) => [...createdTasks, ...prev]);
    try {
        await batch.commit();
    } catch(error) {
        console.error("Error adding voice tasks: ", error);
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

    setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task));

    try {
        await updateDoc(doc(db, 'tasks', taskId), {
            completed: updatedTask.completed,
            completedAt: updatedTask.completedAt,
            status: updatedTask.status
        });
    } catch(error) {
        console.error("Error toggling task completion: ", error);
        setTasks(tasks.map(t => t.id === taskId ? taskToUpdate : t));
    }
  };

  const updateTaskStatus = async (taskId: string, status: KanbanStatus) => {
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
  
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updatedTaskData } : task))
    );
  
    try {
      await updateDoc(doc(db, 'tasks', taskId), updatedTaskData);
    } catch (error) {
      console.error('Error updating task status: ', error);
      setTasks(tasks); // Revert
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

    setProjects(prev => [...prev, newProject]);
    try {
        await setDoc(doc(db, 'projects', newProjectId), newProject);
    } catch(error) {
        console.error("Error adding project: ", error);
        setProjects(prev => prev.filter(p => p.id !== newProjectId));
    }
  }

  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id'>>) => {
    const projectRef = doc(db, 'projects', projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
    try {
      await updateDoc(projectRef, data);
    } catch (error) {
      console.error("Error updating project:", error);
      // Revert is handled by the state already set before the try block
    }
  };
  
  const deleteProject = async (projectId: string) => {
    const tasksToDelete = tasks.filter(t => t.projectId === projectId);
    const tasksToKeep = tasks.filter(t => t.projectId !== projectId);
    const projectsToKeep = projects.filter(p => p.id !== projectId);
    
    setProjects(projectsToKeep);
    setTasks(tasksToKeep);
    
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'projects', projectId));
        tasksToDelete.forEach(t => {
            const taskRef = doc(db, 'tasks', t.id);
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
    setTasks([]);
    setProjects([]);
    
    try {
        const batch = writeBatch(db);
        const tasksSnapshot = await getDocs(tasksCollection);
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        
        const projectsSnapshot = await getDocs(projectsCollection);
        projectsSnapshot.forEach(doc => batch.delete(doc.ref));

        const todayStr = new Date().toISOString().split('T')[0];
        batch.delete(doc(dailyTasksCollection, todayStr));
        batch.delete(customDailyTasksDoc);

        await batch.commit();

        const newDaily = defaultDailyTasks.map(t => ({...t, completed: false}));
        setDailyTasks(newDaily);
        setCustomDailyTasks(defaultDailyTasks);

        await setDoc(doc(dailyTasksCollection, todayStr), { tasks: newDaily });
        await setDoc(customDailyTasksDoc, { tasks: defaultDailyTasks });

        localStorage.removeItem('tasks');
        localStorage.removeItem('projects');
    } catch (error) {
        console.error("Error clearing all data: ", error);
        // Revert is tricky here, but we can try reloading from local storage if it existed
        const localTasks = localStorage.getItem('tasks');
        const localProjects = localStorage.getItem('projects');
        if (localTasks && localProjects) {
            setTasks(JSON.parse(localTasks));
            setProjects(JSON.parse(localProjects));
        }
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
        setDailyTasks(dailyTasks);
    }
  };

  const updateCustomDailyTasks = async (newCustomTasks: CustomDailyTask[]) => {
    setCustomDailyTasks(newCustomTasks);
    try {
      await setDoc(customDailyTasksDoc, { tasks: newCustomTasks });
      await fetchDailyTasks();
    } catch (error) {
      console.error("Error updating custom daily tasks:", error);
      // Revert
    }
  };
  
  const applyOrganizedTasks = async (organizedTasks: OrganizedTasks) => {
    const { updatedTasks, newTasks, deletedTaskIds } = organizedTasks;

    let tempTasks = [...tasks];
    tempTasks = tempTasks.filter(t => !deletedTaskIds.includes(t.id));
    tempTasks = tempTasks.map(t => {
        const found = updatedTasks.find(ut => ut.id === t.id);
        return found ? { ...t, ...found } : t;
    });
    const tasksToAdd = newTasks.map((nt, i) => ({
      id: `new-organized-${Date.now()}-${i}`,
      ...nt,
      completed: false,
      status: 'Pendiente',
      completedAt: null,
    } as Task));

    setTasks([...tempTasks, ...tasksToAdd]);

    try {
      const batch = writeBatch(db);

      deletedTaskIds.forEach(id => {
          batch.delete(doc(db, 'tasks', id));
      });

      updatedTasks.forEach(task => {
          const { id, ...data } = task;
          batch.update(doc(db, 'tasks', id), data);
      });

      tasksToAdd.forEach(task => {
          const { id, ...data } = task;
          batch.set(doc(db, 'tasks', id), data);
      });

      await batch.commit();

    } catch (error) {
      console.error("Error applying organized tasks:", error);
      setTasks(tasks); // Revert on error
      throw error;
    }
  }


  return (
    <TaskContext.Provider value={{ tasks, projects, dailyTasks, customDailyTasks, isLoaded, isSyncing, addTask, deleteTask, updateTask, toggleTaskCompletion, updateTaskStatus, getProjectById, addProject, deleteProject, updateProject, addAiTasks, addVoiceTasks, clearAllData, toggleDailyTask, updateCustomDailyTasks, applyOrganizedTasks, deleteCompletedTasks, syncData }}>
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
