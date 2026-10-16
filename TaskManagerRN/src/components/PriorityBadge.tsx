import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Priority } from '../models/task';
import { priorityColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'small' | 'medium';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'small' }) => {
  const { isDark } = useTheme();
  const config = priorityColors[priority] || priorityColors.MEDIUM;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? config.darkBg : config.bg,
          borderColor: config.border,
        },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.text,
          { color: config.color },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
      >
        {priority}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
});
