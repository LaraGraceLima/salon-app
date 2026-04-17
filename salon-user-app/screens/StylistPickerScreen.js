import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getApiUrlAsync } from '../config/api';
import { useAppContext } from '../context/AppContext';
import InAppNotificationManager from '../services/InAppNotificationManager';

const P = '#7C3AED';
const TIMES = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','4:00 PM'];

export default function StylistPickerScreen({ route, navigation }) {
  const { selectedServices = [] } = route.params || {};
  const { userToken } = useAppContext();

  const [stylists, setStylists]         = useState([]);
  const [selectedStylist, setStylist]   = useState(null);
  const [selectedDate, setDate]         = useState(new Date());
  const [selectedTime, setTime]         = useState('');
  const [notes, setNotes]               = useState('');
  const [showDatePicker, setShowDate]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [step, setStep]                 = useState(1); // 1=stylist 2=date 3=time

  const total    = selectedServices.reduce((s, sv) => s + Number(sv.price), 0);
  const duration = selectedServices.reduce((s, sv) => s + Number(sv.duration), 0);

  useEffect(() => {
    (async () => {
      try {
        const api = await getApiUrlAsync();
        const res = await fetch(`${api}/api/stylists`);
        if (res.ok) setStylists((await res.json()).filter(s => s.status === 'active'));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const formatDate = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const to24 = t => {
    const [time, mer] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const handleConfirm = async () => {
    if (!selectedStylist || !selectedTime) {
      Alert.alert('Missing info', 'Please select a stylist and time slot.');
      return;
    }
    if (!userToken) { Alert.alert('Not logged in', 'Please log in to book.'); return; }
    setSubmitting(true);
    try {
      const api = await getApiUrlAsync();
      const dateStr  = selectedDate.toISOString().split('T')[0];
      const dateTime = `${dateStr} ${to24(selectedTime)}`;

      // Post one booking per service
      const bookingIds = [];
      for (const svc of selectedServices) {
        const res = await fetch(`${api}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
          body: JSON.stringify({ stylist_id: selectedStylist.id, service_id: svc.id, date_time: dateTime, notes }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Booking failed', data.message || `Could not book ${svc.name}`);
          setSubmitting(false);
          return;
        }
        bookingIds.push(data.bookingId);
      }

      InAppNotificationManager.addAppointment({ id: bookingIds[0], date_time: dateTime, stylist_name: selectedStylist.name });

      navigation.replace('BookingConfirmScreen', {
        booking: {
          services: selectedServices,
          stylist: selectedStylist,
          date: formatDate(selectedDate),
          time: selectedTime,
          notes,
          status: 'Pending',
          total,
        },
        userToken,
      });
    } catch (e) {
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={P} /></View>;

  return (
    <View style={st.root}>
      <LinearGradient colors={[P, '#A855F7']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>

        {/* Selected services summary */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Selected Services ({selectedServices.length})</Text>
          {selectedServices.map(svc => (
            <View key={svc.id} style={st.svcRow}>
              <View style={st.svcDot} />
              <View style={{ flex: 1 }}>
                <Text style={st.svcName}>{svc.name}</Text>
                <Text style={st.svcMeta}>{svc.duration} min</Text>
              </View>
              <Text style={st.svcPrice}>₱{Number(svc.price).toLocaleString()}</Text>
            </View>
          ))}
          <View style={st.totalRow}>
            <Text style={st.totalLabel}>Total · ~{duration} min</Text>
            <Text style={st.totalVal}>₱{total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Stylist selection */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Choose a Stylist</Text>
          {stylists.length === 0 ? (
            <Text style={st.noTxt}>No stylists available</Text>
          ) : (
            stylists.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[st.stylistRow, selectedStylist?.id === s.id && st.stylistRowActive]}
                onPress={() => { setStylist(s); setStep(Math.max(step, 2)); }}
              >
                <LinearGradient colors={[P, '#A855F7']} style={st.styAv}>
                  <Ionicons name="person" size={22} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={st.styName}>{s.name}</Text>
                  <Text style={st.stySpec}>{s.specialization}</Text>
                </View>
                <View style={[st.radio, selectedStylist?.id === s.id && st.radioActive]}>
                  {selectedStylist?.id === s.id && <View style={st.radioDot} />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Date */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Select Date</Text>
          <TouchableOpacity style={st.datePicker} onPress={() => setShowDate(true)}>
            <Ionicons name="calendar-outline" size={20} color={P} />
            <Text style={st.datePickerTxt}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={18} color="#aaa" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(e, d) => {
                setShowDate(Platform.OS === 'ios');
                if (d) { setDate(d); setStep(Math.max(step, 3)); }
              }}
            />
          )}
        </View>

        {/* Time slots */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Select Time Slot</Text>
          <View style={st.timeGrid}>
            {TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[st.timeBtn, selectedTime === t && st.timeBtnActive]}
                onPress={() => setTime(t)}
              >
                <Text style={[st.timeTxt, selectedTime === t && st.timeTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Special Requests (optional)</Text>
          <View style={st.notesBox}>
            <Ionicons name="chatbubble-outline" size={16} color="#bbb" style={{ marginTop: 2 }} />
            <Text
              style={st.notesInput}
              onPress={() => {}}
            >
              {notes || 'Any special requests or notes…'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom bar */}
      <View style={st.bottomBar}>
        <View>
          <Text style={st.bottomTotal}>₱{total.toLocaleString()}</Text>
          <Text style={st.bottomSub}>{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[st.confirmBtn, (!selectedStylist || !selectedTime || submitting) && st.confirmBtnOff]}
          onPress={handleConfirm}
          disabled={!selectedStylist || !selectedTime || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={st.confirmTxt}>Confirm Booking</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F8F7FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B', marginBottom: 14 },
  // Services list
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  svcDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P },
  svcName: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  svcMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  svcPrice: { fontSize: 14, fontWeight: '800', color: P },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: '#E9D5FF' },
  totalLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  totalVal: { fontSize: 18, fontWeight: '800', color: P },
  // Stylist
  stylistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 8 },
  stylistRowActive: { borderColor: P, backgroundColor: '#F3E8FF' },
  styAv: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  styName: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  stySpec: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: P },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: P },
  noTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  // Date
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerTxt: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '600' },
  // Time
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn:  { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  timeBtnActive: { backgroundColor: P, borderColor: P },
  timeTxt:  { fontSize: 13, color: '#374151', fontWeight: '600' },
  timeTxtActive: { color: '#fff' },
  // Notes
  notesBox: { flexDirection: 'row', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 70 },
  notesInput: { flex: 1, fontSize: 14, color: '#bbb' },
  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  bottomTotal: { fontSize: 22, fontWeight: '800', color: P },
  bottomSub:   { fontSize: 11, color: '#9CA3AF' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: P, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  confirmBtnOff: { opacity: 0.5 },
  confirmTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
