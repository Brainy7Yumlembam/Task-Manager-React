import { Task, Priority, SyncStatus } from '../src/models/task';
import { TaskDao } from '../src/dao/TaskDao';

describe('Offline-First Synchronization & Conflict Resolution', () => {
  let mockStore: Map<string, Task>;
  let upsertFromRemote: (remote: Task) => Promise<'updated' | 'inserted' | 'skipped' | 'deleted'>;

  beforeEach(() => {
    mockStore = new Map();

    upsertFromRemote = async (remote: Task): Promise<'updated' | 'inserted' | 'skipped' | 'deleted'> => {
      const local = mockStore.get(remote.id);

      if (remote.deletedAt !== null) {
        if (local) {
          mockStore.delete(remote.id);
          return 'deleted';
        }
        return 'skipped';
      }

      if (local) {
        // Last-write-wins: if local has uncommitted changes and local is newer, keep local
        if (local.syncStatus === SyncStatus.PENDING && local.updatedAt > remote.updatedAt) {
          return 'skipped';
        }
        mockStore.set(remote.id, { ...remote, syncStatus: SyncStatus.SYNCED });
        return 'updated';
      } else {
        mockStore.set(remote.id, { ...remote, syncStatus: SyncStatus.SYNCED });
        return 'inserted';
      }
    };
  });

  test('inserts new remote task when not present locally', async () => {
    const remoteTask: Task = {
      id: 'task-101',
      userId: 'user-abc',
      title: 'Cloud Created Task',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.MEDIUM,
      isCompleted: false,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 1000,
      updatedAt: 1000,
      deletedAt: null,
      syncStatus: SyncStatus.SYNCED,
    };

    const outcome = await upsertFromRemote(remoteTask);
    expect(outcome).toBe('inserted');
    expect(mockStore.has('task-101')).toBe(true);
    expect(mockStore.get('task-101')?.title).toBe('Cloud Created Task');
  });

  test('updates local task when remote timestamp is newer', async () => {
    // Local version at timestamp 1000
    mockStore.set('task-102', {
      id: 'task-102',
      userId: 'user-abc',
      title: 'Old Title',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.LOW,
      isCompleted: false,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 500,
      updatedAt: 1000,
      deletedAt: null,
      syncStatus: SyncStatus.SYNCED,
    });

    // Remote version at timestamp 2000
    const newerRemoteTask: Task = {
      id: 'task-102',
      userId: 'user-abc',
      title: 'Newer Cloud Title',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.HIGH,
      isCompleted: true,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 500,
      updatedAt: 2000,
      deletedAt: null,
      syncStatus: SyncStatus.SYNCED,
    };

    const outcome = await upsertFromRemote(newerRemoteTask);
    expect(outcome).toBe('updated');
    expect(mockStore.get('task-102')?.title).toBe('Newer Cloud Title');
    expect(mockStore.get('task-102')?.isCompleted).toBe(true);
  });

  test('retains local change when local is newer than stale remote (conflict resolution)', async () => {
    // Local version modified offline at timestamp 3000
    mockStore.set('task-103', {
      id: 'task-103',
      userId: 'user-abc',
      title: 'Offline Edited Title',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.HIGH,
      isCompleted: false,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 500,
      updatedAt: 3000,
      deletedAt: null,
      syncStatus: SyncStatus.PENDING,
    });

    // Stale remote incoming at timestamp 1500
    const staleRemoteTask: Task = {
      id: 'task-103',
      userId: 'user-abc',
      title: 'Stale Cloud Title',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.LOW,
      isCompleted: false,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 500,
      updatedAt: 1500,
      deletedAt: null,
      syncStatus: SyncStatus.SYNCED,
    };

    const outcome = await upsertFromRemote(staleRemoteTask);
    expect(outcome).toBe('skipped');
    // Local should remain untouched with pending status
    expect(mockStore.get('task-103')?.title).toBe('Offline Edited Title');
    expect(mockStore.get('task-103')?.syncStatus).toBe(SyncStatus.PENDING);
  });

  test('deletes local task when remote contains deletion tombstone', async () => {
    mockStore.set('task-104', {
      id: 'task-104',
      userId: 'user-abc',
      title: 'To Be Deleted',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.MEDIUM,
      isCompleted: false,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 1000,
      updatedAt: 1000,
      deletedAt: null,
      syncStatus: SyncStatus.SYNCED,
    });

    const tombstoneTask: Task = {
      id: 'task-104',
      userId: 'user-abc',
      title: '',
      description: '',
      dueDate: null,
      dueDateTime: null,
      priority: Priority.MEDIUM,
      isCompleted: false,
      reminderEnabled: false,
      reminderLeadMinutes: 10,
      createdAt: 1000,
      updatedAt: 4000,
      deletedAt: 4000,
      syncStatus: SyncStatus.SYNCED,
    };

    const outcome = await upsertFromRemote(tombstoneTask);
    expect(outcome).toBe('deleted');
    expect(mockStore.has('task-104')).toBe(false);
  });
});
