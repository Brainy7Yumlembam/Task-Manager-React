import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { Cloud, CloudOff, Check, AlertCircle } from 'lucide-react-native';

interface SyncStatusBadgeProps {
  onPress?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ onPress }) => {
  const { syncState, unsyncedCount, user } = useTasks();
  const { theme, isDark } = useTheme();

  const getStatusDisplay = () => {
    switch (syncState) {
      case 'syncing':
        return {
          icon: <ActivityIndicator size="small" color={theme.primary} />,
          label: 'Syncing...',
          color: theme.primary,
          bg: theme.primaryLight,
        };
      case 'offline':
        return {
          icon: <CloudOff size={14} color="#F59E0B" />,
          label: unsyncedCount > 0 ? `Offline (${unsyncedCount})` : 'Offline',
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} color="#EF4444" />,
          label: 'Sync error',
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
        };
      case 'synced':
      case 'idle':
      default:
        if (!user) {
          return {
            icon: <Cloud size={14} color={theme.textSecondary} />,
            label: 'Local only',
            color: theme.textSecondary,
            bg: theme.surfaceSubtle,
          };
        }
        return {
          icon: <Check size={14} color="#10B981" strokeWidth={2.5} />,
          label: unsyncedCount > 0 ? `${unsyncedCount} pending` : 'Synced',
          color: '#10B981',
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.badge,
        {
          backgroundColor: status.bg,
          borderColor: isDark ? 'transparent' : theme.border,
        },
      ]}
    >
      {status.icon}
      <Text style={[styles.text, { color: status.color }]}>{status.label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
