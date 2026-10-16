import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AlertTriangle } from 'lucide-react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialog,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
                ]}
              >
                <AlertTriangle size={24} color="#EF4444" />
              </View>

              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onCancel}
                  style={[styles.btn, styles.cancelBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.cancelText, { color: theme.text }]}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onConfirm}
                  style={[
                    styles.btn,
                    styles.confirmBtn,
                    { backgroundColor: isDestructive ? '#EF4444' : theme.primary },
                  ]}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    elevation: 2,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
