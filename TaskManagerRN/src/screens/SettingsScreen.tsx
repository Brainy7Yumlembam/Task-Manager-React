import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import {
  ArrowLeft,
  User,
  Cloud,
  Moon,
  Sun,
  Database,
  RefreshCw,
  LogOut,
  LogIn,
  CheckCircle,
  AlertCircle,
  Bell,
  Upload,
  Download,
} from 'lucide-react-native';

export const SettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme, currentMode, setScheme } = useTheme();
  const {
    user,
    counts,
    syncState,
    unsyncedCount,
    triggerSync,
    uploadToCloud,
    downloadFromCloud,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  } = useTasks();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    try {
      await triggerSync();
      Alert.alert('Sync Completed', 'Tasks synchronized successfully with Cloud Firestore.');
    } catch (err: any) {
      Alert.alert('Sync Notice', err?.message || 'Synchronization could not complete right now.');
    } finally {
      setIsSyncingManual(false);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in with your email or as guest before uploading tasks.');
      return;
    }
    setIsUploading(true);
    try {
      const count = await uploadToCloud();
      Alert.alert(
        'Upload Successful',
        `Successfully uploaded ${count} task${count === 1 ? '' : 's'} to Cloud Firestore. All your tasks are now backed up in the cloud!`
      );
    } catch (err: any) {
      Alert.alert('Upload Notice', err?.message || 'Could not upload tasks to Firebase right now.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in with your email or as guest before downloading tasks.');
      return;
    }
    setIsDownloading(true);
    try {
      const count = await downloadFromCloud();
      Alert.alert(
        'Download Successful',
        `Successfully downloaded ${count} task${count === 1 ? '' : 's'} from Cloud Firestore into your local database.`
      );
    } catch (err: any) {
      Alert.alert('Download Notice', err?.message || 'Could not download tasks from Firebase right now.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await signInAnonymously();
      Alert.alert('Success', 'Signed in anonymously. Tasks will now sync to cloud.');
    } catch (err: any) {
      Alert.alert('Notice', 'Firebase anonymous auth is not enabled yet in your Firebase console. Local SQLite continues to work completely offline.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        Alert.alert('Account Created', 'Account created and signed in successfully!');
      } else {
        await signInWithEmail(email, password);
        Alert.alert('Welcome Back', 'Signed in successfully!');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      Alert.alert('Authentication Notice', err?.message || 'Authentication failed. Check your Firebase console settings.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Account</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Account Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <User size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          </View>

          {user ? (
            <View>
              <View style={styles.userInfoRow}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {user.isAnonymous ? 'Guest User (Anonymous)' : user.email}
                  </Text>
                  <Text style={[styles.userId, { color: theme.textMuted }]}>
                    UID: {user.uid.substring(0, 12)}...
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSignOut}
                style={[styles.signOutBtn, { borderColor: '#EF4444' }]}
              >
                <LogOut size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={[styles.descText, { color: theme.textSecondary }]}>
                Sign in to automatically sync your tasks across devices with Firebase Cloud Firestore.
              </Text>

              {/* Anonymous Instant Sign In */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isAuthLoading}
                onPress={handleAnonymousSignIn}
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              >
                {isAuthLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.syncBtnContent}>
                    <LogIn size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionBtnText}>Sign In as Guest (Instant)</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              {/* Email/Password Fields */}
              <Text style={[styles.subHeading, { color: theme.text }]}>
                {authMode === 'signin' ? 'Or Sign In with Email' : 'Create an Account'}
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.authInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.text },
                ]}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                style={[
                  styles.authInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.text },
                ]}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isAuthLoading}
                onPress={handleEmailAuth}
                style={[styles.authSubmitBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
              >
                <Text style={[styles.authSubmitText, { color: theme.text }]}>
                  {authMode === 'signin' ? 'Sign In with Email' : 'Register Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                style={styles.toggleAuthBtn}
              >
                <Text style={[styles.toggleAuthText, { color: theme.primary }]}>
                  {authMode === 'signin'
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Synchronization Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Cloud size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cloud Synchronization</Text>
          </View>

          <View style={styles.syncInfoRow}>
            <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>Status:</Text>
            <Text
              style={[
                styles.syncInfoValue,
                {
                  color:
                    syncState === 'synced'
                      ? '#10B981'
                      : syncState === 'syncing'
                      ? theme.primary
                      : syncState === 'offline'
                      ? '#F59E0B'
                      : theme.textSecondary,
                  fontWeight: '700',
                  textTransform: 'capitalize',
                },
              ]}
            >
              {syncState}
            </Text>
          </View>

          <View style={styles.syncInfoRow}>
            <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>
              Pending Changes:
            </Text>
            <Text style={[styles.syncInfoValue, { color: theme.text, fontWeight: '700' }]}>
              {unsyncedCount}
            </Text>
          </View>

          {/* Action buttons: Upload, Download, Sync */}
          <View style={styles.syncRowActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isUploading}
              onPress={handleUpload}
              style={[
                styles.syncActionBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <View style={styles.syncBtnContent}>
                  <Upload size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.syncActionBtnText, { color: theme.primary }]}>Upload</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isDownloading}
              onPress={handleDownload}
              style={[
                styles.syncActionBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <View style={styles.syncBtnContent}>
                  <Download size={16} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={[styles.syncActionBtnText, { color: '#10B981' }]}>Download</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isSyncingManual}
            onPress={handleManualSync}
            style={[
              styles.syncNowBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            {isSyncingManual ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.syncBtnContent}>
                <RefreshCw size={16} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.syncNowBtnText, { color: theme.primary }]}>Full Two-Way Sync</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.syncHintText, { color: theme.textMuted }]}>
            Tip: Tap Upload to backup tasks to Cloud Firestore. After reinstalling or on a new device, tap Download to restore all tasks into your local database.
          </Text>
        </View>

        {/* Appearance Theme Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            {isDark ? (
              <Moon size={20} color={theme.primary} style={{ marginRight: 8 }} />
            ) : (
              <Sun size={20} color={theme.primary} style={{ marginRight: 8 }} />
            )}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>

          <View style={styles.themeToggleRow}>
            {(['light', 'dark', 'system'] as const).map(mode => {
              const isSelected = currentMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.7}
                  onPress={() => setScheme(mode)}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Local SQLite Database Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Database size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Local Database</Text>
          </View>

          <View style={styles.syncInfoRow}>
            <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>Engine:</Text>
            <Text style={[styles.syncInfoValue, { color: theme.text }]}>SQLite (JSI)</Text>
          </View>
          <View style={styles.syncInfoRow}>
            <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>Database:</Text>
            <Text style={[styles.syncInfoValue, { color: theme.text }]}>taskmanager.db</Text>
          </View>
          <View style={styles.syncInfoRow}>
            <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>
              Stored Tasks:
            </Text>
            <Text style={[styles.syncInfoValue, { color: theme.text, fontWeight: '700' }]}>
              {counts.total}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userId: {
    fontSize: 12,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  authInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  authSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  authSubmitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleAuthBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleAuthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  syncInfoLabel: {
    fontSize: 14,
  },
  syncInfoValue: {
    fontSize: 14,
  },
  syncRowActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  syncBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  syncNowBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  syncHintText: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
