import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FilterType } from '../models/filter';
import { useTheme } from '../theme/ThemeContext';
import { CheckCircle2, Clock, AlertCircle, Inbox } from 'lucide-react-native';

interface EmptyStateProps {
  filterType: FilterType;
  isSearching?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ filterType, isSearching = false }) => {
  const { theme, isDark } = useTheme();

  if (isSearching) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' },
          ]}
        >
          <Inbox size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>No matching tasks</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          Try searching with different keywords.
        </Text>
      </View>
    );
  }

  const config = {
    ALL: {
      icon: <Inbox size={34} color={theme.primary} />,
      title: 'No tasks yet',
      message: 'Tap the + button below to add your first task.',
      bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
    },
    PENDING: {
      icon: <Clock size={34} color="#F59E0B" />,
      title: 'No pending tasks',
      message: "You're all caught up! Great job.",
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
    },
    COMPLETED: {
      icon: <CheckCircle2 size={34} color="#10B981" />,
      title: 'No completed tasks',
      message: 'Tasks marked as finished will appear here.',
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    },
    OVERDUE: {
      icon: <AlertCircle size={34} color="#10B981" />,
      title: 'No overdue tasks',
      message: 'Awesome! All your deadlines are on track.',
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    },
  }[filterType];

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>{config.icon}</View>
      <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{config.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
});
