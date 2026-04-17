import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import BookingsScreen from './screens/BookingsScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import RatingsScreen from './screens/RatingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const logoutRef = { current: null };

function AuthStack({ setIsLoggedIn }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} initialParams={{ setIsLoggedIn }} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard:     ['analytics',      'analytics-outline'],
  Bookings:      ['calendar',       'calendar-outline'],
  Schedule:      ['time',           'time-outline'],
  Notifications: ['notifications',  'notifications-outline'],
  Ratings:       ['star',           'star-outline'],
  Profile:       ['person',         'person-outline'],
};

function AppStack({ stylistToken, stylistName }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#4C1D95' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#EDE9FE',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
          height: 58 + (insets.bottom > 0 ? insets.bottom : 10),
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ stylistToken, stylistName }}
        options={{ title: 'Home' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ stylistToken, stylistName }) })}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        initialParams={{ stylistToken }}
        options={{ title: 'Bookings' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ stylistToken }) })}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        initialParams={{ stylistToken }}
        options={{ title: 'Schedule' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ stylistToken }) })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        initialParams={{ stylistToken }}
        options={{ title: 'Alerts' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ stylistToken }) })}
      />
      <Tab.Screen
        name="Ratings"
        component={RatingsScreen}
        initialParams={{ stylistToken }}
        options={{ title: 'Ratings' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ stylistToken }) })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ stylistToken }}
        options={{ title: 'Profile' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ stylistToken }) })}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stylistToken, setStylistToken] = useState('');
  const [stylistName, setStylistName] = useState('');

  useEffect(() => { setIsLoading(false); }, []);

  const handleLogin = (token, name) => {
    setStylistToken(token);
    setStylistName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setStylistToken('');
    setStylistName('');
    setIsLoggedIn(false);
  };

  logoutRef.current = handleLogout;

  if (isLoading) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoggedIn
          ? <AppStack stylistToken={stylistToken} stylistName={stylistName} />
          : <AuthStack setIsLoggedIn={handleLogin} />
        }
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
