# TaskManagerRN (React Native + SQLite + Firebase)

Production-minded, offline-first **Task Management Android App** built with React Native and TypeScript, featuring persistent local SQLite storage, Firebase Cloud Firestore synchronization, real Android local notifications, and a modern UI inspired by Todoist and TickTick.

---

## 📱 Features

- **Full Task Lifecycle:** Create, read, update, complete, and delete tasks.
- **Offline-First Persistence:** Instant local operations powered by `@op-engineering/op-sqlite` (JSI C++ engine with WAL mode).
- **Cloud Synchronization:** Two-way synchronization with Firebase Cloud Firestore scoped to authenticated users (`users/{userId}/tasks/{taskId}`).
- **Deterministic Conflict Resolution:** Last-write-wins based on high-resolution `updatedAt` timestamps. Soft deletion with tombstones ensures deletions never resurrect.
- **Local Reminders:** Real Android notifications via `@notifee/react-native` with exact alarm scheduling, lead-time offsets (5m, 10m, 30m, 1h), and automatic cancellation on task completion.
- **Dashboard & Analytics:** Live summary counters for Total, Pending, Completed, and Overdue tasks.
- **Filters & Search:** Quick-filter tabs with dynamic count badges, full-text title search, and sorting (Due Date, Priority, Creation Date).
- **Modern Premium Design:** Minimalist indigo/violet aesthetic, dark/light theme support, priority indicators, and responsive card components.

---

## 🏛️ Architecture & Separation of Concerns

```
TaskManagerRN/
├── android/                             # Android native configuration
│   ├── app/
│   │   ├── google-services.json         # Firebase Android config
│   │   └── build.gradle
│   └── build.gradle
├── firestore.rules                      # Production Firestore security rules
├── src/
│   ├── models/
│   │   ├── task.ts                      # Task, Priority, and SyncStatus models
│   │   └── filter.ts                    # Filter & Sort option models
│   ├── database/
│   │   └── database.ts                  # SQLite initialization, schema, and WAL mode
│   ├── dao/
│   │   └── TaskDao.ts                   # SQLite queries, indexes, and row mappers
│   ├── repositories/
│   │   └── TaskRepository.ts            # Single source of truth bridging SQLite & Cloud
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── firebaseAuth.ts          # Authentication (Anonymous + Email/Password)
│   │   │   └── firestoreService.ts      # Cloud Firestore operations
│   │   ├── sync/
│   │   │   └── SyncService.ts           # Offline-first sync with retry and conflict policy
│   │   ├── notifications/
│   │   │   └── NotificationService.ts   # Notifee notification channel & exact alarms
│   │   └── connectivity/
│   │       └── NetworkService.ts        # NetInfo online/offline listener
│   ├── theme/
│   │   ├── colors.ts                    # Light/Dark palettes & priority accents
│   │   └── ThemeContext.tsx             # Dynamic theme provider & hook
│   ├── context/
│   │   └── TaskContext.tsx              # Reactive state provider (ViewModel layer)
│   ├── components/
│   │   ├── TaskCard.tsx                 # Task item with priority stripe & quick actions
│   │   ├── DashboardCounter.tsx         # Summary metric cards (Total/Pending/Done/Overdue)
│   │   ├── PriorityBadge.tsx            # Colored priority chip
│   │   ├── FilterBar.tsx                # Filter tabs with live counters
│   │   ├── SearchBar.tsx                # Real-time search input
│   │   ├── SortModal.tsx                # Sort dialog (Due Date, Priority, Created)
│   │   ├── ConfirmDialog.tsx            # Delete confirmation modal
│   │   ├── EmptyState.tsx               # Status-specific empty illustrations
│   │   └── SyncStatusBadge.tsx          # Real-time sync & online status pill
│   ├── screens/
│   │   ├── DashboardScreen.tsx          # Main dashboard, greeting, summary, and task list
│   │   ├── AddEditTaskScreen.tsx        # Add / Edit form with date/time pickers
│   │   ├── TaskDetailScreen.tsx         # Task overview, status toggle, and metadata
│   │   └── SettingsScreen.tsx           # Auth, theme, sync status, and database info
│   ├── navigation/
│   │   └── AppNavigator.tsx             # Native Stack Navigator
│   └── utils/
│       ├── dateUtils.ts                 # Date/time formatting & overdue calculations
│       └── idUtils.ts                   # Stable UUID v4 generator
└── __tests__/                           # Automated Jest test suites
    ├── taskRepository.test.ts           # CRUD & filter tests
    ├── syncConflict.test.ts             # Conflict resolution & tombstone tests
    ├── dateUtils.test.ts                # Date formatting tests
    └── App.test.tsx                     # Component rendering smoke test
```

