import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import InAppNotificationManager from '../services/InAppNotificationManager';

const P = '#5B21B6';
const P2 = '#7C3AED';

export default function BookingConfirmScreen({ route, navigation }) {
  const { booking } = route.params || {};
  const { userToken } = useAppContext();

  // Support both single service (legacy) and multi-service
  const isMulti = Array.isArray(booking?.services) && booking.services.length > 0;
  const totalPrice = isMulti
    ? booking.total || booking.services.reduce((s, sv) => s + Number(sv.price), 0)
    : Number(booking?.service?.price || 0);

  const rows = [
    !isMulti && { icon: 'cut-outline', label: 'Service', val: booking?.service?.name },
    { icon: 'person-outline',   label: 'Stylist',  val: booking?.stylist?.name },
    { icon: 'calendar-outline', label: 'Date',     val: booking?.date },
    { icon: 'time-outline',     label: 'Time',     val: booking?.time },
    { icon: 'pricetag-outline', label: 'Total',    val: `₱${totalPrice.toLocaleString()}` },
    { icon: 'information-circle-outline', label: 'Status', val: booking?.status || 'Pending' },
  ].filter(Boolean);

  return (
    <View style={st.root}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Success hero */}
        <LinearGradient colors={['#3B0764', P, P2]} style={st.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={st.checkCircle}>
            <Ionicons name="checkmark" size={44} color={P} />
          </View>
          <Text style={st.heroTitle}>Booking Confirmed!</Text>
          <Text style={st.heroSub}>Your appointment has been successfully booked</Text>
        </LinearGradient>

        <View style={st.content}>
          {/* Booking ID */}
          <View style={st.idCard}>
            <Text style={st.idLabel}>Booking Reference</Text>
            <Text style={st.idVal}>#BK{Date.now().toString().slice(-6)}</Text>
          </View>

          {/* Summary card */}
          <View style={st.card}>
            <Text style={st.cardTitle}>Appointment Details</Text>
            {/* Multi-service list */}
            {isMulti && (
              <View style={{ marginBottom: 12 }}>
                <View style={st.row}>
                  <View style={st.rowLeft}>
                    <View style={st.rowIcon}><Ionicons name="cut-outline" size={16} color={P} /></View>
                    <Text style={st.rowLabel}>Services</Text>
                  </View>
                  <Text style={st.rowVal}>{booking.services.length} selected</Text>
                </View>
                {booking.services.map(svc => (
                  <View key={svc.id} style={st.svcLine}>
                    <View style={st.svcDot} />
                    <Text style={st.svcLineName}>{svc.name}</Text>
                    <Text style={st.svcLinePrice}>₱{Number(svc.price).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
            {rows.map(r => r.val ? (
              <View key={r.label} style={st.row}>
                <View style={st.rowLeft}>
                  <View style={st.rowIcon}><Ionicons name={r.icon} size={16} color={P} /></View>
                  <Text style={st.rowLabel}>{r.label}</Text>
                </View>
                <Text style={[st.rowVal, r.label === 'Status' && st.statusVal]}>{r.val}</Text>
              </View>
            ) : null)}
          </View>

          {/* Info note */}
          <View style={st.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
            <Text style={st.infoTxt}>You'll receive a reminder before your appointment. You can manage it in My Bookings.</Text>
          </View>

          {/* Test Reminder Button */}
          <TouchableOpacity 
            style={st.testReminderBtn}
            onPress={() => {
              const testAppointment = {
                id: `test-${Date.now()}`,
                date_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
                stylist_name: booking?.stylist?.name || 'Your Stylist'
              };
              InAppNotificationManager.addAppointment(testAppointment);
              Alert.alert('Test Reminder Set', 'This is a test notification to verify your reminder system is working! You will receive a reminder 1 hour before your appointment.');
            }}
          >
            <Ionicons name="test-outline" size={18} color="#6366F1" />
            <Text style={st.testReminderTxt}>🧪 Test Reminder Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={st.bottomBar}>
        <TouchableOpacity
          style={st.secBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="home-outline" size={18} color={P} />
          <Text style={st.secBtnTxt}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={st.primBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'MyBookings', params: { userToken } })}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={st.primBtnTxt}>My Appointments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F0FF' },
  hero: { paddingTop: 70, paddingBottom: 50, alignItems: 'center', paddingHorizontal: 20 },
  checkCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: P2, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },
  content:   { padding: 20 },
  idCard:    { backgroundColor: '#EDE9FE', borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#DDD6FE' },
  idLabel:   { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  idVal:     { fontSize: 22, fontWeight: '900', color: P2 },
  card:      { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginBottom: 14 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  rowLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon:   { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  rowLabel:  { fontSize: 13, color: '#6B7280' },
  rowVal:    { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },
  statusVal: { color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  infoNote:  { flexDirection: 'row', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  infoTxt:   { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 19 },
  testReminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  testReminderTxt: { flex: 1, fontSize: 13, color: '#4338CA', fontWeight: '600' },
  bottomBar: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  secBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: P2, paddingVertical: 14, borderRadius: 16 },
  secBtnTxt: { color: P2, fontSize: 14, fontWeight: '700' },
  primBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: P2, paddingVertical: 14, borderRadius: 16 },
  primBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  svcLine:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingLeft: 42 },
  svcDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: P2 },
  svcLineName: { flex: 1, fontSize: 13, color: '#374151' },
  svcLinePrice: { fontSize: 13, fontWeight: '700', color: P2 },
});