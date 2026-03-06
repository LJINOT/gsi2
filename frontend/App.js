import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import store from './store';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import TasksScreen from './screens/TasksScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import CalendarScreen from './screens/CalendarScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import PrioritiesScreen from './screens/PrioritiesScreen';
import TodayScreen from './screens/TodayScreen';
import ThisWeekScreen from './screens/ThisWeekScreen';
import CompletedScreen from './screens/CompletedScreen';
import TimesheetScreen from './screens/TimesheetScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';

// Icons
import { Dashboard, Clipboard, Calendar, Zap, BarChart3, Settings } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ManagementStack = createNativeStackNavigator();
const ReferentialStack = createNativeStackNavigator();
const TimesheetStack = createNativeStackNavigator();

// Management Tab Navigator
const ManagementNavigator = () => (
  <ManagementStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#0F172A' },
      headerTintColor: '#E0E7FF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <ManagementStack.Screen name="Tasks" component={TasksScreen} />
    <ManagementStack.Screen name="AddTask" component={AddTaskScreen} options={{ title: 'Add Task' }} />
    <ManagementStack.Screen name="Calendar" component={CalendarScreen} />
    <ManagementStack.Screen name="Schedule" component={ScheduleScreen} />
  </ManagementStack.Navigator>
);

// Referential Tab Navigator
const ReferentialNavigator = () => (
  <ReferentialStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#0F172A' },
      headerTintColor: '#E0E7FF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <ReferentialStack.Screen name="Priorities" component={PrioritiesScreen} />
    <ReferentialStack.Screen name="Today" component={TodayScreen} />
    <ReferentialStack.Screen name="ThisWeek" component={ThisWeekScreen} options={{ title: 'This Week' }} />
    <ReferentialStack.Screen name="Completed" component={CompletedScreen} />
  </ReferentialStack.Navigator>
);

// Timesheet Tab Navigator
const TimesheetNavigator = () => (
  <TimesheetStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#0F172A' },
      headerTintColor: '#E0E7FF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <TimesheetStack.Screen name="TimetrackMain" component={TimesheetScreen} options={{ title: 'Timesheet' }} />
    <TimesheetStack.Screen name="Analytics" component={AnalyticsScreen} />
  </TimesheetStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const iconProps = { size: size || 24, color };
        
        switch (route.name) {
          case 'Dashboard':
            return <Dashboard {...iconProps} />;
          case 'Management':
            return <Clipboard {...iconProps} />;
          case 'Referential':
            return <Zap {...iconProps} />;
          case 'Timesheet':
            return <BarChart3 {...iconProps} />;
          case 'Settings':
            return <Settings {...iconProps} />;
          default:
            return null;
        }
      },
      tabBarActiveTintColor: '#818CF8',
      tabBarInactiveTintColor: '#64748B',
      tabBarStyle: {
        backgroundColor: '#0F172A',
        borderTopColor: '#1E293B',
        paddingBottom: 8,
        paddingTop: 8,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Management" 
      component={ManagementNavigator}
      options={{ title: 'Management' }}
    />
    <Tab.Screen 
      name="Referential" 
      component={ReferentialNavigator}
      options={{ title: 'Overview' }}
    />
    <Tab.Screen 
      name="Timesheet" 
      component={TimesheetNavigator}
      options={{ title: 'Timesheet' }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Tab.Navigator>
);

// Root Stack Navigator
const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    setTimeout(() => {
      setIsLoading(false);
      // setIsAuthenticated(true); // Set to true after successful login
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <ReduxProvider store={store}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ReduxProvider>
  );
}
