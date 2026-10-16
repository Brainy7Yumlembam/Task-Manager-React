import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { DashboardCounter } from '../components/DashboardCounter';
import { FilterBar } from '../components/FilterBar';
import { SearchBar } from '../components/SearchBar';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import { SortModal } from '../components/SortModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { getGreeting, getTodayHeaderDate } from '../utils/dateUtils';
import { Task } from '../models/task';
import { Plus, ArrowDownUp, Settings, SlidersHorizontal } from 'lucide-react-native';

export const DashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const {
    tasks,
    counts,
    filterType,
    sortBy,
    sortOrder,
    searchQuery,
    isLoading,
    setFilterType,
    setSort,
    setSearchQuery,
    toggleTask,
    deleteTask,
    refresh,
  } = useTasks();

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleEditTask = (task: Task) => {
    navigation.navigate('AddEditTask', { taskId: task.id });
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const renderHeader = () => (
    <View>
      {/* Top Greeting & Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.todayDate, { color: theme.text }]}>{getTodayHeaderDate()}</Text>
        </View>

        <View style={styles.headerRight}>
          <SyncStatusBadge onPress={() => navigation.navigate('Settings')} />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Settings')}
            style={[styles.settingsBtn, { backgroundColor: theme.surfaceSubtle }]}
          >
            <Settings size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard Summary Counter Cards */}
      <DashboardCounter
        total={counts.total}
        pending={counts.pending}
        completed={counts.completed}
        overdue={counts.overdue}
        activeFilter={filterType}
        onSelectFilter={setFilterType}
      />

      {/* Search Input */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Filter Chips Bar & Sort Toggle */}
      <View style={styles.controlsRow}>
        <View style={{ flex: 1 }}>
          <FilterBar activeFilter={filterType} counts={counts} onSelectFilter={setFilterType} />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSortModalVisible(true)}
          style={[styles.sortButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ArrowDownUp size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={toggleTask}
            onPress={handleTaskPress}
            onEdit={handleEditTask}
            onDelete={task => setTaskToDelete(task)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState filterType={filterType} isSearching={searchQuery.length > 0} />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />

      {/* Floating Action Button to Add Task */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddEditTask')}
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Sort Selection Modal */}
      <SortModal
        visible={sortModalVisible}
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onApply={(by, order) => setSort(by, order)}
        onClose={() => setSortModalVisible(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={taskToDelete !== null}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayDate: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
