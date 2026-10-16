import { getDatabase } from '../database/database';
import { Task, Priority, SyncStatus, TaskCounts } from '../models/task';
import { FilterType, SortBy, SortOrder } from '../models/filter';

function mapRowToTask(row: any): Task {
  return {
    id: String(row.id),
    userId: String(row.userId),
    title: String(row.title),
    description: row.description ? String(row.description) : '',
    dueDate: row.dueDate ? String(row.dueDate) : null,
    dueDateTime: row.dueDateTime !== null && row.dueDateTime !== undefined ? Number(row.dueDateTime) : null,
    priority: (row.priority as Priority) || Priority.MEDIUM,
    isCompleted: Boolean(row.isCompleted),
    reminderEnabled: Boolean(row.reminderEnabled),
    reminderLeadMinutes: Number(row.reminderLeadMinutes || 10),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
    deletedAt: row.deletedAt !== null && row.deletedAt !== undefined ? Number(row.deletedAt) : null,
    syncStatus: (row.syncStatus as SyncStatus) || SyncStatus.PENDING,
  };
}

export class TaskDao {
  /**
   * Inserts a new task into the local database.
   */
  async insert(task: Task): Promise<void> {
    const db = getDatabase();
    const sql = `
      INSERT INTO tasks (
        id, userId, title, description, dueDate, dueDateTime,
        priority, isCompleted, reminderEnabled, reminderLeadMinutes,
        createdAt, updatedAt, deletedAt, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      task.id,
      task.userId,
      task.title,
      task.description,
      task.dueDate,
      task.dueDateTime,
      task.priority,
      task.isCompleted ? 1 : 0,
      task.reminderEnabled ? 1 : 0,
      task.reminderLeadMinutes,
      task.createdAt,
      task.updatedAt,
      task.deletedAt,
      task.syncStatus,
    ];
    await db.execute(sql, params);
  }

  /**
   * Updates an existing task.
   */
  async update(task: Task): Promise<void> {
    const db = getDatabase();
    const sql = `
      UPDATE tasks SET
        title = ?,
        description = ?,
        dueDate = ?,
        dueDateTime = ?,
        priority = ?,
        isCompleted = ?,
        reminderEnabled = ?,
        reminderLeadMinutes = ?,
        updatedAt = ?,
        deletedAt = ?,
        syncStatus = ?
      WHERE id = ?;
    `;
    const params = [
      task.title,
      task.description,
      task.dueDate,
      task.dueDateTime,
      task.priority,
      task.isCompleted ? 1 : 0,
      task.reminderEnabled ? 1 : 0,
      task.reminderLeadMinutes,
      task.updatedAt,
      task.deletedAt,
      task.syncStatus,
      task.id,
    ];
    await db.execute(sql, params);
  }

  /**
   * Soft deletes a task by setting its tombstone deletedAt and pending syncStatus.
   */
  async softDelete(taskId: string, deletedAt: number): Promise<void> {
    const db = getDatabase();
    const sql = `
      UPDATE tasks SET
        deletedAt = ?,
        updatedAt = ?,
        syncStatus = ?
      WHERE id = ?;
    `;
    await db.execute(sql, [deletedAt, deletedAt, SyncStatus.PENDING, taskId]);
  }

  /**
   * Hard deletes a task from the database.
   */
  async hardDelete(taskId: string): Promise<void> {
    const db = getDatabase();
    const sql = `DELETE FROM tasks WHERE id = ?;`;
    await db.execute(sql, [taskId]);
  }

  /**
   * Gets a task by its unique ID.
   */
  async getById(taskId: string): Promise<Task | null> {
    const db = getDatabase();
    const res = await db.execute(`SELECT * FROM tasks WHERE id = ? LIMIT 1;`, [taskId]);
    if (res.rows && res.rows.length > 0) {
      return mapRowToTask(res.rows[0]);
    }
    return null;
  }

  /**
   * Queries tasks for an authenticated user with filtering, sorting, and search.
   * Matches the behavior and ordering of the Kotlin Room DAO.
   */
  async getTasks(
    userId: string,
    filterType: FilterType = 'ALL',
    sortBy: SortBy = 'DUE_DATE',
    sortOrder: SortOrder = 'ASC',
    searchQuery: string = '',
    currentTime: number = Date.now()
  ): Promise<Task[]> {
    const db = getDatabase();
    const conditions: string[] = ['userId = ?', 'deletedAt IS NULL'];
    const params: any[] = [userId];

    if (searchQuery.trim().length > 0) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${searchQuery.trim()}%`, `%${searchQuery.trim()}%`);
    }

    switch (filterType) {
      case 'PENDING':
        conditions.push('isCompleted = 0');
        break;
      case 'COMPLETED':
        conditions.push('isCompleted = 1');
        break;
      case 'OVERDUE':
        conditions.push('isCompleted = 0 AND dueDateTime IS NOT NULL AND dueDateTime < ?');
        params.push(currentTime);
        break;
      case 'ALL':
      default:
        break;
    }

    let orderByClause = '';
    switch (sortBy) {
      case 'PRIORITY':
        // High -> Medium -> Low (or reverse)
        orderByClause = `
          isCompleted ASC,
          CASE priority
            WHEN 'HIGH' THEN 1
            WHEN 'MEDIUM' THEN 2
            WHEN 'LOW' THEN 3
            ELSE 4
          END ${sortOrder},
          CASE WHEN dueDateTime IS NULL THEN 1 ELSE 0 END ASC,
          dueDateTime ASC
        `;
        break;
      case 'CREATED_AT':
        orderByClause = `isCompleted ASC, createdAt ${sortOrder}`;
        break;
      case 'DUE_DATE':
      default:
        // Kotlin app behavior:
        // isCompleted ASC, CASE WHEN dueDateTime IS NULL THEN 1 ELSE 0 END, dueDateTime ASC
        if (sortOrder === 'DESC') {
          orderByClause = `
            isCompleted ASC,
            CASE WHEN dueDateTime IS NULL THEN 1 ELSE 0 END ASC,
            dueDateTime DESC
          `;
        } else {
          orderByClause = `
            isCompleted ASC,
            CASE WHEN dueDateTime IS NULL THEN 1 ELSE 0 END ASC,
            dueDateTime ASC
          `;
        }
        break;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM tasks ${whereClause} ORDER BY ${orderByClause};`;

    const res = await db.execute(sql, params);
    const tasks: Task[] = [];
    if (res.rows) {
      for (let i = 0; i < res.rows.length; i++) {
        tasks.push(mapRowToTask(res.rows[i]));
      }
    }
    return tasks;
  }

  /**
   * Retrieves dashboard summary metrics for total, pending, completed, and overdue tasks.
   */
  async getCounts(userId: string, currentTime: number = Date.now()): Promise<TaskCounts> {
    const db = getDatabase();

    const sqlTotal = `SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND deletedAt IS NULL;`;
    const sqlPending = `SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND isCompleted = 0 AND deletedAt IS NULL;`;
    const sqlCompleted = `SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND isCompleted = 1 AND deletedAt IS NULL;`;
    const sqlOverdue = `SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND isCompleted = 0 AND dueDateTime IS NOT NULL AND dueDateTime < ? AND deletedAt IS NULL;`;

    const [resTotal, resPending, resCompleted, resOverdue] = await Promise.all([
      db.execute(sqlTotal, [userId]),
      db.execute(sqlPending, [userId]),
      db.execute(sqlCompleted, [userId]),
      db.execute(sqlOverdue, [userId, currentTime]),
    ]);

    return {
      total: resTotal.rows && resTotal.rows.length > 0 ? Number(resTotal.rows[0].count) : 0,
      pending: resPending.rows && resPending.rows.length > 0 ? Number(resPending.rows[0].count) : 0,
      completed: resCompleted.rows && resCompleted.rows.length > 0 ? Number(resCompleted.rows[0].count) : 0,
      overdue: resOverdue.rows && resOverdue.rows.length > 0 ? Number(resOverdue.rows[0].count) : 0,
    };
  }

  /**
   * Retrieves tasks pending synchronization to Firebase.
   */
  async getPendingSyncTasks(userId?: string): Promise<Task[]> {
    const db = getDatabase();
    let sql = `SELECT * FROM tasks WHERE syncStatus = ?`;
    const params: any[] = [SyncStatus.PENDING];

    if (userId) {
      sql += ` AND userId = ?`;
      params.push(userId);
    }

    const res = await db.execute(sql, params);
    const tasks: Task[] = [];
    if (res.rows) {
      for (let i = 0; i < res.rows.length; i++) {
        tasks.push(mapRowToTask(res.rows[i]));
      }
    }
    return tasks;
  }

  /**
   * Updates sync status of a task.
   */
  async updateSyncStatus(taskId: string, status: SyncStatus): Promise<void> {
    const db = getDatabase();
    await db.execute(`UPDATE tasks SET syncStatus = ? WHERE id = ?;`, [status, taskId]);
  }

  /**
   * Upserts a task from remote cloud sync.
   * If local has pending changes with newer updatedAt, retains local change (conflict resolution).
   */
  async upsertFromRemote(remoteTask: Task): Promise<'updated' | 'inserted' | 'skipped' | 'deleted'> {
    const local = await this.getById(remoteTask.id);

    // If remote is marked deleted, delete locally
    if (remoteTask.deletedAt !== null) {
      if (local) {
        await this.hardDelete(remoteTask.id);
        return 'deleted';
      }
      return 'skipped';
    }

    if (local) {
      // Conflict resolution: Last-write-wins based on updatedAt timestamp
      if (local.syncStatus === SyncStatus.PENDING && local.updatedAt > remoteTask.updatedAt) {
        // Local is newer and has uncommitted changes, do not overwrite
        return 'skipped';
      }

      // Update existing local record with remote version
      const db = getDatabase();
      const sql = `
        UPDATE tasks SET
          userId = ?,
          title = ?,
          description = ?,
          dueDate = ?,
          dueDateTime = ?,
          priority = ?,
          isCompleted = ?,
          reminderEnabled = ?,
          reminderLeadMinutes = ?,
          createdAt = ?,
          updatedAt = ?,
          deletedAt = ?,
          syncStatus = ?
        WHERE id = ?;
      `;
      await db.execute(sql, [
        remoteTask.userId,
        remoteTask.title,
        remoteTask.description,
        remoteTask.dueDate,
        remoteTask.dueDateTime,
        remoteTask.priority,
        remoteTask.isCompleted ? 1 : 0,
        remoteTask.reminderEnabled ? 1 : 0,
        remoteTask.reminderLeadMinutes,
        remoteTask.createdAt,
        remoteTask.updatedAt,
        remoteTask.deletedAt,
        SyncStatus.SYNCED,
        remoteTask.id,
      ]);
      return 'updated';
    } else {
      // Insert new task from remote
      await this.insert({
        ...remoteTask,
        syncStatus: SyncStatus.SYNCED,
      });
      return 'inserted';
    }
  }

  /**
   * Finds tasks that have active reminders scheduled in the future.
   */
  async getTasksWithPendingReminders(userId: string, currentTime: number = Date.now()): Promise<Task[]> {
    const db = getDatabase();
    const sql = `
      SELECT * FROM tasks
      WHERE userId = ?
        AND isCompleted = 0
        AND reminderEnabled = 1
        AND dueDateTime IS NOT NULL
        AND dueDateTime > ?
        AND deletedAt IS NULL;
    `;
    const res = await db.execute(sql, [userId, currentTime]);
    const tasks: Task[] = [];
    if (res.rows) {
      for (let i = 0; i < res.rows.length; i++) {
        tasks.push(mapRowToTask(res.rows[i]));
      }
    }
    return tasks;
  }

  /**
   * Reassigns any tasks created without an authenticated userId or under 'local_guest'
   * to the authenticated user ID, marking them as PENDING so they upload.
   */
  async reassignGuestTasks(newUserId: string): Promise<number> {
    const db = getDatabase();
    const res = await db.execute(
      `UPDATE tasks SET userId = ?, syncStatus = ? WHERE userId = 'local_guest' OR userId IS NULL OR userId = '';`,
      [newUserId, SyncStatus.PENDING]
    );
    return res.rowsAffected || 0;
  }

  /**
   * Retrieves all non-deleted local tasks for a user to upload directly to Firebase.
   */
  async getAllTasksForUpload(userId: string): Promise<Task[]> {
    const db = getDatabase();
    const res = await db.execute(
      `SELECT * FROM tasks WHERE userId = ? AND deletedAt IS NULL;`,
      [userId]
    );
    const tasks: Task[] = [];
    if (res.rows) {
      for (let i = 0; i < res.rows.length; i++) {
        tasks.push(mapRowToTask(res.rows[i]));
      }
    }
    return tasks;
  }
}

export const taskDao = new TaskDao();
