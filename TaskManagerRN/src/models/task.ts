/**
 * Task priority levels matching the Kotlin app.
 */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Synchronization status for offline-first architecture.
 */
export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
}

/**
 * Task model matching the local SQLite schema and remote Firestore structure.
 */
export interface Task {
  /** Stable unique ID generated on device (UUID v4) */
  id: string;
  /** Authenticated Firebase user ID */
  userId: string;
  /** Task title (required) */
  title: string;
  /** Task description (optional) */
  description: string;
  /** Optional formatted date string (e.g. 'dd-MMM-yyyy') */
  dueDate: string | null;
  /** Milliseconds epoch timestamp for the exact due date and time */
  dueDateTime: number | null;
  /** Priority level */
  priority: Priority;
  /** Completion flag */
  isCompleted: boolean;
  /** Whether reminder alarm is configured */
  reminderEnabled: boolean;
  /** Minutes before dueDateTime to alert user (5, 10, 30, 60) */
  reminderLeadMinutes: number;
  /** Milliseconds epoch timestamp when task was created */
  createdAt: number;
  /** Milliseconds epoch timestamp when task was last updated */
  updatedAt: number;
  /** Milliseconds epoch timestamp when task was soft deleted (tombstone) */
  deletedAt: number | null;
  /** Synchronization status with Firebase */
  syncStatus: SyncStatus;
}

/**
 * Input payload when creating or updating a task from the UI.
 */
export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  dueDateTime?: number | null;
  priority?: Priority;
  isCompleted?: boolean;
  reminderEnabled?: boolean;
  reminderLeadMinutes?: number;
}

/**
 * Dashboard metrics summary.
 */
export interface TaskCounts {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}
