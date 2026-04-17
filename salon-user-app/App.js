// Stable ref-based login callback to avoid passing functions in nav params
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppContext } from './context/AppContext';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import ServicesScreen from './screens/ServicesScreen';
import StylistsScreen from './screens/StylistsScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import BookingScreen from './screens/BookingScreen';
import ProfileScreen from './screens/ProfileScreen';
import ServiceDetailsScreen from './screens/ServiceDetailsScreen';
import StylistsForServiceScreen from './screens/StylistsForServiceScreen';
import BookingConfirmScreen from './screens/BookingConfirmScreen';
import StylistProfileScreen from './screens/StylistProfileScreen';
import StylistPickerScreen from './screens/StylistPickerScreen';
import BookingAppointmentScreen from './screens/BookingAppointmentScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AboutScreen from './screens/AboutScreen';
import NotificationService from './services/NotificationService';
import InAppNotificationManager from './services/InAppNotificationManager';
import InAppNotification from './components/InAppNotification';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// AuthStack receives a loginRef (ref to callback) — avoids non-serializable warning
function AuthStack({ loginRef }) {
  // Wrap in a stable function that reads from ref at call time
  const handleLogin = (token, name, email, id, profileImage) => loginRef.current?.(token, name, email, id, profileImage);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"  component={LoginScreen}  initialParams={{ setIsLoggedIn: handleLogin }} />
      <Stack.Screen name="Signup" component={SignupScreen} initialParams={{ setIsLoggedIn: handleLogin }} />
    </Stack.Navigator>
  );
}

function MainTabNavigator({ unreadCount, onLogout }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingTop: 8,
            height: 58 + insets.bottom,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Home:          focused ? 'home'             : 'home-outline',
              Services:      focused ? 'cut'              : 'cut-outline',
              MyBookings:    focused ? 'calendar'         : 'calendar-outline',
              Stylists:      focused ? 'person'           : 'person-outline',
              Notifications: focused ? 'notifications'    : 'notifications-outline',
              Profile:       focused ? 'person-circle'    : 'person-circle-outline',
            };
            if (route.name === 'Notifications') {
              return (
                <View>
                  <Ionicons name={icons[route.name]} size={size} color={color} />
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute', top: -4, right: -8,
                      backgroundColor: '#EF4444', borderRadius: 10,
                      minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
                      paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#7C3AED',
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home"          component={HomeScreen}          options={{ title: 'Home' }} />
        <Tab.Screen name="Services"      component={ServicesScreen}      options={{ title: 'Services' }} />
        <Tab.Screen name="MyBookings"    component={MyBookingsScreen}    options={{ title: 'Bookings' }} />
        <Tab.Screen name="Stylists"      component={StylistsScreen}      options={{ title: 'Stylists' }} />
        <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
        <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'Profile' }} />
      </Tab.Navigator>
    </View>
  );
}

