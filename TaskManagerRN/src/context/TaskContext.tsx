import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, TaskInput, TaskCounts } from '../models/task';
import { FilterType, SortBy, SortOrder } from '../models/filter';
import { taskRepository } from '../repositories/TaskRepository';
import { syncService, SyncState } from '../services/sync/SyncService';
import { firebaseAuthService, AppUser } from '../services/firebase/firebaseAuth';
import { initDatabase } from '../database/database';
import { notificationService } from '../services/notifications/NotificationService';

interface TaskContextType {
  tasks: Task[];
  counts: TaskCounts;
  filterType: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  isLoading: boolean;
  syncState: SyncState;
  unsyncedCount: number;
  user: AppUser | null;
  setFilterType: (filter: FilterType) => void;
  setSort: (by: SortBy, order?: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  toggleTask: (task: Task) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<void>;
  refresh: () => Promise<void>;
  triggerSync: () => Promise<void>;
  uploadToCloud: () => Promise<number>;
  downloadFromCloud: () => Promise<number>;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, pending: 0, completed: 0, overdue: 0 });
  const [filterType, setFilterTypeState] = useState<FilterType>('ALL');
  const [sortBy, setSortByState] = useState<SortBy>('DUE_DATE');
  const [sortOrder, setSortOrderState] = useState<SortOrder>('ASC');
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [user, setUser] = useState<AppUser | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedCounts] = await Promise.all([
        taskRepository.getTasks(filterType, sortBy, sortOrder, searchQuery),
        taskRepository.getCounts(),
      ]);
      setTasks(fetchedTasks);
      setCounts(fetchedCounts);
    } catch (error) {
      console.warn('[TaskContext] Failed to load tasks from repository:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, sortBy, sortOrder, searchQuery]);

  // Initial initialization
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await initDatabase();
        await notificationService.initialize();
        await notificationService.requestPermission();
        await taskRepository.restorePendingReminders();

        if (isMounted) {
          const currentUser = firebaseAuthService.getCurrentUser();
          setUser(currentUser);
          await loadData();
        }
      } catch (err) {
        console.warn('[TaskContext] Bootstrap error:', err);
      }
    }

    bootstrap();

    // Subscribe to auth changes
    const unsubAuth = firebaseAuthService.onAuthStateChanged((appUser) => {
      if (isMounted) {
        setUser(appUser);
        loadData();
      }
    });

    // Subscribe to sync state changes
    const unsubSync = syncService.subscribe((state, count) => {
      if (isMounted) {
        setSyncState(state);
        setUnsyncedCount(count);
        if (state === 'synced') {
          loadData();
        }
      }
    });

    return () => {
      isMounted = false;
      unsubAuth();
      unsubSync();
    };
  }, [loadData]);

  // Reload when filters/sort/search change
  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFilterType = (filter: FilterType) => {
    setFilterTypeState(filter);
  };

  const setSort = (by: SortBy, order: SortOrder = 'ASC') => {
    setSortByState(by);
    setSortOrderState(order);
  };

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
  };

  const createTask = async (input: TaskInput): Promise<Task> => {
    const newTask = await taskRepository.createTask(input);
    await loadData();
    return newTask;
  };

  const updateTask = async (task: Task): Promise<void> => {
    await taskRepository.updateTask(task);
    await loadData();
  };

  const toggleTask = async (task: Task): Promise<boolean> => {
    const result = await taskRepository.toggleTaskCompletion(task);
    await loadData();
    return result;
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await taskRepository.deleteTask(taskId);
    await loadData();
  };

  const refresh = async (): Promise<void> => {
    setIsLoading(true);
    await loadData();
    await syncService.sync().catch(() => {});
  };

  const triggerSync = async (): Promise<void> => {
    await syncService.sync();
    await loadData();
  };

  const uploadToCloud = async (): Promise<number> => {
    const count = await syncService.upload();
    await loadData();
    return count;
  };

  const downloadFromCloud = async (): Promise<number> => {
    const count = await syncService.download();
    await loadData();
    return count;
  };

  const signInAnonymously = async (): Promise<void> => {
    try {
      const u = await firebaseAuthService.signInAnonymously();
      setUser(u);
      await syncService.sync().catch(() => {});
      await loadData();
    } catch (e: any) {
      console.warn('[TaskContext] Sign in anonymously failed:', e?.message);
      throw e;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<void> => {
    const u = await firebaseAuthService.signInWithEmail(email, pass);
    setUser(u);
    await syncService.sync().catch(() => {});
    await loadData();
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<void> => {
    const u = await firebaseAuthService.signUpWithEmail(email, pass);
    setUser(u);
    await syncService.sync().catch(() => {});
    await loadData();
  };

  const signOut = async (): Promise<void> => {
    await firebaseAuthService.signOut();
    setUser(null);
    await loadData();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        counts,
        filterType,
        sortBy,
        sortOrder,
        searchQuery,
        isLoading,
        syncState,
        unsyncedCount,
        user,
        setFilterType,
        setSort,
        setSearchQuery,
        createTask,
        updateTask,
        toggleTask,
        deleteTask,
        refresh,
        triggerSync,
        uploadToCloud,
        downloadFromCloud,
        signInAnonymously,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
