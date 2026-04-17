import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getApiUrlAsync } from '../config/api';
import InAppNotificationManager from '../services/InAppNotificationManager';
import { useAppContext } from '../context/AppContext';

const P = '#7C3AED';
const TIMES = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','4:00 PM'];

export default function BookingScreen({ route, navigation }) {
  const { stylist, service: preService } = route.params || {};
  const { userToken } = useAppContext();
  const [step, setStep]                 = useState(1); // 1=stylist 2=date 3=time 4=confirm
  const [services, setServices]         = useState([]);
  const [selectedService, setSelectedService] = useState(preService || null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!stylist?.id) { setLoading(false); return; }
    (async () => {
      try {
        const api = await getApiUrlAsync();
        const res = await fetch(`${api}/api/stylists/${stylist.id}/services`);
        if (res.ok) {
          const data = await res.json();
          setServices(data);
          if (preService) setSelectedService(preService);
          else if (data.length > 0) setSelectedService(data[0]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [stylist]);

  const formatDate = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const to24 = t => {
    const [time, mer] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedTime) {
      Alert.alert('Missing info', 'Please select a service and time slot.');
      return;
    }
    if (!userToken) {
      Alert.alert('Not logged in', 'Please log in to book.');
      return;
    }
    setSubmitting(true);
    try {
      const api = await getApiUrlAsync();
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dateTime = `${dateStr} ${to24(selectedTime)}`;
      const res = await fetch(`${api}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ stylist_id: stylist.id, service_id: selectedService.id, date_time: dateTime, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        InAppNotificationManager.addAppointment({ id: data.bookingId, date_time: dateTime, stylist_name: stylist.name });
        navigation.replace('BookingConfirmScreen', {
          booking: { service: selectedService, stylist, date: formatDate(selectedDate), time: selectedTime, notes, status: 'Pending' },
          userToken,
        });
      } else {
        Alert.alert('Error', data.message || 'Booking failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const StepDot = ({ n }) => (
    <View style={[st.stepDot, step >= n && st.stepDotActive]}>
      {step > n ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[st.stepNum, step >= n && st.stepNumActive]}>{n}</Text>}
    </View>
  );

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={P} /></View>;

  return (
    <View style={st.root}>
      {/* Header */}
      <LinearGradient colors={[P, '#A855F7']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Step indicator */}
      <View style={st.stepBar}>
        {[1,2,3,4].map((n, i) => (
          <View key={n} style={st.stepItem}>
            <StepDot n={n} />
            {i < 3 && <View style={[st.stepLine, step > n && st.stepLineActive]} />}
          </View>
        ))}
      </View>
      <View style={st.stepLabels}>
        {['Stylist','Date','Time','Confirm'].map(l => (
          <Text key={l} style={st.stepLabel}>{l}</Text>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Stylist card */}
        {stylist && (
          <View style={st.card}>
            <Text style={st.cardTitle}>Your Stylist</Text>
            <View style={st.stylistRow}>
              <LinearGradient colors={[P, '#A855F7']} style={st.styAv}>
                <Ionicons name="person" size={28} color="#fff" />
              </LinearGradient>
              <View style={st.styInfo}>
                <Text style={st.styName}>{stylist.name}</Text>
                <Text style={st.stySpec}>{stylist.specialization}</Text>
                <View style={st.styStars}>
                  {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={12} color="#FFC107" />)}
                  <Text style={st.styRating}>4.8</Text>
                </View>
              </View>
              <View style={st.availPill}>
                <View style={st.availDot} />
                <Text style={st.availTxt}>Available</Text>
              </View>
            </View>
          </View>
        )}

        {/* Service selection */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Select Service</Text>
          {services.length === 0 ? (
            <Text style={st.noTxt}>No services available</Text>
          ) : (
            services.map(svc => (
              <TouchableOpacity
                key={svc.id}
                style={[st.svcRow, selectedService?.id === svc.id && st.svcRowActive]}
                onPress={() => { setSelectedService(svc); setStep(Math.max(step, 2)); }}
              >
                <View style={[st.svcRadio, selectedService?.id === svc.id && st.svcRadioActive]}>
                  {selectedService?.id === svc.id && <View style={st.svcRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.svcName}>{svc.name}</Text>
                  <Text style={st.svcDur}>{svc.duration} min</Text>
                </View>
                <Text style={st.svcPrice}>₱{Number(svc.price).toLocaleString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Date */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Select Date</Text>
          <TouchableOpacity style={st.datePicker} onPress={() => setShowDatePicker(true)}>
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
              onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) { setSelectedDate(d); setStep(Math.max(step, 3)); } }}
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
                onPress={() => { setSelectedTime(t); setStep(Math.max(step, 4)); }}
              >
                <Text style={[st.timeTxt, selectedTime === t && st.timeTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Special Requests (optional)</Text>
          <TextInput
            style={st.notesInput}
            placeholder="Any special requests or notes…"
            placeholderTextColor="#bbb"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        {selectedService && selectedTime && (
          <View style={[st.card, st.summaryCard]}>
            <Text style={st.cardTitle}>Booking Summary</Text>
            {[
              { icon: 'cut-outline',      label: 'Service',  val: selectedService.name },
              { icon: 'person-outline',   label: 'Stylist',  val: stylist?.name || '—' },
              { icon: 'calendar-outline', label: 'Date',     val: formatDate(selectedDate) },
              { icon: 'time-outline',     label: 'Time',     val: selectedTime },
              { icon: 'pricetag-outline', label: 'Price',    val: `₱${Number(selectedService.price).toLocaleString()}` },
            ].map(row => (
              <View key={row.label} style={st.sumRow}>
                <View style={st.sumLeft}>
                  <Ionicons name={row.icon} size={16} color={P} />
                  <Text style={st.sumLabel}>{row.label}</Text>
                </View>
                <Text style={st.sumVal}>{row.val}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom confirm */}
      <View style={st.bottomBar}>
        {selectedService && (
          <View>
            <Text style={st.totalPrice}>₱{Number(selectedService.price).toLocaleString()}</Text>
            <Text style={st.totalLabel}>Total</Text>
          </View>
        )}
        <TouchableOpacity
          style={[st.confirmBtn, (!selectedService || !selectedTime || submitting) && st.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedService || !selectedTime || submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={st.confirmTxt}>Confirm Booking</Text>
            </>
          )}
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
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingTop: 16, backgroundColor: '#fff' },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: P },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  stepNumActive: { color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: P },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', flex: 1, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B', marginBottom: 14 },
  stylistRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  styAv:  { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  styInfo: { flex: 1 },
  styName: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  stySpec: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  styStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  styRating: { fontSize: 12, color: '#555', marginLeft: 4, fontWeight: '600' },
  availPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  availTxt: { fontSize: 11, color: '#16A34A', fontWeight: '700' },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 8 },
  svcRowActive: { borderColor: P, backgroundColor: '#F3E8FF' },
  svcRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  svcRadioActive: { borderColor: P },
  svcRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: P },
  svcName: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  svcDur:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  svcPrice: { fontSize: 15, fontWeight: '800', color: P },
  noTxt:   { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerTxt: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '600' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn:  { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  timeBtnActive: { backgroundColor: P, borderColor: P },
  timeTxt:  { fontSize: 13, color: '#374151', fontWeight: '600' },
  timeTxtActive: { color: '#fff' },
  notesInput: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14, color: '#333', minHeight: 80 },
  summaryCard: { borderWidth: 1.5, borderColor: '#E9D5FF' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sumLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sumLabel: { fontSize: 13, color: '#6B7280' },
  sumVal:  { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  totalPrice: { fontSize: 22, fontWeight: '800', color: P },
  totalLabel: { fontSize: 11, color: '#9CA3AF' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: P, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