function AppStack({ unreadCount }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a0030' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {() => <MainTabNavigator unreadCount={unreadCount} />}
      </Stack.Screen>
      <Stack.Screen name="BookingScreen"         component={BookingScreen}           options={{ headerShown: false }} />
      <Stack.Screen name="ServiceDetailsScreen"  component={ServiceDetailsScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="StylistsForServiceScreen" component={StylistsForServiceScreen} options={{ title: 'Available Stylists' }} />
      <Stack.Screen name="BookingConfirmScreen"  component={BookingConfirmScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="StylistProfileScreen"  component={StylistProfileScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="StylistPickerScreen"   component={StylistPickerScreen}     options={{ headerShown: false }} />
      <Stack.Screen name="BookingAppointmentScreen" component={BookingAppointmentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AboutScreen" component={AboutScreen} options={{ title: 'About the Salon' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [userToken, setUserToken]   = useState('');
  const [userName, setUserName]     = useState('');
  const [userEmail, setUserEmail]   = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [userId, setUserId]         = useState(null);
  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);
  const userIdRef = useRef(null);

  // Stable ref so AuthStack doesn't get a new function on every render
  const loginRef = useRef(null);

  useEffect(() => {
    initNotifications();
    setIsLoading(false);
  }, []);

  // Notification helpers
  const addNotification = useCallback((type, message) => {
    setNotifications(prev => [{ ts: Date.now(), type, message, read: false }, ...prev].slice(0, 50));
  }, []);
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const markAllRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);

  const refreshUnreadCount = useCallback(async () => {
    if (!userToken) {
      setUnreadCount(0);
      return;
    }
    try {
      const { getApiUrlAsync } = await import('./config/api');
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (e) {
      console.error('Error fetching unread count:', e);
      setUnreadCount(0);
    }
  }, [userToken]);

  // Fetch unread count from database
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // WebSocket listener for booking status notifications
  useEffect(() => {
    if (!isLoggedIn) {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      return;
    }
    const connectWs = async () => {
      try {
        const { getApiUrlAsync } = await import('./config/api');
        const api = await getApiUrlAsync();
        const wsUrl = api.replace(/^http/, 'ws');
        console.log('Connecting WebSocket to:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => console.log('WS connected');
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            console.log('WS message received:', msg.type);
            if (msg.type === 'booking_confirmed_notify') {
              const d = msg.data;
              console.log('Notify data:', d, '| userIdRef:', userIdRef.current);
              // Only skip if we have BOTH ids and they clearly don't match
              if (d.clientId && userIdRef.current && String(d.clientId) !== String(userIdRef.current)) {
                console.log('Skipping — not for this user');
                return;
              }
              const dt = d.dateTime ? new Date(d.dateTime) : null;
              const timeStr = dt ? dt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

              const statusMessages = {
                confirmed: {
                  flash: `✅ Booking Confirmed! Your ${d.serviceName} with ${d.stylistName}${timeStr ? ' on ' + timeStr : ''} is confirmed. Please arrive on time — late arrivals may lose their slot.`,
                  notif: `Your ${d.serviceName} with ${d.stylistName}${timeStr ? ' on ' + timeStr : ''} is confirmed. Please arrive on time — late arrivals may lose their slot.`,
                  type: 'confirmed',
                  flashType: 'success',
                },
                completed: {
                  flash: `🎉 Appointment Complete! We hope you loved your ${d.serviceName}. Don't forget to rate your experience!`,
                  notif: `Your ${d.serviceName} appointment is complete. We hope you loved it! Rate your experience in the app.`,
                  type: 'completed',
                  flashType: 'success',
                },
                cancelled: {
                  flash: `❌ Booking Cancelled. Your ${d.serviceName} booking has been cancelled by the salon.`,
                  notif: `Your ${d.serviceName} booking has been cancelled by the salon.`,
                  type: 'cancelled',
                  flashType: 'error',
                },
              };

              const meta = statusMessages[d.status] || statusMessages.confirmed;
              showNotifRef.current(meta.flash, meta.flashType, 8000);
              addNotificationRef.current(meta.type, meta.notif);
              setUnreadCount((prev) => prev + 1);
              
              // Also save to database
              saveToDatabaseRef.current(d.clientId, meta.type, meta.notif, d.bookingId);
            }
          } catch (err) { console.log('WS parse error:', err); }
        };
        ws.onerror = (err) => console.log('WS error:', err.message);
        ws.onclose = () => {
          console.log('WS closed, reconnecting in 3s...');
          setTimeout(connectWs, 3000);
        };
      } catch (err) { console.log('WS connect failed:', err); }
    };
    connectWs();
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
  }, [isLoggedIn, addNotification]);

  const initNotifications = async () => {
    try {
      await NotificationService.initialize();
      try { await NotificationService.scheduleDailyAppointmentCheck(); } catch {}
      InAppNotificationManager.on('notification', d => showNotifRef.current(d.message, d.type));
      InAppNotificationManager.startChecking();
      NotificationService.addNotificationReceivedListener(n => showNotifRef.current(n.message, n.type || 'info'));
      NotificationService.addNotificationResponseReceivedListener(r => showNotifRef.current(r.message, r.type || 'info'));
      return () => InAppNotificationManager.stopChecking();
    } catch {
      InAppNotificationManager.on('notification', d => showNotifRef.current(d.message, d.type));
      InAppNotificationManager.startChecking();
    }
  };

  const showNotif = (message, type = 'info', duration = 4000) => setNotification({ visible: true, message, type, duration });
  const hideNotif = () => setNotification(p => ({ ...p, visible: false }));

  // Stable refs so closures always call the latest version
  const showNotifRef = useRef(showNotif);
  const addNotificationRef = useRef(addNotification);
  const saveToDatabaseRef = useRef(null);
  useEffect(() => { showNotifRef.current = showNotif; }, [notification]);
  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);

  // Save notification to database
  useEffect(() => {
    saveToDatabaseRef.current = async (clientId, type, message, bookingId) => {
      if (!clientId || !userToken) return;
      try {
        const { getApiUrlAsync } = await import('./config/api');
        const api = await getApiUrlAsync();
        await fetch(`${api}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify({
            client_id: clientId,
            title: type === 'confirmed' ? 'Booking Confirmed' : type === 'completed' ? 'Appointment Complete' : 'Booking Cancelled',
            message,
            type,
            booking_id: bookingId
          })
        });
      } catch (e) {
        console.error('Error saving notification to database:', e);
      }
    };
  }, [userToken]);

  const handleLogin = (token, name, email, id, profileImage) => {
    setUserToken(token);
    setUserName(name);
    setUserEmail(email);
    setUserProfileImage(profileImage || null);
    setUserId(id || null);
    userIdRef.current = id || null;
    setIsLoggedIn(true);
  };
  // Keep ref in sync
  loginRef.current = handleLogin;

  const handleLogout = () => {
    setUserToken('');
    setUserName('');
    setUserEmail('');
    setUserProfileImage(null);
    setUserId(null);
    userIdRef.current = null;
    setIsLoggedIn(false);
  };

  if (isLoading) return null;

  return (
    <AppContext.Provider value={{ userToken, userName, userEmail, userProfileImage, userId, notifications, unreadCount, addNotification, clearNotifications, markAllRead, refreshUnreadCount, setUserProfileImage, onLogout: handleLogout }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <NavigationContainer>
            {isLoggedIn ? <AppStack unreadCount={unreadCount} /> : <AuthStack loginRef={loginRef} />}
          </NavigationContainer>
          <InAppNotification
            visible={notification.visible}
            message={notification.message}
            type={notification.type}
            duration={notification.duration || 4000}
            onHide={hideNotif}
          />
        </View>
      </SafeAreaProvider>
    </AppContext.Provider>
  );
}
