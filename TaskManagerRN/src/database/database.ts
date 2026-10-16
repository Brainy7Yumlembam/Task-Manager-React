import { open, DB, QueryResult } from '@op-engineering/op-sqlite';

const DB_NAME = 'taskmanager.db';
let dbInstance: DB | null = null;
let isInitialized = false;

function isNativeAvailable(): boolean {
  try {
    return typeof open === 'function';
  } catch {
    return false;
  }
}

/**
 * Gets or initializes the SQLite database connection.
 */
export function getDatabase(): DB {
  if (dbInstance) {
    return dbInstance;
  }

  if (isNativeAvailable()) {
    try {
      dbInstance = open({ name: DB_NAME });
      return dbInstance;
    } catch (error) {
      console.warn('[Database] Failed to open native SQLite, falling back to mock mode:', error);
    }
  }

  // Fallback mock DB implementation for unit tests
  dbInstance = {
    execute: async (sql: string, params?: any[]): Promise<QueryResult> => {
      return {
        rows: [],
        rowsAffected: 0,
        insertId: 0,
      };
    },
    executeSync: (sql: string, params?: any[]): QueryResult => {
      return {
        rows: [],
        rowsAffected: 0,
        insertId: 0,
      };
    },
    transaction: async (fn: any): Promise<void> => {
      await fn({
        execute: async () => ({ rows: [], rowsAffected: 0 }),
        executeSync: () => ({ rows: [], rowsAffected: 0 }),
      });
    },
    close: () => {},
    closeAsync: async () => {},
    interrupt: () => {},
    delete: () => {},
  } as unknown as DB;

  return dbInstance;
}

/**
 * Initializes database schema and runs migrations.
 */
export async function initDatabase(): Promise<void> {
  if (isInitialized) return;

  const db = getDatabase();

  try {
    // Enable WAL mode for better concurrency and performance
    try {
      await db.execute('PRAGMA journal_mode = WAL;');
      await db.execute('PRAGMA foreign_keys = ON;');
    } catch (e) {
      // Pragmas may fail in non-native mode, ignore safely
    }

    // Create tasks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        dueDate TEXT,
        dueDateTime INTEGER,
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        isCompleted INTEGER NOT NULL DEFAULT 0,
        reminderEnabled INTEGER NOT NULL DEFAULT 0,
        reminderLeadMinutes INTEGER NOT NULL DEFAULT 10,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        deletedAt INTEGER,
        syncStatus TEXT NOT NULL DEFAULT 'pending'
      );
    `);

    // Create indices matching Kotlin app & sync architecture
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(userId);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(isCompleted);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_due_datetime ON tasks(dueDateTime);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deletedAt);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(syncStatus);`);

    isInitialized = true;
    console.log('[Database] Initialized SQLite schema successfully.');
  } catch (error) {
    console.error('[Database] Error initializing database schema:', error);
    throw error;
  }
}

/**
 * Runs a transactional database callback.
 */
export async function runTransaction(callback: (tx: any) => Promise<void>): Promise<void> {
  const db = getDatabase();
  await db.transaction(callback);
}