---

## 🗄️ SQLite Database Schema

```sql
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

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(userId);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(isCompleted);
CREATE INDEX IF NOT EXISTS idx_tasks_due_datetime ON tasks(dueDateTime);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deletedAt);
CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(syncStatus);
```

---

## 🔄 Synchronization & Conflict Resolution Policy

1. **Immediate Local Write:** When a user creates, edits, completes, or deletes a task, changes are committed to the local SQLite database instantly with `syncStatus = 'pending'`. The UI never waits for the network.
2. **Network Detection:** `NetworkService` listens for connectivity changes. As soon as the device reconnects, `SyncService` is triggered automatically.
3. **Bounded Retries:** If Firestore returns a transient network error, `SyncService` retries up to 3 times using exponential backoff (1s, 2s, 4s).
4. **Deterministic Conflict Resolution (Last-Write-Wins):**
   - Each task has an `updatedAt` millisecond timestamp.
   - If local changes exist with an `updatedAt` strictly newer than the incoming remote record, the local state is preserved and scheduled for upload.
   - Otherwise, the remote record updates SQLite.
5. **Tombstone Deletions:** Deleting a task sets `deletedAt = Date.now()`. When syncing, the deletion tombstone is sent to Firestore (`users/{userId}/tasks/{taskId}`) before the row is purged locally, ensuring other synced devices do not re-create deleted tasks.
6. **Scoped Access:** Tasks are stored in subcollections partitioned by user UID: `users/{userId}/tasks/{taskId}`.

---

## 🔒 Firebase Setup & Security Rules

### 1. Add `google-services.json`
Download `google-services.json` from the Firebase Console for package `com.brainy.taskmanager` and place it in:
```
TaskManagerRN/android/app/google-services.json
```

### 2. Enable Firebase Services
- Go to the **Firebase Console**.
- **Authentication:** Enable **Anonymous** and **Email/Password** sign-in providers.
- **Cloud Firestore:** Create a database in Production mode.

### 3. Deploy Firestore Security Rules
Deploy `firestore.rules` using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

Rules enforce strict per-user authorization:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /tasks/{taskId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## ⏰ Notifications & Reminders Setup

- Uses `@notifee/react-native` configured for Android.
- Channel created: `task_reminders` with `IMPORTANCE_HIGH`.
- Requires `POST_NOTIFICATIONS` permission on Android 13+ (API 33+), requested on app launch.
- Exact alarms configured via `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` with automatic fallback to inexact alarms if exact scheduling is restricted by Android battery saver policies.
- Automatically reschedules pending reminders on device reboot or app launch.

---

## 🚀 Building & Running the App

### Prerequisites
- Node.js >= 22 (tested with v24.14.0)
- Java OpenJDK 21
- Android SDK (API 34-36) and Build-Tools (36.0.0)

### Run Unit & Integration Tests
```bash
cd TaskManagerRN
npm test
```
All 19 tests across 4 test suites verify CRUD, offline queuing, conflict resolution, and date formatting.

### Type Check
```bash
npx tsc --noEmit
```

### Run on Android Emulator / Connected Device
```bash
npx react-native run-android
```

### Build Debug APK
```bash
cd android
.\gradlew.bat assembleDebug
```
The compiled APK will be output at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎨 Theme & UI Customization

The app features a custom theme context supporting:
- **Light Mode:** Crisp off-white backgrounds (`#F8FAFC`), indigo primary accents (`#6366F1`), and card elevations.
- **Dark Mode:** Deep slate backgrounds (`#0B0F19`), surface cards (`#1E293B`), and high-contrast text.
- **System Default:** Automatically tracks Android system dark mode.
