import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { getApiUrlAsync } from '../config/api';

const TYPE_META = {
  confirmed: { icon: 'checkmark-circle', color: '#1D4ED8', bg: '#DBEAFE', label: 'Booking Confirmed' },
  completed: { icon: 'star',             color: '#16A34A', bg: '#DCFCE7', label: 'Appointment Done' },
  cancelled: { icon: 'close-circle',     color: '#DC2626', bg: '#FEE2E2', label: 'Booking Cancelled' },
  near:      { icon: 'alarm',            color: '#B45309', bg: '#FEF3C7', label: 'Appointment Reminder' },
  info:      { icon: 'information-circle', color: '#7C3AED', bg: '#EDE9FE', label: 'Info' },
  promo:     { icon: 'card',             color: '#F59E0B', bg: '#FEF3C7', label: 'Promo' },
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { userToken, clearNotifications, markAllRead, refreshUnreadCount } = useAppContext();
  const [dbNotifications, setDbNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/notifications`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Mark all as read when screen is focused
  useFocusEffect(useCallback(() => {
    markAllRead();
    fetchNotifications(false);
    refreshUnreadCount?.();
  }, [markAllRead, fetchNotifications, refreshUnreadCount]));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const api = await getApiUrlAsync();
      await fetch(`${api}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      await refreshUnreadCount?.();
      fetchNotifications(false);
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      const api = await getApiUrlAsync();
      await fetch(`${api}/api/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setDbNotifications([]);
      clearNotifications();
      await refreshUnreadCount?.();
    } catch (e) {
      console.error('Error clearing notifications:', e);
    }
  };

  const sorted = [...dbNotifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading && dbNotifications.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f0ff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={st.root}>
      <LinearGradient colors={['#3B0764', '#5B21B6', '#7C3AED']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={st.headerRow}>
          <View>
            <Text style={st.headerTitle}>Notifications</Text>
            <Text style={st.headerSub}>{sorted.length} message{sorted.length !== 1 ? 's' : ''}</Text>
          </View>
          {sorted.length > 0 && (
            <TouchableOpacity style={st.clearBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={st.clearTxt}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {sorted.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="notifications-off-outline" size={64} color="#DDD6FE" />
          <Text style={st.emptyTitle}>No notifications yet</Text>
          <Text style={st.emptySub}>You'll see booking updates here</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7c3aed" />}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] || TYPE_META.info;
            return (
              <View style={[st.card, !item.is_read && st.cardUnread]}>
                <View style={[st.iconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={st.cardBody}>
                  <View style={st.cardTop}>
                    <Text style={st.cardLabel}>{meta.label}</Text>
                    <Text style={st.cardTime}>{timeAgo(new Date(item.created_at))}</Text>
                  </View>
                  <Text style={st.cardMsg}>{item.message}</Text>
                  {!item.is_read && (
                    <TouchableOpacity style={st.markReadBtn} onPress={() => handleMarkAsRead(item.id)}>
                      <Text style={st.markReadTxt}>Mark as read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!item.is_read && <View style={st.unreadDot} />}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F0FF' },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  clearTxt: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#9CA3AF' },
  emptySub:   { fontSize: 13, color: '#D1D5DB' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#7C3AED' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardLabel: { fontSize: 13, fontWeight: '800', color: '#1E1B4B' },
  cardTime:  { fontSize: 11, color: '#9CA3AF' },
  cardMsg:   { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED', marginTop: 4, flexShrink: 0 },
});
