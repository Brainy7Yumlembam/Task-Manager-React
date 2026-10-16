import { taskDao, TaskDao } from '../dao/TaskDao';
import { Task, TaskInput, Priority, SyncStatus, TaskCounts } from '../models/task';
import { FilterType, SortBy, SortOrder } from '../models/filter';
import { notificationService } from '../services/notifications/NotificationService';
import { syncService } from '../services/sync/SyncService';
import { firebaseAuthService } from '../services/firebase/firebaseAuth';
import { generateUUID } from '../utils/idUtils';

export class TaskRepository {
  private dao: TaskDao;

  constructor(dao: TaskDao = taskDao) {
    this.dao = dao;
  }

  /**
   * Gets current active user ID, or 'local_guest' when unauthenticated.
   */
  public getEffectiveUserId(): string {
    const user = firebaseAuthService.getCurrentUser();
    return user ? user.uid : 'local_guest';
  }

  /**
   * Fetches tasks matching current filter, sort, and search parameters.
   */
  async getTasks(
    filterType: FilterType = 'ALL',
    sortBy: SortBy = 'DUE_DATE',
    sortOrder: SortOrder = 'ASC',
    searchQuery: string = ''
  ): Promise<Task[]> {
    const userId = this.getEffectiveUserId();
    return this.dao.getTasks(userId, filterType, sortBy, sortOrder, searchQuery);
  }

  /**
   * Fetches task counts for the dashboard.
   */
  async getCounts(): Promise<TaskCounts> {
    const userId = this.getEffectiveUserId();
    return this.dao.getCounts(userId);
  }

  /**
   * Gets a specific task by its ID.
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    return this.dao.getById(taskId);
  }

  /**
   * Creates a new task:
   * 1. Saves to SQLite first with syncStatus = 'pending'
   * 2. Schedules reminder if configured
   * 3. Triggers background sync to Firebase
   */
  async createTask(input: TaskInput): Promise<Task> {
    const now = Date.now();
    const task: Task = {
      id: generateUUID(),
      userId: this.getEffectiveUserId(),
      title: input.title.trim(),
      description: input.description?.trim() || '',
      dueDate: input.dueDate || null,
      dueDateTime: input.dueDateTime || null,
      priority: input.priority || Priority.MEDIUM,
      isCompleted: false,
      reminderEnabled: Boolean(input.reminderEnabled),
      reminderLeadMinutes: input.reminderLeadMinutes || 10,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: SyncStatus.PENDING,
    };

    // 1. Save to SQLite
    await this.dao.insert(task);

    // 2. Schedule local reminder if enabled
    if (task.reminderEnabled && task.dueDateTime) {
      await notificationService.scheduleReminder(task);
    }

    // 3. Trigger background sync
    syncService.sync().catch(() => {});

    return task;
  }

  /**
   * Updates an existing task:
   * 1. Saves to SQLite with updated timestamp and syncStatus = 'pending'
   * 2. Updates or cancels reminder
   * 3. Triggers background sync to Firebase
   */
  async updateTask(task: Task): Promise<void> {
    const updated: Task = {
      ...task,
      updatedAt: Date.now(),
      syncStatus: SyncStatus.PENDING,
    };

    await this.dao.update(updated);

    if (updated.reminderEnabled && !updated.isCompleted && updated.dueDateTime) {
      await notificationService.scheduleReminder(updated);
    } else {
      await notificationService.cancelReminder(updated.id);
    }

    syncService.sync().catch(() => {});
  }

  /**
   * Toggles task completion state.
   */
  async toggleTaskCompletion(task: Task): Promise<boolean> {
    const newIsCompleted = !task.isCompleted;
    const updated: Task = {
      ...task,
      isCompleted: newIsCompleted,
      updatedAt: Date.now(),
      syncStatus: SyncStatus.PENDING,
    };

    await this.dao.update(updated);

    if (newIsCompleted) {
      // Completed: cancel reminder
      await notificationService.cancelReminder(task.id);
    } else if (task.reminderEnabled && task.dueDateTime) {
      // Reopened: reschedule reminder if in future
      await notificationService.scheduleReminder(updated);
    }

    syncService.sync().catch(() => {});
    return newIsCompleted;
  }

  /**
   * Soft deletes a task:
   * 1. Cancels reminder immediately
   * 2. Marks deletedAt timestamp in SQLite with syncStatus = 'pending'
   * 3. Triggers sync so tombstone is propagated to Firestore
   */
  async deleteTask(taskId: string): Promise<void> {
    await notificationService.cancelReminder(taskId);
    await this.dao.softDelete(taskId, Date.now());
    syncService.sync().catch(() => {});
  }

  /**
   * Restores all pending reminders on app startup.
   */
  async restorePendingReminders(): Promise<void> {
    const userId = this.getEffectiveUserId();
    const tasks = await this.dao.getTasksWithPendingReminders(userId);
    await notificationService.restoreReminders(tasks);
  }
}

export const taskRepository = new TaskRepository();
