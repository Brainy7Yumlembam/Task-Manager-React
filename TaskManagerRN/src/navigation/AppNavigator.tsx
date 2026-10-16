import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddEditTaskScreen } from '../screens/AddEditTaskScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  AddEditTask: { taskId?: string } | undefined;
  TaskDetail: { taskId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddEditTask" component={AddEditTaskScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
