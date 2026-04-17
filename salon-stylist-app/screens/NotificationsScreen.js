import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

const P = '#7C3AED';

const fmtTime = (dt) => {
  const d = new Date(dt);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TYPE_CONFIG = {
  pending:   { icon: 'calendar-outline',      color: '#F59E0B', bg: '#FEF3C7', label: 'New Booking Request' },
  confirmed: { icon: 'checkmark-circle-outline', color: '#10B981', bg: '#D1FAE5', label: 'Booking Confirmed' },
  cancelled: { icon: 'close-circle-outline',  color: '#EF4444', bg: '#FEE2E2', label: 'Booking Cancelled' },
  reminder:  { icon: 'alarm-outline',         color: '#3B82F6', bg: '#DBEAFE', label: 'Reminder' },
};

export default function NotificationsScreen({ route }) {
  const { stylistToken } = route.params || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [read, setRead] = useState(new Set());

  useFocusEffect(
    React.useCallback(() => {
      if (stylistToken) fetchNotifications();
    }, [stylistToken])
  );

  const fetchNotifications = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/stylists/bookings`, {
        headers: { Authorization: `Bearer ${stylistToken}` },
      });
      if (res.ok) {
        const bookings = await res.json();
        // Build notification items from bookings
        const items = bookings.map(b => ({
          id: b.id,
          type: b.status,
          title: TYPE_CONFIG[b.status]?.label || 'Booking Update',
          message: `${b.clientName} — ${b.serviceName}`,
          time: b.dateTime,
          clientName: b.clientName,
          serviceName: b.serviceName,
        }));
        // Sort newest first
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(items);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markRead = (id) => setRead(prev => new Set([...prev, id]));
  const markAllRead = () => setRead(new Set(notifications.map(n => n.id)));

  const unreadCount = notifications.filter(n => !read.has(n.id)).length;

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.reminder;
    const isRead = read.has(item.id);
    return (
      <TouchableOpacity
        style={[st.item, isRead && st.itemRead]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.8}
      >
        <View style={[st.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={st.itemBody}>
          <View style={st.itemTop}>
            <Text style={[st.itemTitle, isRead && st.itemTitleRead]}>{item.title}</Text>
            <Text style={st.itemTime}>{fmtTime(item.time)}</Text>
          </View>
          <Text style={st.itemMsg} numberOfLines={2}>{item.message}</Text>
        </View>
        {!isRead && <View style={st.dot} />}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={P} /></View>;

  return (
    <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.root} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.header}>
        <View style={st.headerRow}>
          <View>
            <Text style={st.headerTitle}>Notifications</Text>
            {unreadCount > 0 && <Text style={st.headerSub}>{unreadCount} unread</Text>}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={st.markAllBtn} onPress={markAllRead}>
              <Text style={st.markAllTxt}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {notifications.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
          <Text style={st.emptyTxt}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  markAllBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },
  markAllTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  item: { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  itemRead: { opacity: 0.65 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  itemTitleRead: { fontWeight: '600', color: '#6B7280' },
  itemMsg: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  itemTime: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTxt: { color: '#9CA3AF', marginTop: 12, fontSize: 15 },
});
