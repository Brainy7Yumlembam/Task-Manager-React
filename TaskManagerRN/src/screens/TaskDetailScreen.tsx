import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatToUiDateTime, isOverdue } from '../utils/dateUtils';
import { Task } from '../models/task';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Cloud,
} from 'lucide-react-native';

export const TaskDetailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { tasks, toggleTask, deleteTask } = useTasks();

  const taskId: string = route.params?.taskId;
  const [task, setTask] = useState<Task | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    const current = tasks.find(t => t.id === taskId);
    if (current) {
      setTask(current);
    }
  }, [tasks, taskId]);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerWrap}>
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>Task not found</Text>
        </View>
      </View>
    );
  }

  const overdue = isOverdue(task.dueDateTime, task.isCompleted);

  const handleToggle = async () => {
    await toggleTask(task);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    setConfirmDeleteVisible(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top, 16),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Task Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddEditTask', { taskId: task.id })}
            style={styles.actionBtn}
          >
            <Edit3 size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setConfirmDeleteVisible(true)}
            style={styles.actionBtn}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Completion status bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggle}
          style={[
            styles.statusBar,
            {
              backgroundColor: task.isCompleted
                ? isDark
                  ? 'rgba(16, 185, 129, 0.15)'
                  : '#ECFDF5'
                : theme.surfaceSubtle,
              borderColor: task.isCompleted ? '#10B981' : theme.border,
            },
          ]}
        >
          {task.isCompleted ? (
            <CheckCircle2 size={22} color="#10B981" />
          ) : (
            <Circle size={22} color={theme.textSecondary} />
          )}
          <Text
            style={[
              styles.statusText,
              { color: task.isCompleted ? '#10B981' : theme.textSecondary },
            ]}
          >
            {task.isCompleted ? 'Marked as Completed' : 'Pending (Tap to mark completed)'}
          </Text>
        </TouchableOpacity>

        {/* Title & Priority */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: theme.text },
                task.isCompleted && styles.completedTitle,
              ]}
            >
              {task.title}
            </Text>
            <PriorityBadge priority={task.priority} size="medium" />
          </View>

          {task.description ? (
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {task.description}
            </Text>
          ) : (
            <Text style={[styles.noDesc, { color: theme.textMuted }]}>
              No description provided.
            </Text>
          )}
        </View>

        {/* Scheduling Details */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            SCHEDULE & REMINDERS
          </Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelWrap}>
              <Calendar size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: theme.text }]}>Due Date & Time</Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                { color: overdue ? '#EF4444' : theme.text },
                overdue && { fontWeight: '700' },
              ]}
            >
              {task.dueDateTime ? formatToUiDateTime(task.dueDateTime) : 'Not scheduled'}
              {overdue ? ' (Overdue)' : ''}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.detailRow}>
            <View style={styles.detailLabelWrap}>
              <Bell size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: theme.text }]}>Reminder</Text>
            </View>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {task.reminderEnabled && task.dueDateTime
                ? `${task.reminderLeadMinutes} minutes before due time`
                : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Sync & Timestamps */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            METADATA & SYNC
          </Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLabelWrap}>
              <Cloud size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailLabel, { color: theme.text }]}>Sync Status</Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    task.syncStatus === 'synced'
                      ? '#10B981'
                      : task.syncStatus === 'failed'
                      ? '#EF4444'
                      : '#F59E0B',
                  textTransform: 'capitalize',
                  fontWeight: '600',
                },
              ]}
            >
              {task.syncStatus}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.timestampLabel, { color: theme.textSecondary }]}>Created</Text>
            <Text style={[styles.timestampValue, { color: theme.textMuted }]}>
              {formatToUiDateTime(task.createdAt)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.timestampLabel, { color: theme.textSecondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.timestampValue, { color: theme.textMuted }]}>
              {formatToUiDateTime(task.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  noDesc: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  timestampLabel: {
    fontSize: 13,
  },
  timestampValue: {
    fontSize: 13,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
});
