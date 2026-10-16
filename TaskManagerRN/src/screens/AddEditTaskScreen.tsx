import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { Priority, Task } from '../models/task';
import { taskRepository } from '../repositories/TaskRepository';
import { formatToUiDate, formatToUiTime, formatToDbDate } from '../utils/dateUtils';
import { priorityColors } from '../theme/colors';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bell,
  X,
  Check,
  AlertCircle,
} from 'lucide-react-native';

const REMINDER_OPTIONS = [
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
];

export const AddEditTaskScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { createTask, updateTask } = useTasks();

  const taskId: string | undefined = route.params?.taskId;
  const isEditMode = Boolean(taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(10);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [existingTask, setExistingTask] = useState<Task | null>(null);

  // Date/Time Picker Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isEditMode && taskId) {
      taskRepository.getTaskById(taskId).then(task => {
        if (task) {
          setExistingTask(task);
          setTitle(task.title);
          setDescription(task.description || '');
          setPriority(task.priority);
          setReminderEnabled(task.reminderEnabled);
          setReminderLeadMinutes(task.reminderLeadMinutes);

          if (task.dueDateTime) {
            const dt = new Date(task.dueDateTime);
            setSelectedDate(dt);
            setSelectedTime(dt);
          }
        }
      });
    }
  }, [isEditMode, taskId]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      // Default time to current time or next hour if not already selected
      if (!selectedTime) {
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1, 0, 0, 0);
        setSelectedTime(defaultTime);
      }
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && time) {
      setSelectedTime(time);
      if (!selectedDate) {
        setSelectedDate(new Date());
      }
    }
  };

  const handleClearDateTime = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setReminderEnabled(false);
  };

  const getCombinedDueDateTime = (): number | null => {
    if (!selectedDate) return null;
    const combined = new Date(selectedDate);
    if (selectedTime) {
      combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    } else {
      combined.setHours(12, 0, 0, 0);
    }
    return combined.getTime();
  };

  const handleToggleReminder = (enabled: boolean) => {
    if (enabled && !selectedDate) {
      Alert.alert(
        'Due Date Required',
        'Please set a due date and time before enabling reminders.'
      );
      return;
    }
    setReminderEnabled(enabled);
  };

  const checkReminderInPast = (): boolean => {
    if (!reminderEnabled) return false;
    const dueTime = getCombinedDueDateTime();
    if (!dueTime) return false;
    const reminderTrigger = dueTime - reminderLeadMinutes * 60 * 1000;
    return reminderTrigger <= Date.now();
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (!title.trim()) {
      setTitleError('Task title is required');
      return;
    }
    setTitleError(null);

    const dueDateTime = getCombinedDueDateTime();
    const dueDate = dueDateTime ? formatToDbDate(dueDateTime) : null;

    setIsSaving(true);
    try {
      if (isEditMode && existingTask) {
        await updateTask({
          ...existingTask,
          title: title.trim(),
          description: description.trim(),
          dueDate,
          dueDateTime,
          priority,
          reminderEnabled: Boolean(reminderEnabled && dueDateTime),
          reminderLeadMinutes,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim(),
          dueDate,
          dueDateTime,
          priority,
          reminderEnabled: Boolean(reminderEnabled && dueDateTime),
          reminderLeadMinutes,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save task.');
      setIsSaving(false);
    }
  };

  const priorities: Priority[] = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
  const isPastReminder = checkReminderInPast();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? undefined : 'padding'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Custom Header */}
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isEditMode ? 'Edit Task' : 'New Task'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={t => {
              setTitle(t);
              if (t.trim()) setTitleError(null);
            }}
            placeholder="What needs to be done?"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: titleError ? '#EF4444' : theme.border,
                color: theme.text,
              },
            ]}
          />
          {titleError && <Text style={styles.errorText}>{titleError}</Text>}
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Description (Optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add details or notes..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
        </View>

        {/* Priority Selector */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorities.map(p => {
              const isSelected = priority === p;
              const pConfig = priorityColors[p];
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.7}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? pConfig.darkBg
                          : pConfig.bg
                        : theme.surface,
                      borderColor: isSelected ? pConfig.color : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: pConfig.color }]} />
                  <Text
                    style={[
                      styles.priorityBtnText,
                      {
                        color: isSelected ? pConfig.color : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Due Date & Time Picker */}
        <View style={styles.inputGroup}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Due Date & Time</Text>
            {selectedDate && (
              <TouchableOpacity onPress={handleClearDateTime} style={styles.clearBtn}>
                <X size={14} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.pickersRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.pickerButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Calendar size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <Text
                style={[
                  styles.pickerButtonText,
                  { color: selectedDate ? theme.text : theme.textMuted },
                ]}
              >
                {selectedDate ? formatToUiDate(selectedDate.getTime()) : 'Pick Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowTimePicker(true)}
              style={[
                styles.pickerButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Clock size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <Text
                style={[
                  styles.pickerButtonText,
                  { color: selectedTime ? theme.text : theme.textMuted },
                ]}
              >
                {selectedTime ? formatToUiTime(selectedTime.getTime()) : 'Pick Time'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime || new Date()}
              mode="time"
              display="default"
              is24Hour={false}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Reminder Options */}
        <View
          style={[
            styles.cardSection,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.reminderHeader}>
            <View style={styles.rowAlign}>
              <Bell size={20} color={theme.primary} style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.reminderTitle, { color: theme.text }]}>Reminder</Text>
                <Text style={[styles.reminderSub, { color: theme.textSecondary }]}>
                  Notify before the task is due
                </Text>
              </View>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: theme.border, true: theme.primaryLight }}
              thumbColor={reminderEnabled ? theme.primary : '#F4F3F4'}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.reminderOptionsWrap}>
              <Text style={[styles.leadTimeLabel, { color: theme.textSecondary }]}>
                Remind me:
              </Text>
              <View style={styles.leadTimeGrid}>
                {REMINDER_OPTIONS.map(opt => {
                  const isLeadSelected = reminderLeadMinutes === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => setReminderLeadMinutes(opt.value)}
                      style={[
                        styles.leadTimeChip,
                        {
                          backgroundColor: isLeadSelected ? theme.primary : theme.surfaceSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.leadTimeText,
                          {
                            color: isLeadSelected ? '#FFFFFF' : theme.textSecondary,
                            fontWeight: isLeadSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isPastReminder && (
                <View
                  style={[
                    styles.warningBanner,
                    { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB' },
                  ]}
                >
                  <AlertCircle size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text style={styles.warningText}>
                    The calculated reminder time is already in the past.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 90,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityBtnText: {
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  reminderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  reminderOptionsWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  leadTimeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  leadTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leadTimeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  leadTimeText: {
    fontSize: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  warningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
