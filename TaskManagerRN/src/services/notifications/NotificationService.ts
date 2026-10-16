import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  AlarmType,
  AndroidNotificationSetting,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { Task } from '../../models/task';
import { formatToUiDateTime } from '../../utils/dateUtils';

const CHANNEL_ID = 'task_reminders';
const CHANNEL_NAME = 'Task Reminders';
const CHANNEL_DESCRIPTION = 'Notifications for upcoming task deadlines';

/**
 * Generates a stable positive 32-bit integer ID from task UUID string.
 */
function getNotificationId(taskId: string): string {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = (hash << 5) - hash + taskId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString();
}

class NotificationService {
  private isChannelCreated = false;

  /**
   * Initializes notification channel and permissions on Android.
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      if (!this.isChannelCreated) {
        await notifee.createChannel({
          id: CHANNEL_ID,
          name: CHANNEL_NAME,
          description: CHANNEL_DESCRIPTION,
          importance: AndroidImportance.HIGH,
          vibration: true,
          lights: true,
        });
        this.isChannelCreated = true;
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to create notification channel:', error);
    }
  }

  /**
   * Requests Android 13+ notification permission.
   */
  async requestPermission(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= 1;
    } catch (error) {
      console.warn('[NotificationService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Schedules a local notification reminder for a task.
   * Matches the Kotlin TaskReminderScheduler behavior:
   * - Trigger at: task.dueDateTime - (task.reminderLeadMinutes * 60 * 1000)
   * - Skip if disabled, completed, dueDateTime is null, or trigger time <= now
   */
  async scheduleReminder(task: Task): Promise<boolean> {
    const notificationId = getNotificationId(task.id);

    // Cancel any existing reminder first
    await this.cancelReminder(task.id);

    if (!task.reminderEnabled || task.isCompleted || !task.dueDateTime) {
      return false;
    }

    const leadMillis = (task.reminderLeadMinutes || 10) * 60 * 1000;
    const triggerTime = task.dueDateTime - leadMillis;
    const now = Date.now();

    if (triggerTime <= now) {
      console.log(`[NotificationService] Reminder trigger for "${task.title}" is in the past. Skipping.`);
      return false;
    }

    try {
      await this.initialize();

      const contentLines: string[] = [];
      if (task.description && task.description.trim().length > 0) {
        contentLines.push(task.description.trim());
      }
      contentLines.push(`Due: ${formatToUiDateTime(task.dueDateTime)}`);
      const body = contentLines.join(' • ');

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title: `⏰ ${task.title}`,
          body: body || 'You have an upcoming task!',
          data: { taskId: task.id },
          android: {
            channelId: CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
            showTimestamp: true,
          },
        },
        trigger
      );

      console.log(`[NotificationService] Scheduled reminder for "${task.title}" at ${new Date(triggerTime).toLocaleTimeString()}`);
      return true;
    } catch (error) {
      console.warn(`[NotificationService] Error scheduling reminder for "${task.title}":`, error);
      // Fallback: try inexact trigger if exact alarm permission is restricted
      try {
        const fallbackTrigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime,
          alarmManager: {
            type: AlarmType.SET_AND_ALLOW_WHILE_IDLE,
          },
        };

        await notifee.createTriggerNotification(
          {
            id: notificationId,
            title: `⏰ ${task.title}`,
            body: task.description || `Due: ${formatToUiDateTime(task.dueDateTime)}`,
            data: { taskId: task.id },
            android: {
              channelId: CHANNEL_ID,
              importance: AndroidImportance.HIGH,
            },
          },
          fallbackTrigger
        );
        return true;
      } catch (fallbackErr) {
        console.error('[NotificationService] Fallback reminder failed:', fallbackErr);
        return false;
      }
    }
  }

  /**
   * Cancels scheduled reminder for a specific task.
   */
  async cancelReminder(taskId: string): Promise<void> {
    try {
      const notificationId = getNotificationId(taskId);
      await notifee.cancelNotification(notificationId);
      await notifee.cancelTriggerNotification(notificationId);
    } catch (error) {
      console.warn(`[NotificationService] Error canceling reminder for ${taskId}:`, error);
    }
  }

  /**
   * Cancels all scheduled task notifications.
   */
  async cancelAll(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.warn('[NotificationService] Error canceling all notifications:', error);
    }
  }

  /**
   * Restores reminders for active upcoming tasks (e.g. after reboot or app relaunch).
   */
  async restoreReminders(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      if (task.reminderEnabled && !task.isCompleted && task.dueDateTime) {
        await this.scheduleReminder(task);
      }
    }
  }
}

export const notificationService = new NotificationService();
