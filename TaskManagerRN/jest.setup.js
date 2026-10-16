import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('task_reminders'),
    createTriggerNotification: jest.fn().mockResolvedValue('1'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
  },
  AndroidImportance: { HIGH: 4 },
  TriggerType: { TIMESTAMP: 0 },
  AlarmType: { SET_EXACT_AND_ALLOW_WHILE_IDLE: 0, SET_AND_ALLOW_WHILE_IDLE: 2 },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    addEventListener: jest.fn().mockReturnValue(jest.fn()),
  },
}));

// Mock OP-SQLite
jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn().mockReturnValue({
    execute: jest.fn().mockReturnValue({ rows: { length: 0, item: () => null } }),
    executeAsync: jest.fn().mockResolvedValue({ rows: { length: 0, item: () => null } }),
    transaction: jest.fn().mockImplementation(async (cb) => {
      await cb({
        execute: jest.fn(),
        executeAsync: jest.fn().mockResolvedValue({ rows: { length: 0, item: () => null } }),
      });
    }),
    close: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
  const authInstance = {
    currentUser: { uid: 'test-user-id', email: 'test@example.com', isAnonymous: false },
    onAuthStateChanged: jest.fn((cb) => {
      cb({ uid: 'test-user-id', email: 'test@example.com', isAnonymous: false });
      return jest.fn();
    }),
    signInAnonymously: jest.fn().mockResolvedValue({ user: { uid: 'anon-uid', isAnonymous: true } }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'email-uid', email: 'test@example.com' } }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'new-uid', email: 'test@example.com' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
  return () => authInstance;
});

// Mock Firebase Firestore
jest.mock('@react-native-firebase/firestore', () => {
  const docMock = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => docMock),
      get: jest.fn().mockResolvedValue({ forEach: jest.fn() }),
      onSnapshot: jest.fn(() => jest.fn()),
    })),
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const collectionMock = {
    doc: jest.fn(() => docMock),
    get: jest.fn().mockResolvedValue({ forEach: jest.fn() }),
    onSnapshot: jest.fn(() => jest.fn()),
  };

  const firestoreInstance = {
    collection: jest.fn(() => collectionMock),
  };

  return () => firestoreInstance;
});

// Mock Safe Area Context with official mock
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
