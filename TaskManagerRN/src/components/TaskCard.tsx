import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../models/task';
import { useTheme } from '../theme/ThemeContext';
import { PriorityBadge } from './PriorityBadge';
import { formatToUiDateTime, isOverdue } from '../utils/dateUtils';
import { priorityColors } from '../theme/colors';
import { Check, Calendar, Bell, Trash2, Edit3 } from 'lucide-react-native';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onPress: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { theme, isDark } = useTheme();
  const overdue = isOverdue(task.dueDateTime, task.isCompleted);
  const pConfig = priorityColors[task.priority] || priorityColors.MEDIUM;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(task)}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderLeftColor: pConfig.color,
        },
      ]}
    >
      <View style={styles.mainRow}>
        {/* Completion Checkbox */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleComplete(task)}
          style={[
            styles.checkbox,
            task.isCompleted
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { borderColor: theme.borderLight === '#F1F5F9' ? '#CBD5E1' : '#475569' },
          ]}
        >
          {task.isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.contentWrap}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: task.isCompleted ? theme.textMuted : theme.text },
              task.isCompleted && styles.completedText,
            ]}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              numberOfLines={2}
              style={[
                styles.description,
                { color: task.isCompleted ? theme.textMuted : theme.textSecondary },
                task.isCompleted && styles.completedText,
              ]}
            >
              {task.description}
            </Text>
          ) : null}

          {/* Badges & Metadata */}
          <View style={styles.metadataRow}>
            {task.dueDateTime ? (
              <View
                style={[
                  styles.datePill,
                  overdue
                    ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }
                    : { backgroundColor: theme.surfaceSubtle },
                ]}
              >
                <Calendar
                  size={12}
                  color={overdue ? '#EF4444' : theme.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: overdue ? '#EF4444' : theme.textSecondary },
                    overdue && { fontWeight: '700' },
                  ]}
                >
                  {formatToUiDateTime(task.dueDateTime)}
                  {overdue ? ' (Overdue)' : ''}
                </Text>
              </View>
            ) : null}

            {task.reminderEnabled && (
              <View style={[styles.reminderPill, { backgroundColor: theme.surfaceSubtle }]}>
                <Bell size={12} color={theme.primary} style={{ marginRight: 3 }} />
                <Text style={[styles.reminderText, { color: theme.primary }]}>
                  {task.reminderLeadMinutes}m
                </Text>
              </View>
            )}

            <PriorityBadge priority={task.priority} size="small" />
          </View>
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onEdit(task)}
            style={styles.actionBtn}
          >
            <Edit3 size={17} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onDelete(task)}
            style={styles.actionBtn}
          >
            <Trash2 size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4.5,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.75,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  reminderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsWrap: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
    gap: 12,
  },
  actionBtn: {
    padding: 2,
  },
});
