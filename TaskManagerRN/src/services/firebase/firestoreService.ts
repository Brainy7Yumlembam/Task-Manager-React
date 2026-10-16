import { Task, Priority, SyncStatus } from '../../models/task';

const RTDB_BASE_URL = 'https://practice-app-370a0-default-rtdb.firebaseio.com';

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
  errorMsg: string = 'Firebase request timed out.'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    ),
  ]);
}

export class FirestoreService {
  /**
   * Uploads or updates a task in Firebase under users/{userId}/tasks/{taskId}.
   * If the task is soft-deleted locally, marks it with deletedAt tombstone.
   */
  async uploadTask(task: Task): Promise<void> {
    if (!task.userId) {
      throw new Error('[FirebaseService] Cannot sync task without an authenticated userId.');
    }

    const url = `${RTDB_BASE_URL}/users/${task.userId}/tasks/${task.id}.json`;

    const payload: Record<string, any> = {
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || null,
      dueDateTime: task.dueDateTime !== null ? task.dueDateTime : null,
      priority: task.priority || Priority.MEDIUM,
      isCompleted: Boolean(task.isCompleted),
      reminderEnabled: Boolean(task.reminderEnabled),
      reminderLeadMinutes: task.reminderLeadMinutes || 10,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      deletedAt: task.deletedAt !== null ? task.deletedAt : null,
      syncedAt: Date.now(),
    };

    const uploadPromise = fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Firebase upload failed with HTTP status ${res.status}`);
      }
    });

    await withTimeout(
      uploadPromise,
      8000,
      'Could not upload task to Firebase (timeout). Please check your internet connection.'
    );
  }

  /**
   * Permanently deletes a task document from Firebase or writes tombstone.
   */
  async deleteRemoteTask(userId: string, taskId: string, deletedAt: number = Date.now()): Promise<void> {
    const url = `${RTDB_BASE_URL}/users/${userId}/tasks/${taskId}.json`;
    const deletePromise = fetch(url, {
      method: 'DELETE',
    });

    await withTimeout(deletePromise, 8000, 'Firebase delete request timed out.');
  }

  /**
   * Fetches all remote tasks for a user from Firebase Realtime Database.
   */
  async fetchUserTasks(userId: string): Promise<Task[]> {
    const url = `${RTDB_BASE_URL}/users/${userId}/tasks.json`;

    const fetchPromise = fetch(url).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Firebase download failed with HTTP status ${res.status}`);
      }
      return res.json();
    });

    const data = await withTimeout(
      fetchPromise,
      8000,
      'Could not download tasks from Firebase (timeout). Please check your internet connection.'
    );

    if (!data || typeof data !== 'object') {
      return [];
    }

    const tasks: Task[] = [];
    Object.keys(data).forEach((key) => {
      const item = data[key];
      if (item && item.id) {
        tasks.push(this.mapDocToTask(item.id, item));
      }
    });

    return tasks;
  }

  /**
   * Subscribes to changes on the user's tasks subcollection.
   */
  subscribeToUserTasks(
    userId: string,
    onTasksUpdated: (tasks: Task[]) => void,
    onError?: (error: any) => void
  ): () => void {
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;
      try {
        const tasks = await this.fetchUserTasks(userId);
        if (isPolling) {
          onTasksUpdated(tasks);
        }
      } catch (e) {
        if (onError && isPolling) {
          onError(e);
        }
      }
    };

    // Initial poll
    poll();

    // Poll every 15 seconds in background
    const intervalId = setInterval(poll, 15000);
    if (intervalId && typeof (intervalId as any).unref === 'function') {
      (intervalId as any).unref();
    }

    return () => {
      isPolling = false;
      clearInterval(intervalId);
    };
  }

  private mapDocToTask(docId: string, data: Record<string, any>): Task {
    return {
      id: docId,
      userId: String(data.userId || ''),
      title: String(data.title || ''),
      description: String(data.description || ''),
      dueDate: data.dueDate ? String(data.dueDate) : null,
      dueDateTime: data.dueDateTime !== null && data.dueDateTime !== undefined ? Number(data.dueDateTime) : null,
      priority: (data.priority as Priority) || Priority.MEDIUM,
      isCompleted: Boolean(data.isCompleted),
      reminderEnabled: Boolean(data.reminderEnabled),
      reminderLeadMinutes: Number(data.reminderLeadMinutes || 10),
      createdAt: Number(data.createdAt || Date.now()),
      updatedAt: Number(data.updatedAt || Date.now()),
      deletedAt: data.deletedAt !== null && data.deletedAt !== undefined ? Number(data.deletedAt) : null,
      syncStatus: SyncStatus.SYNCED,
    };
  }
}

export const firestoreService = new FirestoreService();
