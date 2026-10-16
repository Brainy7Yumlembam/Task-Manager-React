import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FilterType } from '../models/filter';
import { CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react-native';

interface DashboardCounterProps {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
}

export const DashboardCounter: React.FC<DashboardCounterProps> = ({
  total,
  pending,
  completed,
  overdue,
  activeFilter,
  onSelectFilter,
}) => {
  const { theme, isDark } = useTheme();

  const cards = [
    {
      type: 'ALL' as FilterType,
      title: 'Total',
      count: total,
      icon: <Layers size={18} color="#6366F1" />,
      accentColor: '#6366F1',
      bgLight: '#EEF2FF',
      bgDark: 'rgba(99, 102, 241, 0.15)',
    },
    {
      type: 'PENDING' as FilterType,
      title: 'Pending',
      count: pending,
      icon: <Clock size={18} color="#F59E0B" />,
      accentColor: '#F59E0B',
      bgLight: '#FFFBEB',
      bgDark: 'rgba(245, 158, 11, 0.15)',
    },
    {
      type: 'COMPLETED' as FilterType,
      title: 'Completed',
      count: completed,
      icon: <CheckCircle2 size={18} color="#10B981" />,
      accentColor: '#10B981',
      bgLight: '#ECFDF5',
      bgDark: 'rgba(16, 185, 129, 0.15)',
    },
    {
      type: 'OVERDUE' as FilterType,
      title: 'Overdue',
      count: overdue,
      icon: <AlertCircle size={18} color="#EF4444" />,
      accentColor: '#EF4444',
      bgLight: '#FEF2F2',
      bgDark: 'rgba(239, 68, 68, 0.15)',
    },
  ];

  return (
    <View style={styles.grid}>
      {cards.map(card => {
        const isSelected = activeFilter === card.type;
        return (
          <TouchableOpacity
            key={card.type}
            activeOpacity={0.8}
            onPress={() => onSelectFilter(card.type)}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: isSelected ? card.accentColor : theme.border,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDark ? card.bgDark : card.bgLight },
                ]}
              >
                {card.icon}
              </View>
              <Text style={[styles.title, { color: theme.textSecondary }]}>{card.title}</Text>
            </View>
            <Text style={[styles.count, { color: card.accentColor }]}>{card.count}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
