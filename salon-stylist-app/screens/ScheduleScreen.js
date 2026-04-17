import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';

const P = '#7C3AED';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
});

// Next 60 days for date picker
function getNext60Days() {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function ScheduleScreen({ route }) {
  const token = route?.params?.stylistToken || null;
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const [available, setAvailable]       = useState(true);
  const [workDays, setWorkDays]         = useState({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false });
  const [startHour, setStartHour]       = useState(9);
  const [endHour, setEndHour]           = useState(18);
  const [blockedDates, setBlockedDates] = useState([]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]     = useState(false);
  const [showDateModal, setShowDateModal]     = useState(false);

  // Load token + fetch availability on mount
  const loadData = useCallback(async () => {
    try {
      if (!token) { setLoading(false); return; }

      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/stylists/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailable(data.is_available);
        // Rebuild workDays map from comma-separated string
        const activeDays = (data.work_days || '').split(',').map(d => d.trim());
        const map = {};
        DAYS.forEach(d => { map[d] = activeDays.includes(d); });
        setWorkDays(map);
        setStartHour(data.start_hour ?? 9);
        setEndHour(data.end_hour ?? 18);
        setBlockedDates(data.blocked_dates || []);
      }
    } catch (e) {
      console.error('Error loading availability:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleDay = (day) => setWorkDays(prev => ({ ...prev, [day]: !prev[day] }));

  const toggleBlockDate = (date) => {
    setBlockedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const removeBlock = (date) => setBlockedDates(prev => prev.filter(d => d !== date));

  const saveSchedule = async () => {
    if (!token) { Alert.alert('Not logged in'); return; }
    setSaving(true);
    try {
      const api = await getApiUrlAsync();
      const work_days = DAYS.filter(d => workDays[d]).join(',');
      const res = await fetch(`${api}/api/stylists/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          is_available: available,
          work_days,
          start_hour: startHour,
          end_hour: endHour,
          blocked_dates: blockedDates,
        }),
      });
      if (res.ok) {
        Alert.alert('✅ Saved', 'Your availability has been updated.');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to save.');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={P} />
      </View>
    );
  }

  const next60 = getNext60Days();

  return (
    <ScrollView style={st.root} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={st.headerTitle}>My Schedule</Text>
        <Text style={st.headerSub}>Manage your availability</Text>
      </LinearGradient>

      <View style={st.body}>

        {/* ── Working Days ── */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Working Days</Text>
          <View style={st.card}>
            <View style={st.daysRow}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[st.dayBtn, workDays[day] && st.dayBtnActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[st.dayTxt, workDays[day] && st.dayTxtActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Working Hours ── */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Working Hours</Text>
          <View style={st.card}>
            {/* Start */}
            <TouchableOpacity style={st.timeRow} onPress={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}>
              <View style={st.rowLeft}>
                <View style={[st.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="sunny-outline" size={20} color={P} />
                </View>
                <Text style={st.rowTitle}>Start Time</Text>
              </View>
              <View style={st.timeBadge}>
                <Text style={st.timeBadgeTxt}>{HOURS[startHour]}</Text>
                <Ionicons name="chevron-down" size={14} color={P} />
              </View>
            </TouchableOpacity>

            {showStartPicker && (
              <ScrollView style={st.picker} nestedScrollEnabled>
                {HOURS.map((h, i) => (
                  <TouchableOpacity key={i} style={[st.pickerItem, startHour === i && st.pickerItemActive]}
                    onPress={() => { setStartHour(i); setShowStartPicker(false); }}>
                    <Text style={[st.pickerTxt, startHour === i && st.pickerTxtActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={st.divider} />

            {/* End */}
            <TouchableOpacity style={st.timeRow} onPress={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}>
              <View style={st.rowLeft}>
                <View style={[st.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="moon-outline" size={20} color={P} />
                </View>
                <Text style={st.rowTitle}>End Time</Text>
              </View>
              <View style={st.timeBadge}>
                <Text style={st.timeBadgeTxt}>{HOURS[endHour]}</Text>
                <Ionicons name="chevron-down" size={14} color={P} />
              </View>
            </TouchableOpacity>

            {showEndPicker && (
              <ScrollView style={st.picker} nestedScrollEnabled>
                {HOURS.map((h, i) => (
                  <TouchableOpacity key={i} style={[st.pickerItem, endHour === i && st.pickerItemActive]}
                    onPress={() => { setEndHour(i); setShowEndPicker(false); }}>
                    <Text style={[st.pickerTxt, endHour === i && st.pickerTxtActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* ── Blocked Dates ── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>Days Off / Blocked Dates</Text>
            <TouchableOpacity style={st.addBtn} onPress={() => setShowDateModal(true)}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={st.addBtnTxt}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={st.card}>
            {blockedDates.length === 0 ? (
              <View style={st.emptyBox}>
                <Ionicons name="calendar-outline" size={36} color="#D1D5DB" />
                <Text style={st.emptyTxt}>No blocked dates</Text>
              </View>
            ) : (
              blockedDates.sort().map(date => (
                <View key={date} style={st.blockRow}>
                  <View style={st.rowLeft}>
                    <Ionicons name="ban-outline" size={18} color="#EF4444" />
                    <Text style={st.blockDate}>{date}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeBlock(date)} style={st.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        <TouchableOpacity style={st.saveBtn} onPress={saveSchedule} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={st.saveBtnTxt}>Save Schedule</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* ── Date picker modal ── */}
      <Modal visible={showDateModal} animationType="slide" transparent onRequestClose={() => setShowDateModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Select Dates to Block</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)} style={st.modalClose}>
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {next60.map(date => {
                const blocked = blockedDates.includes(date);
                return (
                  <TouchableOpacity key={date} style={[st.dateRow, blocked && st.dateRowBlocked]} onPress={() => toggleBlockDate(date)}>
                    <Text style={[st.dateTxt, blocked && st.dateTxtBlocked]}>{date}</Text>
                    {blocked && <Ionicons name="checkmark-circle" size={18} color="#EF4444" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={st.modalDone} onPress={() => setShowDateModal(false)}>
              <Text style={st.modalDoneTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F3FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  section:     { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:{ fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 10 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowTitle:{ fontSize: 15, fontWeight: '700', color: '#1F2937' },
  rowSub:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' },
  dayBtnActive: { backgroundColor: P },
  dayTxt:       { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  dayTxtActive: { color: '#fff' },
  timeRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  timeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  timeBadgeTxt:{ fontSize: 13, fontWeight: '700', color: P },
  divider:    { height: 1, backgroundColor: '#F5F3FF', marginVertical: 12 },
  picker:     { maxHeight: 160, backgroundColor: '#F5F3FF', borderRadius: 10, marginTop: 8 },
  pickerItem:       { paddingVertical: 10, paddingHorizontal: 16 },
  pickerItemActive: { backgroundColor: '#EDE9FE' },
  pickerTxt:        { fontSize: 14, color: '#374151' },
  pickerTxtActive:  { color: P, fontWeight: '700' },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: P, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  blockRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F3FF' },
  blockDate: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 8 },
  removeBtn: { padding: 4 },
  emptyBox:  { alignItems: 'center', paddingVertical: 20 },
  emptyTxt:  { color: '#9CA3AF', marginTop: 8, fontSize: 13 },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: P, paddingVertical: 16, borderRadius: 16, marginBottom: 30, shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnTxt:{ color: '#fff', fontSize: 16, fontWeight: '800' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F5F3FF' },
  modalTitle:   { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  modalClose:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' },
  dateRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  dateRowBlocked: { backgroundColor: '#FEF2F2' },
  dateTxt:        { fontSize: 14, color: '#374151', fontWeight: '600' },
  dateTxtBlocked: { color: '#EF4444' },
  modalDone:    { margin: 16, backgroundColor: P, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalDoneTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
