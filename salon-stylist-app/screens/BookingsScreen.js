import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, Alert, Modal, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

const P = '#7C3AED';
const TABS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const STATUS_COLOR = { pending: '#F59E0B', confirmed: '#10B981', completed: '#7C3AED', cancelled: '#EF4444' };
const STATUS_BG    = { pending: '#FEF3C7', confirmed: '#D1FAE5', completed: '#EDE9FE', cancelled: '#FEE2E2' };

const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtTime = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const todayStr = () => new Date().toISOString().split('T')[0];

export default function BookingsScreen({ route }) {
  const { stylistToken } = route.params || {};
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('Pending');
  const [selected, setSelected]   = useState(null); // detail modal
  const [updating, setUpdating]   = useState(false);
  const [rescheduleAlert, setRescheduleAlert] = useState(null); // { clientName, oldDateTime, newDateTime, oldStylist, newStylist, oldService, newService }
  const rescheduleAlertTimer = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      if (stylistToken) {
        fetchBookings();
        (async () => await setupWebSocket())();
      } else { 
        setBookings([]); 
        setLoading(false); 
      }
    }, [stylistToken])
  );

  useEffect(() => {
    if (!stylistToken) return;
    const iv = setInterval(fetchBookings, 8000);
    return () => {
      clearInterval(iv);
      if (rescheduleAlertTimer.current) clearTimeout(rescheduleAlertTimer.current);
    };
  }, [stylistToken]);

  const setupWebSocket = async () => {
    // Use the same IP detection as API
    const apiBase = await getApiUrlAsync();
    // Extract host from API URL (e.g., http://10.163.27.31:3001 -> 10.163.27.31)
    const host = apiBase.replace('http://', '').replace('https://', '').split(':')[0];
    const wsUrl = `ws://${host}:3001`;
    
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log('WebSocket connected for stylist');
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // Reschedule alerts
          if (msg.type === 'booking_rescheduled') {
            if (rescheduleAlertTimer.current) clearTimeout(rescheduleAlertTimer.current);
            setRescheduleAlert({
              clientName: msg.data.clientName || 'A client',
              oldDateTime: msg.data.oldDateTime,
              newDateTime: msg.data.newDateTime,
              oldStylist: msg.data.oldStylistId,
              newStylist: msg.data.newStylistId,
              oldService: msg.data.oldServiceId,
              newService: msg.data.newServiceId,
              reason: msg.data.reason || 'Rescheduled by client'
            });
            rescheduleAlertTimer.current = setTimeout(() => setRescheduleAlert(null), 30000);
            fetchBookings();
          }
        } catch {}
      };
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/stylists/bookings`, {
        headers: { Authorization: `Bearer ${stylistToken}` },
      });
      if (res.ok) setBookings(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stylistToken}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchBookings();
        setSelected(prev => prev ? { ...prev, status } : null);
        Alert.alert('Updated', `Booking marked as ${status}.`);
      } else Alert.alert('Error', 'Failed to update booking');
    } catch { Alert.alert('Error', 'Connection failed'); }
    finally { setUpdating(false); }
  };


  const filtered = bookings.filter(b => b.status === tab.toLowerCase());

  const counts = {
    Pending:   bookings.filter(b => b.status === 'pending').length,
    Confirmed: bookings.filter(b => b.status === 'confirmed').length,
    Completed: bookings.filter(b => b.status === 'completed').length,
    Cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity style={st.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
      <View style={[st.cardAccent, { backgroundColor: STATUS_COLOR[item.status] || P }]} />
      <View style={st.cardBody}>
        <View style={st.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={st.clientName}>{item.clientName}</Text>
            <Text style={st.serviceName}>{item.serviceName}</Text>
          </View>
          <View style={[st.badge, { backgroundColor: STATUS_BG[item.status] }]}>
            <Text style={[st.badgeTxt, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
          </View>
        </View>

        <View style={st.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
          <Text style={st.metaTxt}>{fmtDate(item.dateTime)}</Text>
          <Ionicons name="time-outline" size={13} color="#9CA3AF" style={{ marginLeft: 12 }} />
          <Text style={st.metaTxt}>{fmtTime(item.dateTime)}</Text>
          <Ionicons name="pricetag-outline" size={13} color="#9CA3AF" style={{ marginLeft: 12 }} />
          <Text style={st.metaTxt}>₱{item.price}</Text>
        </View>

        {item.status === 'pending' && (
          <View style={st.quickActions}>
            <TouchableOpacity style={[st.qBtn, { backgroundColor: '#10B981' }]} onPress={() => updateStatus(item.id, 'confirmed')}>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={st.qBtnTxt}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.qBtn, { backgroundColor: '#EF4444' }]} onPress={() => updateStatus(item.id, 'cancelled')}>
              <Ionicons name="close" size={14} color="#fff" />
              <Text style={st.qBtnTxt}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.status === 'confirmed' && (
          <TouchableOpacity style={[st.qBtn, { backgroundColor: '#3B82F6', alignSelf: 'flex-start', marginTop: 10 }]} onPress={() => updateStatus(item.id, 'completed')}>
            <Ionicons name="checkmark-done" size={14} color="#fff" />
            <Text style={st.qBtnTxt}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={P} /></View>;

  return (
    <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.root} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Tab bar */}
      <View style={st.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[st.tabBtn, tab === t && st.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[st.tabTxt, tab === t && st.tabTxtActive]}>{t}</Text>
              {counts[t] > 0 && (
                <View style={[st.tabBadge, tab === t && st.tabBadgeActive]}>
                  <Text style={[st.tabBadgeTxt, tab === t && { color: P }]}>{counts[t]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="calendar-outline" size={60} color="#D1D5DB" />
          <Text style={st.emptyTxt}>No {tab.toLowerCase()} appointments</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCard}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reschedule Alert */}
      {rescheduleAlert && (
        <View style={st.rescheduleAlert}>
          <View style={st.rescheduleAlertIcon}>🔄</View>
          <View style={st.rescheduleAlertBody}>
            <Text style={st.rescheduleAlertTitle}>Appointment Rescheduled</Text>
            <Text style={st.rescheduleAlertClient}>
              <Text style={st.rescheduleAlertClientName}>{rescheduleAlert.clientName}</Text> rescheduled their appointment
            </Text>
            <View style={st.rescheduleAlertChanges}>
              <View style={st.rescheduleAlertChange}>
                <Text style={st.rescheduleAlertLabel}>📅 Date & Time:</Text>
                <Text style={st.rescheduleAlertOld}>{fmtDate(rescheduleAlert.oldDateTime)} {fmtTime(rescheduleAlert.oldDateTime)}</Text>
                <Text style={st.rescheduleAlertArrow}>→</Text>
                <Text style={st.rescheduleAlertNew}>{fmtDate(rescheduleAlert.newDateTime)} {fmtTime(rescheduleAlert.newDateTime)}</Text>
              </View>
              {rescheduleAlert.oldStylist !== rescheduleAlert.newStylist && (
                <View style={st.rescheduleAlertChange}>
                  <Text style={st.rescheduleAlertLabel}>💇 Stylist:</Text>
                  <Text style={st.rescheduleAlertOld}>{rescheduleAlert.oldStylist}</Text>
                  <Text style={st.rescheduleAlertArrow}>→</Text>
                  <Text style={st.rescheduleAlertNew}>{rescheduleAlert.newStylist}</Text>
                </View>
              )}
              {rescheduleAlert.oldService !== rescheduleAlert.newService && (
                <View style={st.rescheduleAlertChange}>
                  <Text style={st.rescheduleAlertLabel}>✨ Service:</Text>
                  <Text style={st.rescheduleAlertOld}>{rescheduleAlert.oldService}</Text>
                  <Text style={st.rescheduleAlertArrow}>→</Text>
                  <Text style={st.rescheduleAlertNew}>{rescheduleAlert.newService}</Text>
                </View>
              )}
            </View>
            <Text style={st.rescheduleAlertReason}>Reason: {rescheduleAlert.reason}</Text>
          </View>
          <TouchableOpacity 
            style={st.rescheduleAlertClose} 
            onPress={() => { 
              if (rescheduleAlertTimer.current) clearTimeout(rescheduleAlertTimer.current); 
              setRescheduleAlert(null); 
            }}
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View style={st.rescheduleAlertBar} />
        </View>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={st.overlay}>
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <Text style={st.sheetTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={st.closeBtn}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status badge */}
                <View style={[st.detailBadge, { backgroundColor: STATUS_BG[selected.status] }]}>
                  <View style={[st.detailDot, { backgroundColor: STATUS_COLOR[selected.status] }]} />
                  <Text style={[st.detailBadgeTxt, { color: STATUS_COLOR[selected.status] }]}>
                    {selected.status.toUpperCase()}
                  </Text>
                </View>

                {[
                  { icon: 'person-outline',   label: 'Client',   val: selected.clientName },
                  { icon: 'cut-outline',       label: 'Service',  val: selected.serviceName },
                  { icon: 'calendar-outline',  label: 'Date',     val: fmtDate(selected.dateTime) },
                  { icon: 'time-outline',      label: 'Time',     val: fmtTime(selected.dateTime) },
                  { icon: 'pricetag-outline',  label: 'Price',    val: `₱${selected.price}` },
                  selected.notes && { icon: 'chatbubble-outline', label: 'Notes', val: selected.notes },
                ].filter(Boolean).map(row => (
                  <View key={row.label} style={st.detailRow}>
                    <View style={st.detailIcon}><Ionicons name={row.icon} size={16} color={P} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.detailLabel}>{row.label}</Text>
                      <Text style={st.detailVal}>{row.val}</Text>
                    </View>
                  </View>
                ))}

                {/* Special Request */}
                {!!selected.specialRequest && (
                  <View style={st.requestBox}>
                    <View style={st.requestHeader}>
                      <Ionicons name="sparkles-outline" size={15} color="#7C3AED" />
                      <Text style={st.requestTitle}>Special Request</Text>
                    </View>
                    <Text style={st.requestTxt}>{selected.specialRequest}</Text>
                  </View>
                )}

                {/* Reference Images */}
                {selected.referenceImages && selected.referenceImages.length > 0 && (
                  <View style={st.refSection}>
                    <View style={st.requestHeader}>
                      <Ionicons name="images-outline" size={15} color="#7C3AED" />
                      <Text style={st.requestTitle}>Reference Images ({selected.referenceImages.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 8 }}>
                      {selected.referenceImages.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} style={st.refImg} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Actions */}
                <View style={st.sheetActions}>
                  {selected.status === 'pending' && (
                    <>
                      <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => updateStatus(selected.id, 'confirmed')} disabled={updating}>
                        {updating ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={st.actionBtnTxt}>Accept</Text></>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => updateStatus(selected.id, 'cancelled')} disabled={updating}>
                        <Ionicons name="close-circle" size={18} color="#fff" /><Text style={st.actionBtnTxt}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selected.status === 'confirmed' && (
                    <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#3B82F6', flex: 1 }]} onPress={() => updateStatus(selected.id, 'completed')} disabled={updating}>
                      {updating ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-done" size={18} color="#fff" /><Text style={st.actionBtnTxt}>Mark as Completed</Text></>}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EDE9FE' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F3FF' },
  tabBtnActive: { backgroundColor: '#EDE9FE' },
  tabTxt: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTxtActive: { color: '#7C3AED' },
  tabBadge: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: '#DDD6FE' },
  tabBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 18, flexDirection: 'row', overflow: 'hidden', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  clientName:  { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  serviceName: { fontSize: 13, color: '#7C3AED', fontWeight: '600', marginTop: 2 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaTxt:  { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  qBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  qBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTxt: { color: '#9CA3AF', marginTop: 12, fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#EDE9FE', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  closeBtn: { padding: 4 },
  detailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 16 },
  detailDot: { width: 8, height: 8, borderRadius: 4 },
  detailBadgeTxt: { fontSize: 12, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F3FF' },
  detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  detailVal:   { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
  actionBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // Special request & reference images
  requestBox:    { backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#7C3AED' },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  requestTitle:  { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  requestTxt:    { fontSize: 14, color: '#374151', lineHeight: 20 },
  refSection:    { marginTop: 12 },
  refImg:        { width: 110, height: 110, borderRadius: 12, backgroundColor: '#EDE9FE' },
  
  // Reschedule Alert Styles
  rescheduleAlert: {
    position: 'fixed',
    top: 24,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    boxShadow: '0 4px 24px rgba(234, 179, 8, 0.2)',
    zIndex: 999,
    minWidth: 300,
    maxWidth: '90%',
  },
  rescheduleAlertIcon: {
    fontSize: 24,
  },
  rescheduleAlertBody: {
    flex: 1,
  },
  rescheduleAlertTitle: {
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 4,
    fontSize: 14,
  },
  rescheduleAlertClient: {
    fontWeight: '600',
    color: '#78350f',
    marginBottom: 6,
    fontSize: 13,
  },
  rescheduleAlertClientName: {
    fontWeight: '700',
  },
  rescheduleAlertChanges: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    marginBottom: 4,
  },
  rescheduleAlertChange: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
  },
  rescheduleAlertLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  rescheduleAlertOld: {
    textDecorationLine: 'line-through',
    color: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rescheduleAlertNew: {
    color: '#16a34a',
    fontWeight: '600',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rescheduleAlertArrow: {
    color: '#9ca3af',
    fontSize: 12,
  },
  rescheduleAlertReason: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  rescheduleAlertClose: {
    padding: 4,
    borderRadius: 4,
  },
  rescheduleAlertBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#f59e0b',
    borderRadius: 0,
  },
});
