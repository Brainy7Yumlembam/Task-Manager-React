import { taskDao } from '../../dao/TaskDao';
import { firestoreService } from '../firebase/firestoreService';
import { firebaseAuthService } from '../firebase/firebaseAuth';
import { networkService } from '../connectivity/NetworkService';
import { notificationService } from '../notifications/NotificationService';
import { Task, SyncStatus } from '../../models/task';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export type SyncStateListener = (state: SyncState, unsyncedCount: number, errorMsg?: string) => void;

class SyncService {
  private isSyncing = false;
  private currentSyncState: SyncState = 'idle';
  private remoteUnsubscribe: (() => void) | null = null;
  private listeners: Set<SyncStateListener> = new Set();
  private maxRetries = 3;

  constructor() {
    this.initAutoSync();
  }

  private initAutoSync(): void {
    // Automatically trigger sync when network reconnects
    networkService.subscribe((isConnected) => {
      if (isConnected) {
        console.log('[SyncService] Device back online. Triggering automatic sync.');
        this.sync().catch(() => {});
      } else {
        this.setState('offline', 0);
      }
    });

    // Start or stop remote listener when auth state changes
    firebaseAuthService.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await taskDao.reassignGuestTasks(user.uid);
        } catch (e) {
          console.warn('[SyncService] Failed reassigning guest tasks:', e);
        }
        this.setupRemoteListener(user.uid);
        this.sync().catch(() => {});
      } else {
        this.stopRemoteListener();
      }
    });
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    this.getUnsyncedCount().then(count => {
      listener(this.currentSyncState, count);
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: SyncState, unsyncedCount: number, errorMsg?: string): void {
    this.currentSyncState = state;
    this.listeners.forEach(fn => {
      try {
        fn(state, unsyncedCount, errorMsg);
      } catch (err) {
        console.error('[SyncService] Error in sync state listener:', err);
      }
    });
  }

  public async getUnsyncedCount(): Promise<number> {
    const user = firebaseAuthService.getCurrentUser();
    if (!user) return 0;
    const pending = await taskDao.getPendingSyncTasks(user.uid);
    return pending.length;
  }

  /**
   * Main synchronization routine:
   * 1. Check network & authenticated user
   * 2. Push pending local changes to Firestore
   * 3. Pull remote updates from Firestore
   * 4. Update notification schedules if needed
   */
  public async sync(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress. Skipping redundant trigger.');
      return;
    }

    const isConnected = networkService.getIsOnline();
    if (!isConnected) {
      const pendingCount = await this.getUnsyncedCount();
      this.setState('offline', pendingCount);
      return;
    }

    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      this.setState('idle', 0);
      return;
    }

    this.isSyncing = true;
    let pendingCount = await this.getUnsyncedCount();
    this.setState('syncing', pendingCount);

    try {
      // Step 1: Push pending local changes to Firestore with bounded exponential backoff
      await this.pushPendingChangesWithRetry(user.uid);

      // Step 2: Fetch any new remote changes
      await this.pullRemoteChanges(user.uid);

      pendingCount = await this.getUnsyncedCount();
      this.setState('synced', pendingCount);
    } catch (error: any) {
      console.warn('[SyncService] Sync failed:', error?.message || error);
      pendingCount = await this.getUnsyncedCount();
      this.setState('error', pendingCount, error?.message || 'Sync failed');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Explicit Upload:
   * Reassigns any local tasks created prior to sign in to the user,
   * then pushes all local tasks directly to Firebase Cloud Firestore.
   * Returns count of uploaded tasks.
   */
  public async upload(): Promise<number> {
    const isConnected = networkService.getIsOnline();
    if (!isConnected) {
      throw new Error('Device is offline. Connect to the internet to upload tasks.');
    }

    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('Please sign in first to upload tasks to Cloud Firestore.');
    }

    this.isSyncing = true;
    this.setState('syncing', await this.getUnsyncedCount());

    try {
      // Re-assign any guest tasks created while logged out
      await taskDao.reassignGuestTasks(user.uid);

      const localTasks = await taskDao.getAllTasksForUpload(user.uid);
      let uploadedCount = 0;

      for (const task of localTasks) {
        if (task.deletedAt !== null) {
          await firestoreService.deleteRemoteTask(user.uid, task.id, task.deletedAt);
          await taskDao.hardDelete(task.id);
        } else {
          await firestoreService.uploadTask(task);
          await taskDao.updateSyncStatus(task.id, SyncStatus.SYNCED);
          uploadedCount++;
        }
      }

      const pendingCount = await this.getUnsyncedCount();
      this.setState('synced', pendingCount);
      return uploadedCount;
    } catch (err: any) {
      const pendingCount = await this.getUnsyncedCount();
      this.setState('error', pendingCount, err?.message || 'Upload failed');
      throw err;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Explicit Download:
   * Pulls all user tasks from Firebase Cloud Firestore and inserts/merges them into local SQLite.
   * Restores reminders and provides immediate offline availability.
   * Perfect after reinstalling the app!
   * Returns count of downloaded/restored tasks.
   */
  public async download(): Promise<number> {
    const isConnected = networkService.getIsOnline();
    if (!isConnected) {
      throw new Error('Device is offline. Connect to the internet to download tasks.');
    }

    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('Please sign in first to download tasks from Cloud Firestore.');
    }

    this.isSyncing = true;
    this.setState('syncing', await this.getUnsyncedCount());

    try {
      const remoteTasks = await firestoreService.fetchUserTasks(user.uid);
      let downloadedCount = 0;

      for (const remote of remoteTasks) {
        const outcome = await taskDao.upsertFromRemote(remote);
        if (outcome === 'updated' || outcome === 'inserted') {
          downloadedCount++;
          if (remote.reminderEnabled && !remote.isCompleted && remote.dueDateTime) {
            await notificationService.scheduleReminder(remote);
          } else {
            await notificationService.cancelReminder(remote.id);
          }
        } else if (outcome === 'deleted') {
          await notificationService.cancelReminder(remote.id);
        }
      }

      const pendingCount = await this.getUnsyncedCount();
      this.setState('synced', pendingCount);
      return downloadedCount;
    } catch (err: any) {
      const pendingCount = await this.getUnsyncedCount();
      this.setState('error', pendingCount, err?.message || 'Download failed');
      throw err;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pushes all local tasks marked as 'pending' to Firestore.
   */
  private async pushPendingChangesWithRetry(userId: string): Promise<void> {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        const pendingTasks = await taskDao.getPendingSyncTasks(userId);
        if (pendingTasks.length === 0) return;

        for (const task of pendingTasks) {
          if (task.deletedAt !== null) {
            // Task is deleted locally -> send tombstone to Firestore
            await firestoreService.deleteRemoteTask(userId, task.id, task.deletedAt);
            // Once confirmed remotely, hard delete the tombstone row locally
            await taskDao.hardDelete(task.id);
          } else {
            // Active task -> upload
            await firestoreService.uploadTask(task);
            await taskDao.updateSyncStatus(task.id, SyncStatus.SYNCED);
          }
        }
        return; // Success
      } catch (err) {
        attempt++;
        if (attempt >= this.maxRetries) {
          throw err;
        }
        // Bounded backoff delay: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise<void>(res => {
          setTimeout(() => res(), backoffMs);
        });
      }
    }
  }

  /**
   * Pulls remote tasks for the user and merges into SQLite using deterministic last-write-wins.
   */
  private async pullRemoteChanges(userId: string): Promise<void> {
    try {
      const remoteTasks = await firestoreService.fetchUserTasks(userId);
      for (const remote of remoteTasks) {
        const outcome = await taskDao.upsertFromRemote(remote);
        if (outcome === 'updated' || outcome === 'inserted') {
          // Reschedule or cancel reminders as appropriate
          if (remote.reminderEnabled && !remote.isCompleted && remote.dueDateTime) {
            await notificationService.scheduleReminder(remote);
          } else {
            await notificationService.cancelReminder(remote.id);
          }
        } else if (outcome === 'deleted') {
          await notificationService.cancelReminder(remote.id);
        }
      }
    } catch (err) {
      console.warn('[SyncService] Failed pulling remote changes:', err);
      // Non-fatal if offline
    }
  }

  /**
   * Subscribes to Firestore real-time updates for the logged in user.
   */
  private setupRemoteListener(userId: string): void {
    this.stopRemoteListener();

    try {
      this.remoteUnsubscribe = firestoreService.subscribeToUserTasks(
        userId,
        async (remoteTasks: Task[]) => {
          for (const remote of remoteTasks) {
            const outcome = await taskDao.upsertFromRemote(remote);
            if (outcome === 'updated' || outcome === 'inserted') {
              if (remote.reminderEnabled && !remote.isCompleted && remote.dueDateTime) {
                await notificationService.scheduleReminder(remote);
              } else {
                await notificationService.cancelReminder(remote.id);
              }
            } else if (outcome === 'deleted') {
              await notificationService.cancelReminder(remote.id);
            }
          }
          const pendingCount = await this.getUnsyncedCount();
          this.setState('synced', pendingCount);
        },
        (error) => {
          console.warn('[SyncService] Realtime subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('[SyncService] Error starting realtime listener:', err);
    }
  }

  private stopRemoteListener(): void {
    if (this.remoteUnsubscribe) {
      this.remoteUnsubscribe();
      this.remoteUnsubscribe = null;
    }
  }
}

export const syncService = new SyncService();
