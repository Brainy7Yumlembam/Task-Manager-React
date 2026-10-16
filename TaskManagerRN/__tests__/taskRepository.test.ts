import { TaskRepository } from '../src/repositories/TaskRepository';
import { TaskDao } from '../src/dao/TaskDao';
import { Task, Priority, SyncStatus, TaskCounts } from '../src/models/task';
import { FilterType, SortBy, SortOrder } from '../src/models/filter';

// Create an in-memory implementation of TaskDao for clean, reliable testing
class MockTaskDao implements Partial<TaskDao> {
  private store: Map<string, Task> = new Map();

  async insert(task: Task): Promise<void> {
    this.store.set(task.id, { ...task });
  }

  async update(task: Task): Promise<void> {
    this.store.set(task.id, { ...task });
  }

  async softDelete(taskId: string, deletedAt: number): Promise<void> {
    const task = this.store.get(taskId);
    if (task) {
      task.deletedAt = deletedAt;
      task.syncStatus = SyncStatus.PENDING;
      this.store.set(taskId, task);
    }
  }

  async hardDelete(taskId: string): Promise<void> {
    this.store.delete(taskId);
  }

  async getById(taskId: string): Promise<Task | null> {
    const task = this.store.get(taskId);
    return task && task.deletedAt === null ? { ...task } : null;
  }

  async getTasks(
    userId: string,
    filterType: FilterType = 'ALL',
    sortBy: SortBy = 'DUE_DATE',
    sortOrder: SortOrder = 'ASC',
    searchQuery: string = ''
  ): Promise<Task[]> {
    let list = Array.from(this.store.values()).filter(
      t => t.userId === userId && t.deletedAt === null
    );

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    if (filterType === 'PENDING') {
      list = list.filter(t => !t.isCompleted);
    } else if (filterType === 'COMPLETED') {
      list = list.filter(t => t.isCompleted);
    } else if (filterType === 'OVERDUE') {
      const now = Date.now();
      list = list.filter(t => !t.isCompleted && t.dueDateTime !== null && t.dueDateTime < now);
    }

    // Sort
    list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (sortBy === 'PRIORITY') {
        const pOrder: Record<Priority, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
        const diff = pOrder[a.priority] - pOrder[b.priority];
        return sortOrder === 'ASC' ? diff : -diff;
      } else if (sortBy === 'CREATED_AT') {
        const diff = a.createdAt - b.createdAt;
        return sortOrder === 'ASC' ? diff : -diff;
      } else {
        const aTime = a.dueDateTime || Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDateTime || Number.MAX_SAFE_INTEGER;
        const diff = aTime - bTime;
        return sortOrder === 'ASC' ? diff : -diff;
      }
    });

    return list;
  }

  async getCounts(userId: string): Promise<TaskCounts> {
    const active = Array.from(this.store.values()).filter(
      t => t.userId === userId && t.deletedAt === null
    );
    const now = Date.now();

    return {
      total: active.length,
      pending: active.filter(t => !t.isCompleted).length,
      completed: active.filter(t => t.isCompleted).length,
      overdue: active.filter(t => !t.isCompleted && t.dueDateTime !== null && t.dueDateTime < now).length,
    };
  }

  async getPendingSyncTasks(userId?: string): Promise<Task[]> {
    return Array.from(this.store.values()).filter(t => t.syncStatus === SyncStatus.PENDING);
  }

  async updateSyncStatus(taskId: string, status: SyncStatus): Promise<void> {
    const task = this.store.get(taskId);
    if (task) {
      task.syncStatus = status;
      this.store.set(taskId, task);
    }
  }

  async upsertFromRemote(remote: Task): Promise<'updated' | 'inserted' | 'skipped' | 'deleted'> {
    const local = this.store.get(remote.id);
    if (remote.deletedAt !== null) {
      if (local) {
        this.store.delete(remote.id);
        return 'deleted';
      }
      return 'skipped';
    }

    if (local) {
      if (local.syncStatus === SyncStatus.PENDING && local.updatedAt > remote.updatedAt) {
        return 'skipped';
      }
      this.store.set(remote.id, { ...remote, syncStatus: SyncStatus.SYNCED });
      return 'updated';
    } else {
      this.store.set(remote.id, { ...remote, syncStatus: SyncStatus.SYNCED });
      return 'inserted';
    }
  }
}

