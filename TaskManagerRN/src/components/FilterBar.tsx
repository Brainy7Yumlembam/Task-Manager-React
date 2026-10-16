import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FilterType } from '../models/filter';
import { TaskCounts } from '../models/task';
import { useTheme } from '../theme/ThemeContext';

interface FilterBarProps {
  activeFilter: FilterType;
  counts: TaskCounts;
  onSelectFilter: (filter: FilterType) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  counts,
  onSelectFilter,
}) => {
  const { theme } = useTheme();

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: counts.total },
    { key: 'PENDING', label: 'Pending', count: counts.pending },
    { key: 'COMPLETED', label: 'Completed', count: counts.completed },
    { key: 'OVERDUE', label: 'Overdue', count: counts.overdue },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map(item => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => onSelectFilter(item.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? theme.chipActiveBg : theme.chipInactiveBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.chipActiveText : theme.chipInactiveText,
                  },
                ]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isActive ? '#FFFFFF' : theme.textSecondary,
                    },
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
