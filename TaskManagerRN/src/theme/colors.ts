export const priorityColors = {
  HIGH: {
    color: '#EF4444',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    darkBg: 'rgba(239, 68, 68, 0.15)',
  },
  MEDIUM: {
    color: '#F59E0B',
    bg: '#FEF3C7',
    border: '#FCD34D',
    darkBg: 'rgba(245, 158, 11, 0.15)',
  },
  LOW: {
    color: '#10B981',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    darkBg: 'rgba(16, 185, 129, 0.15)',
  },
};

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  divider: string;
  shadow: string;
  chipActiveBg: string;
  chipActiveText: string;
  chipInactiveBg: string;
  chipInactiveText: string;
}

export const lightTheme: ThemeColors = {
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#EEF2FF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  divider: '#E2E8F0',
  shadow: '#000000',
  chipActiveBg: '#6366F1',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#E2E8F0',
  chipInactiveText: '#475569',
};

export const darkTheme: ThemeColors = {
  primary: '#818CF8', // Light Indigo for dark mode
  primaryDark: '#6366F1',
  primaryLight: 'rgba(99, 102, 241, 0.2)',
  background: '#0B0F19',
  surface: '#1E293B',
  surfaceSubtle: '#151D2C',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#1E293B',
  error: '#F87171',
  errorBg: 'rgba(239, 68, 68, 0.2)',
  success: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.2)',
  warning: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.2)',
  info: '#60A5FA',
  infoBg: 'rgba(59, 130, 246, 0.2)',
  divider: '#334155',
  shadow: '#000000',
  chipActiveBg: '#818CF8',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#334155',
  chipInactiveText: '#94A3B8',
};