describe('TaskRepository & CRUD Operations', () => {
  let mockDao: MockTaskDao;
  let repo: TaskRepository;

  beforeEach(() => {
    mockDao = new MockTaskDao();
    repo = new TaskRepository(mockDao as unknown as TaskDao);
  });

  test('creates a new task with pending syncStatus', async () => {
    const created = await repo.createTask({
      title: 'Buy groceries',
      description: 'Milk, Eggs, Bread',
      priority: Priority.HIGH,
      dueDateTime: Date.now() + 3600000,
      reminderEnabled: true,
      reminderLeadMinutes: 10,
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Buy groceries');
    expect(created.priority).toBe(Priority.HIGH);
    expect(created.isCompleted).toBe(false);
    expect(created.syncStatus).toBe(SyncStatus.PENDING);

    const retrieved = await repo.getTaskById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Buy groceries');
  });

  test('updates task details properly', async () => {
    const task = await repo.createTask({
      title: 'Original Title',
      priority: Priority.LOW,
    });

    await repo.updateTask({
      ...task,
      title: 'Updated Title',
      priority: Priority.MEDIUM,
    });

    const updated = await repo.getTaskById(task.id);
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.priority).toBe(Priority.MEDIUM);
  });

  test('toggles task completion and updates counts', async () => {
    const task = await repo.createTask({
      title: 'Workout',
      priority: Priority.HIGH,
    });

    let counts = await repo.getCounts();
    expect(counts.total).toBe(1);
    expect(counts.pending).toBe(1);
    expect(counts.completed).toBe(0);

    const result = await repo.toggleTaskCompletion(task);
    expect(result).toBe(true);

    counts = await repo.getCounts();
    expect(counts.total).toBe(1);
    expect(counts.pending).toBe(0);
    expect(counts.completed).toBe(1);
  });

  test('soft deletes task through tombstone and excludes from active list', async () => {
    const task = await repo.createTask({
      title: 'Temporary Task',
    });

    await repo.deleteTask(task.id);

    const retrieved = await repo.getTaskById(task.id);
    expect(retrieved).toBeNull();

    const counts = await repo.getCounts();
    expect(counts.total).toBe(0);
  });

  test('filters tasks by ALL, PENDING, COMPLETED, and OVERDUE', async () => {
    const now = Date.now();

    // Past incomplete -> Overdue & Pending
    await repo.createTask({
      title: 'Past Task',
      dueDateTime: now - 50000,
    });

    // Future incomplete -> Pending
    await repo.createTask({
      title: 'Future Task',
      dueDateTime: now + 50000,
    });

    // Completed task
    const comp = await repo.createTask({
      title: 'Completed Task',
    });
    await repo.toggleTaskCompletion(comp);

    const all = await repo.getTasks('ALL');
    expect(all.length).toBe(3);

    const pending = await repo.getTasks('PENDING');
    expect(pending.length).toBe(2);

    const completed = await repo.getTasks('COMPLETED');
    expect(completed.length).toBe(1);

    const overdue = await repo.getTasks('OVERDUE');
    expect(overdue.length).toBe(1);
    expect(overdue[0].title).toBe('Past Task');
  });

  test('searches tasks by title keyword', async () => {
    await repo.createTask({ title: 'Read Kotlin Book' });
    await repo.createTask({ title: 'Read React Native Book' });
    await repo.createTask({ title: 'Cook dinner' });

    const results = await repo.getTasks('ALL', 'DUE_DATE', 'ASC', 'React Native');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Read React Native Book');
  });
});
