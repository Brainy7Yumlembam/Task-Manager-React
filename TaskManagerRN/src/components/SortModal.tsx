import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SortBy, SortOrder } from '../models/filter';
import { useTheme } from '../theme/ThemeContext';
import { Check, ArrowDownUp } from 'lucide-react-native';

interface SortModalProps {
  visible: boolean;
  currentSortBy: SortBy;
  currentSortOrder: SortOrder;
  onApply: (by: SortBy, order: SortOrder) => void;
  onClose: () => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  currentSortBy,
  currentSortOrder,
  onApply,
  onClose,
}) => {
  const { theme } = useTheme();

  const options: { id: SortBy; label: string }[] = [
    { id: 'DUE_DATE', label: 'Due Date & Time' },
    { id: 'PRIORITY', label: 'Priority Level (High to Low)' },
    { id: 'CREATED_AT', label: 'Creation Date' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.header}>
                <ArrowDownUp size={20} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.title, { color: theme.text }]}>Sort Tasks</Text>
              </View>

              <View style={styles.list}>
                {options.map(option => {
                  const isSelected = currentSortBy === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        onApply(option.id, currentSortOrder);
                        onClose();
                      }}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? theme.primary : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && <Check size={18} color={theme.primary} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Order Toggle */}
              <View style={[styles.orderSection, { borderTopColor: theme.border }]}>
                <Text style={[styles.orderLabel, { color: theme.textSecondary }]}>Order:</Text>
                <View style={styles.orderButtons}>
                  <TouchableOpacity
                    onPress={() => onApply(currentSortBy, 'ASC')}
                    style={[
                      styles.orderBtn,
                      currentSortOrder === 'ASC'
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.surfaceSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderBtnText,
                        { color: currentSortOrder === 'ASC' ? '#FFF' : theme.textSecondary },
                      ]}
                    >
                      Ascending
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onApply(currentSortBy, 'DESC')}
                    style={[
                      styles.orderBtn,
                      currentSortOrder === 'DESC'
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.surfaceSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderBtnText,
                        { color: currentSortOrder === 'DESC' ? '#FFF' : theme.textSecondary },
                      ]}
                    >
                      Descending
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.surfaceSubtle }]}
              >
                <Text style={[styles.closeBtnText, { color: theme.text }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 14,
  },
  orderSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  orderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
