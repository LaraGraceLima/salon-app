import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Modal, TextInput,
  Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { getApiUrlAsync } from '../config/api';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');
const FALLBACK = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80';
const P  = '#7C3AED';
const P2 = '#A855F7';

const TIMES = [
  '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','4:00 PM',
];

function to24(t) {
  const [time, mer] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ServiceDetailsScreen({ route, navigation }) {
  const { service } = route.params || {};
  const { userToken } = useAppContext();

  const [stylists, setStylists]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Booking form
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate]       = useState(new Date());
  const [selectedTime, setSelectedTime]       = useState('');
  const [notes, setNotes]                     = useState('');
  const [attachedImage, setAttachedImage]     = useState(null);
  const [showDatePicker, setShowDatePicker]   = useState(false);

  useEffect(() => {
    if (!service) return;
    (async () => {
      try {
        const api = await getApiUrlAsync();
        const res = await fetch(`${api}/api/stylists`);
        if (res.ok) setStylists((await res.json()).filter(s => s.status === 'active'));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [service]);

  const handleBook = async () => {
    if (!selectedStylist) return Alert.alert('Select a stylist', 'Please choose a stylist.');
    if (!selectedTime)    return Alert.alert('Select a time', 'Please pick a time slot.');
    if (!userToken)       return Alert.alert('Not logged in', 'Please log in to book.');

    setSubmitting(true);
    try {
      const api = await getApiUrlAsync();
      const dateStr  = selectedDate.toISOString().split('T')[0];
      const dateTime = `${dateStr} ${to24(selectedTime)}`;
      const res = await fetch(`${api}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ stylist_id: selectedStylist.id, service_id: service.id, date_time: dateTime, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setSelectedStylist(null); setSelectedTime(''); setNotes('');
        Alert.alert('🎉 Booked!', 'Your appointment has been confirmed.', [
          { text: 'View Bookings', onPress: () => navigation.navigate('MainTabs', { screen: 'MyBookings' }) },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Booking failed.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (!service) return (
    <View style={st.center}><Text style={st.errTxt}>Service not found</Text></View>
  );

  return (
    <View style={st.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── HERO IMAGE ── */}
        <View style={st.heroWrap}>
          <Image source={{ uri: service.service_image_url || FALLBACK }} style={st.heroImg} />
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(20,0,50,0.7)']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={st.heroBottom}>
            <View style={st.heroPriceBadge}>
              <Text style={st.heroPriceTxt}>₱{Number(service.price).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={st.content}>

          {/* ── TITLE & META ── */}
          <Text style={st.svcName}>{service.name}</Text>

          <View style={st.metaRow}>
            <View style={st.metaChip}>
              <Ionicons name="time-outline" size={15} color={P} />
              <Text style={st.metaChipTxt}>{service.duration} min</Text>
            </View>
            <View style={st.metaChip}>
              <Ionicons name="pricetag-outline" size={15} color={P} />
              <Text style={st.metaChipTxt}>₱{Number(service.price).toLocaleString()}</Text>
            </View>
            <View style={[st.metaChip, { backgroundColor: '#DCFCE7' }]}>
              <View style={st.availDot} />
              <Text style={[st.metaChipTxt, { color: '#16A34A' }]}>Available</Text>
            </View>
          </View>

          {/* ── ABOUT ── */}
          <View style={st.card}>
            <View style={st.cardTitleRow}>
              <View style={st.cardTitleIcon}>
                <Ionicons name="information-circle-outline" size={18} color={P} />
              </View>
              <Text style={st.cardTitle}>About this Service</Text>
            </View>
            <Text style={st.desc}>
              {service.description || 'A professional salon service designed to give you the best experience. Our skilled stylists will ensure you leave looking and feeling your best.'}
            </Text>
          </View>

          {/* ── WHAT'S INCLUDED ── */}
          <View style={st.card}>
            <View style={st.cardTitleRow}>
              <View style={st.cardTitleIcon}>
                <Ionicons name="checkmark-circle-outline" size={18} color={P} />
              </View>
              <Text style={st.cardTitle}>What's Included</Text>
            </View>
            {[
              'Professional consultation',
              'Premium products used',
              `${service.duration} minutes of dedicated service`,
              'Aftercare advice',
            ].map((item, i) => (
              <View key={i} style={st.includeRow}>
                <View style={st.includeDot} />
                <Text style={st.includeTxt}>{item}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={st.bottomBar}>
        <View>
          <Text style={st.bottomPrice}>₱{Number(service.price).toLocaleString()}</Text>
          <Text style={st.bottomDur}>{service.duration} minutes</Text>
        </View>
        <TouchableOpacity style={st.bookBtn} onPress={() => setShowModal(true)} activeOpacity={0.88}>
          <LinearGradient colors={[P, P2]} style={st.bookBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={st.bookBtnTxt}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── BOOKING MODAL ── */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={st.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={st.sheet}>
              <View style={st.sheetHandle} />

              {/* Sheet header */}
              <View style={st.sheetHeader}>
                <View>
                  <Text style={st.sheetTitle}>Book Appointment</Text>
                  <Text style={st.sheetSub}>{service.name} · ₱{Number(service.price).toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={st.closeBtn} onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                {/* Choose Stylist */}
                <Text style={st.sectionLbl}>Choose Stylist</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                  {stylists.map(sty => {
                    const active = selectedStylist?.id === sty.id;
                    return (
                      <TouchableOpacity
                        key={sty.id}
                        style={[st.styChip, active && st.styChipActive]}
                        onPress={() => setSelectedStylist(active ? null : sty)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={active ? [P, P2] : ['#E9D5FF','#DDD6FE']} style={st.styChipAv}>
                          <Ionicons name="person" size={18} color={active ? '#fff' : P} />
                        </LinearGradient>
                        <Text style={[st.styChipName, active && { color: P }]} numberOfLines={1}>{sty.name}</Text>
                        <Text style={st.styChipSpec} numberOfLines={1}>{sty.specialization}</Text>
                        {active && <Ionicons name="checkmark-circle" size={14} color={P} style={{ marginTop: 3 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Choose Date */}
                <Text style={st.sectionLbl}>Choose Date</Text>
                <TouchableOpacity style={st.datePicker} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={P} />
                  <Text style={st.datePickerTxt}>{fmtDate(selectedDate)}</Text>
                  <Ionicons name="chevron-down" size={16} color="#aaa" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setSelectedDate(d); }}
                  />
                )}

                {/* Choose Time */}
                <Text style={st.sectionLbl}>Choose Time Slot</Text>
                <View style={st.timeGrid}>
                  {TIMES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[st.timeBtn, selectedTime === t && st.timeBtnActive]}
                      onPress={() => setSelectedTime(t)}
                    >
                      <Text style={[st.timeTxt, selectedTime === t && st.timeTxtActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Special Request */}
                <Text style={st.sectionLbl}>Special Requests <Text style={st.optTxt}>(optional)</Text></Text>
                <TextInput
                  style={st.notesInput}
                  placeholder="Any notes, preferences, or reference details…"
                  placeholderTextColor="#bbb"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Attach Image */}
                <TouchableOpacity
                  style={st.attachBtn}
                  onPress={async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to attach an image.'); return; }
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                    if (!result.canceled) setAttachedImage(result.assets[0].uri);
                  }}
                >
                  <Ionicons name="image-outline" size={18} color={P} />
                  <Text style={st.attachTxt}>
                    {attachedImage ? 'Change Reference Image' : 'Attach Reference Image'}
                  </Text>
                </TouchableOpacity>
                {attachedImage && (
                  <View style={st.attachedWrap}>
                    <Image source={{ uri: attachedImage }} style={st.attachedImg} />
                    <TouchableOpacity style={st.removeImg} onPress={() => setAttachedImage(null)}>
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Confirm */}
                <TouchableOpacity
                  style={[st.confirmBtn, (!selectedStylist || !selectedTime || submitting) && st.confirmBtnOff]}
                  onPress={handleBook}
                  disabled={!selectedStylist || !selectedTime || submitting}
                  activeOpacity={0.88}
                >
                  <LinearGradient colors={[P, P2]} style={st.confirmBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {submitting
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                          <Text style={st.confirmBtnTxt}>Confirm Booking</Text>
                        </>
                    }
                  </LinearGradient>
                </TouchableOpacity>

              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F3FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errTxt: { color: '#999', fontSize: 16 },

  // Hero
  heroWrap:    { height: 300, position: 'relative' },
  heroImg:     { width: '100%', height: '100%' },
  backBtn:     { position: 'absolute', top: 50, left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  heroBottom:  { position: 'absolute', bottom: 16, left: 16 },
  heroPriceBadge: { backgroundColor: P, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  heroPriceTxt:   { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Content
  content:  { padding: 20 },
  svcName:  { fontSize: 26, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5, marginBottom: 14 },

  metaRow:  { flexDirection: 'row', gap: 10, marginBottom: 22, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDE9FE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 25 },
  metaChipTxt: { fontSize: 13, color: P, fontWeight: '700' },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },

  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitleIcon:{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  desc:         { fontSize: 14, color: '#6B7280', lineHeight: 22 },

  includeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  includeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P },
  includeTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },

  noTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },

  // Bottom bar
  bottomBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 10 },
  bottomPrice: { fontSize: 22, fontWeight: '900', color: P },
  bottomDur:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  bookBtn:     { borderRadius: 16, overflow: 'hidden' },
  bookBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  bookBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Modal / Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: height * 0.88 },
  sheetHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle:   { fontSize: 20, fontWeight: '900', color: '#1E1B4B' },
  sheetSub:     { fontSize: 13, color: '#9CA3AF', marginTop: 3 },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

  sectionLbl: { fontSize: 13, fontWeight: '800', color: '#1E1B4B', marginBottom: 10, marginTop: 16 },
  optTxt:     { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },

  styChip:      { width: 82, alignItems: 'center', padding: 10, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB' },
  styChipActive:{ borderColor: P, backgroundColor: '#F5F3FF' },
  styChipAv:    { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  styChipName:  { fontSize: 11, fontWeight: '700', color: '#1E1B4B', textAlign: 'center' },
  styChipSpec:  { fontSize: 9, color: '#9CA3AF', textAlign: 'center', marginTop: 1 },

  datePicker:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerTxt: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },

  timeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn:       { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  timeBtnActive: { backgroundColor: P, borderColor: P },
  timeTxt:       { fontSize: 12, color: '#374151', fontWeight: '600' },
  timeTxtActive: { color: '#fff' },

  notesInput:  { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14, color: '#333', minHeight: 80 },

  attachBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#EDE9FE', backgroundColor: '#F5F3FF', alignSelf: 'flex-start' },
  attachTxt:    { fontSize: 13, color: P, fontWeight: '600' },
  attachedWrap: { marginTop: 12, position: 'relative', alignSelf: 'flex-start' },
  attachedImg:  { width: 120, height: 90, borderRadius: 12 },
  removeImg:    { position: 'absolute', top: -8, right: -8 },

  confirmBtn:     { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  confirmBtnOff:  { opacity: 0.5 },
  confirmBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  confirmBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});
