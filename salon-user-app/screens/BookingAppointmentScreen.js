import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Image, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getApiUrlAsync } from '../config/api';
import { useAppContext } from '../context/AppContext';

const P = '#5B21B6';
const P2 = '#7C3AED';
const FALLBACK = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80';
const TIMES = [
  '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','4:00 PM',
];

// Day abbreviation map matching stylist app
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatPromoCountdown(endDate, nowMs = Date.now()) {
  if (!endDate) return 'No end date';
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 'No end date';

  const diffMs = end.getTime() - nowMs;
  if (diffMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

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

function toMinutes(t) {
  const [time, mer] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function BookingAppointmentScreen({ route, navigation }) {
  const { preloadStylist, preselectedService } = route.params || {};
  const { userToken } = useAppContext();

  const [services, setServices]     = useState([]);
  const [stylists, setStylists]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedStylist, setSelectedStylist]   = useState(preloadStylist || null);
  const [selectedDate, setSelectedDate]         = useState(new Date());
  const [selectedTime, setSelectedTime]         = useState('');
  const [notes, setNotes]                       = useState('');
  const [specialRequest, setSpecialRequest]     = useState('');
  const [referenceImages, setReferenceImages]   = useState([]); // array of base64 strings
  const [attachedImage, setAttachedImage]       = useState(null); // kept for legacy compat
  const [showDatePicker, setShowDatePicker]     = useState(false);
  const [takenSlots, setTakenSlots]             = useState(new Set());
  const [checkingSlots, setCheckingSlots]       = useState(false);
  const [stylistAvailability, setStylistAvailability] = useState(null);
  const [promos, setPromos]                     = useState([]);
  const [selectedPromo, setSelectedPromo]       = useState(null);
  const [promoTick, setPromoTick]               = useState(Date.now());

  const prettifyServiceName = (name) => {
    if (!name) return '';
    return String(name)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const fetchData = useCallback(async () => {
    try {
      const api = await getApiUrlAsync();
      const [sRes, stRes, pRes] = await Promise.all([
        fetch(`${api}/api/services`),
        fetch(`${api}/api/stylists`),
        fetch(`${api}/api/promos/active`),
      ]);
      if (sRes.ok)  setServices(await sRes.json());
      if (stRes.ok) setStylists((await stRes.json()).filter(s => s.status === 'active'));
      if (pRes.ok)  setPromos(await pRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!preselectedService || services.length === 0) return;
    const matched =
      services.find((s) => String(s.id) === String(preselectedService.id)) ||
      services.find((s) => String(s.name).toLowerCase() === String(preselectedService.name || '').toLowerCase());
    if (matched) {
      setSelectedServices([matched]);
    }
  }, [preselectedService, services]);

  useEffect(() => {
    // If user switches to today and selected time is already in the past, clear it.
    if (!selectedTime) return;
    const now = new Date();
    const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();
    if (!isToday) return;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (toMinutes(selectedTime) <= nowMinutes) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    const checkTakenSlots = async () => {
      if (!selectedStylist?.id || !selectedDate) {
        setTakenSlots(new Set());
        setStylistAvailability(null);
        return;
      }

      setCheckingSlots(true);
      try {
        const api = await getApiUrlAsync();
        const dateStr = selectedDate.toISOString().split('T')[0];

        // Fetch availability + conflict checks in parallel
        const [availRes, ...conflictResults] = await Promise.all([
          fetch(`${api}/api/stylists/${selectedStylist.id}/availability`),
          ...TIMES.map(async (t) => {
            const hhmm = to24(t);
            const res = await fetch(
              `${api}/api/bookings/check-conflict?date=${dateStr}&time=${hhmm}&stylistId=${selectedStylist.id}`
            );
            if (!res.ok) return { time: t, conflict: false };
            const data = await res.json();
            return { time: t, conflict: !!data.conflict };
          })
        ]);

        if (availRes.ok) {
          const avail = await availRes.json();
          setStylistAvailability(avail);
        }

        const nextTaken = new Set(conflictResults.filter(c => c.conflict).map(c => c.time));
        setTakenSlots(nextTaken);

        if (selectedTime && nextTaken.has(selectedTime)) {
          setSelectedTime('');
          Alert.alert('Time slot taken', 'That time is already booked for this stylist. Please choose another time.');
        }
      } catch (e) {
        console.error('Failed to check slot conflicts:', e);
        setTakenSlots(new Set());
      } finally {
        setCheckingSlots(false);
      }
    };

    checkTakenSlots();
  }, [selectedStylist, selectedDate]);

  useEffect(() => {
    if (showDatePicker) return undefined;
    const timer = setInterval(() => setPromoTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [showDatePicker]);

  const toggleService = (svc) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
    );
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const promoDiscountPercent = selectedPromo ? Number(selectedPromo.discount_percentage || 0) : 0;
  const discountAmount = totalPrice * (promoDiscountPercent / 100);
  const discountedTotal = Math.max(0, totalPrice - discountAmount);
  const todayStart = startOfDay(new Date());

  const pickReferenceImage = async () => {
    if (referenceImages.length >= 3) {
      Alert.alert('Limit reached', 'You can attach up to 3 reference images.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach reference images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Use base64 if available, otherwise read from URI
      let b64 = asset.base64;
      if (!b64) {
        b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      }
      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      setReferenceImages(prev => [...prev, `data:${mime};base64,${b64}`]);
    }
  };

  const removeReferenceImage = (idx) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBook = async () => {
    if (selectedServices.length === 0) return Alert.alert('Select a service', 'Pick at least one service.');
    if (!selectedStylist) return Alert.alert('Select a stylist', 'Please choose a stylist.');
    if (!selectedTime) return Alert.alert('Select a time', 'Please pick a time slot.');
    if (takenSlots.has(selectedTime)) {
      return Alert.alert('Time slot taken', 'That time is already booked for this stylist. Please choose another time.');
    }
    if (!userToken) return Alert.alert('Not logged in', 'Please log in to book.');

    setSubmitting(true);
    try {
      const api = await getApiUrlAsync();
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dateTime = `${dateStr} ${to24(selectedTime)}`;

      const results = await Promise.all(
        selectedServices.map(svc =>
          fetch(`${api}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
            body: JSON.stringify({
              stylist_id: selectedStylist.id,
              service_id: svc.id,
              date_time: dateTime,
              notes: notes || '',
              special_request: specialRequest || null,
              reference_images: referenceImages.length > 0 ? referenceImages : null,
              reference_image: referenceImages[0] || null,
              promo_id: selectedPromo?.id || null,
              promo_discount_percentage: promoDiscountPercent || null,
            }),
          }).then(async r => {
            const data = await r.json();
            return { ok: r.ok, ...data };
          })
        )
      );

      const allOk = results.every(r => r.ok || r.bookingId || r.id);
      if (allOk) {
        setSelectedServices([]);
        setSelectedStylist(null);
        setSelectedTime('');
        setNotes('');
        setSpecialRequest('');
        setReferenceImages([]);
        setSelectedPromo(null);
        Alert.alert(
          '🎉 Booked!',
          `${selectedServices.length} appointment${selectedServices.length > 1 ? 's' : ''} confirmed.`,
          [
            {
              text: 'View My Bookings',
              onPress: () => navigation.navigate('MainTabs', { screen: 'MyBookings', params: { userToken } }),
            },
            {
              text: 'Add Another Booking',
              onPress: () => navigation.replace('BookingAppointmentScreen', { preloadStylist: null }),
            },
          ]
        );
      } else {
        const failed = results.filter(r => !r.ok && !r.bookingId && !r.id);
        const msg = failed[0]?.message || 'Some bookings failed. Please try again.';
        Alert.alert('Booking Error', msg);
      }
    } catch {
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <View style={st.center}><ActivityIndicator size="large" color={P} /></View>
  );

  return (
    <View style={st.root}>
      {/* Header */}
      <LinearGradient colors={['#3B0764', P, P2]} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── STEP 1: Services ── */}
        <View style={st.card}>
          <View style={st.stepRow}>
            <View style={st.stepDot}><Text style={st.stepDotTxt}>1</Text></View>
            <Text style={st.stepTitle}>Choose Services</Text>
            {selectedServices.length > 0 && (
              <View style={st.badge}><Text style={st.badgeTxt}>{selectedServices.length} selected</Text></View>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {services.map(svc => {
              const active = !!selectedServices.find(s => s.id === svc.id);
              return (
                <TouchableOpacity key={svc.id} style={[st.svcChip, active && st.svcChipActive]} onPress={() => toggleService(svc)} activeOpacity={0.8}>
                  <Image source={{ uri: svc.service_image_url || FALLBACK }} style={st.svcChipImg} />
                  <LinearGradient colors={active ? [`${P}cc`, `${P2}cc`] : ['rgba(0,0,0,0.25)','rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                  {active && <View style={st.svcCheck}><Ionicons name="checkmark-circle" size={20} color="#fff" /></View>}
                  <View style={st.svcChipBody}>
                  <Text style={st.svcChipName} numberOfLines={1}>{prettifyServiceName(svc.name)}</Text>
                    <Text style={st.svcChipPrice}>₱{Number(svc.price).toLocaleString()}</Text>
                    <Text style={st.svcChipDur}>{svc.duration} min</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedServices.length > 0 && (
            <View style={st.tagRow}>
              {selectedServices.map(s => (
                <View key={s.id} style={st.tag}>
                  <Text style={st.tagTxt}>{prettifyServiceName(s.name)}</Text>
                  <TouchableOpacity onPress={() => toggleService(s)}>
                    <Ionicons name="close-circle" size={15} color={P} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── STEP 2: Stylist ── */}
        <View style={st.card}>
          <View style={st.stepRow}>
            <View style={st.stepDot}><Text style={st.stepDotTxt}>2</Text></View>
            <Text style={st.stepTitle}>Choose Stylist</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {stylists.map(sty => {
              const active = selectedStylist?.id === sty.id;
              return (
                <TouchableOpacity key={sty.id} style={[st.styChip, active && st.styChipActive]} onPress={() => setSelectedStylist(active ? null : sty)} activeOpacity={0.8}>
                  <LinearGradient colors={active ? [P, P2] : ['#E9D5FF','#DDD6FE']} style={st.styAv}>
                    <Ionicons name="person" size={22} color={active ? '#fff' : P} />
                  </LinearGradient>
                  <Text style={[st.styName, active && { color: P }]} numberOfLines={1}>{sty.name}</Text>
                  <Text style={st.stySpec} numberOfLines={1}>{sty.specialization}</Text>
                  {active && <Ionicons name="checkmark-circle" size={15} color={P} style={{ marginTop: 4 }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── STEP 3: Date ── */}
        <View style={st.card}>
          <View style={st.stepRow}>
            <View style={st.stepDot}><Text style={st.stepDotTxt}>3</Text></View>
            <Text style={st.stepTitle}>Choose Date</Text>
          </View>
          <TouchableOpacity style={st.datePicker} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={P} />
            <Text style={st.datePickerTxt}>{fmtDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={18} color="#aaa" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={todayStart}
              onChange={(e, d) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (!d || e?.type === 'dismissed') return;
                const picked = startOfDay(d);
                if (picked < todayStart) {
                  Alert.alert('Invalid date', 'You cannot book a past date.');
                  setSelectedDate(todayStart);
                  return;
                }
                setSelectedDate(picked);
              }}
            />
          )}
        </View>

        {/* ── STEP 4: Time ── */}
        <View style={st.card}>
          <View style={st.stepRow}>
            <View style={st.stepDot}><Text style={st.stepDotTxt}>4</Text></View>
            <Text style={st.stepTitle}>Choose Time Slot</Text>
          </View>
          <View style={st.timeGrid}>
            {TIMES.map(t => {
              const now = new Date();
              const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();
              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              const isPastTime = isToday && toMinutes(t) <= nowMinutes;
              const isTaken = takenSlots.has(t);

              // Check stylist availability
              const avail = stylistAvailability;
              const stylistOff = avail && !avail.is_available;
              const dateStr = selectedDate.toISOString().split('T')[0];
              const isBlockedDate = avail && (avail.blocked_dates || []).includes(dateStr);
              const dayAbbr = DAY_ABBR[selectedDate.getDay()];
              const isOffDay = avail && !(avail.work_days || '').split(',').map(d => d.trim()).includes(dayAbbr);
              const slotMinutes = toMinutes(t);
              const startMinutes = avail ? (avail.start_hour || 9) * 60 : 0;
              const endMinutes   = avail ? (avail.end_hour   || 18) * 60 : 24 * 60;
              const outsideHours = avail && (slotMinutes < startMinutes || slotMinutes >= endMinutes);

              const unavailable = stylistOff || isBlockedDate || isOffDay || outsideHours;
              const disabled = isPastTime || isTaken || unavailable;

              let label = t;
              let reasonStyle = null;
              if (isTaken) { label = `${t} (Taken)`; reasonStyle = st.timeTxtTaken; }
              else if (unavailable) { label = `${t} (Unavailable)`; reasonStyle = st.timeTxtUnavail; }

              return (
                <TouchableOpacity
                  key={t}
                  style={[st.timeBtn, selectedTime === t && st.timeBtnActive, disabled && st.timeBtnDisabled, isTaken && st.timeBtnTaken, unavailable && !isTaken && st.timeBtnUnavail]}
                  onPress={() => !disabled && setSelectedTime(t)}
                  disabled={disabled}
                >
                  <Text style={[st.timeTxt, selectedTime === t && st.timeTxtActive, reasonStyle]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {checkingSlots && (
            <Text style={st.slotsInfo}>Checking available slots...</Text>
          )}
          {!checkingSlots && selectedStylist && stylistAvailability && !stylistAvailability.is_available && (
            <Text style={[st.slotsInfo, { color: '#EF4444' }]}>This stylist is currently not accepting bookings.</Text>
          )}
          {!checkingSlots && selectedStylist && (
            <Text style={st.slotsInfo}>Grey = unavailable · Red = taken</Text>
          )}
        </View>

        {/* ── STEP 5: Special Request + Reference Images ── */}
        <View style={st.card}>
          <View style={st.stepRow}>
            <View style={[st.stepDot, { backgroundColor: '#E5E7EB' }]}><Text style={[st.stepDotTxt, { color: '#6B7280' }]}>5</Text></View>
            <Text style={st.stepTitle}>Special Requests <Text style={st.optTxt}>(optional)</Text></Text>
          </View>
          <TextInput
            style={st.notesInput}
            placeholder="Any special requests, notes, or preferences…"
            placeholderTextColor="#bbb"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Special request text */}
          <Text style={st.refLabel}>Describe your desired look</Text>
          <TextInput
            style={[st.notesInput, { marginTop: 0, minHeight: 60 }]}
            placeholder="e.g. I want balayage highlights, medium length, layered…"
            placeholderTextColor="#bbb"
            value={specialRequest}
            onChangeText={setSpecialRequest}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          {/* Reference images */}
          <View style={st.refRow}>
            <Text style={st.refLabel}>Reference Images <Text style={st.optTxt}>(up to 3)</Text></Text>
            {referenceImages.length < 3 && (
              <TouchableOpacity style={st.attachBtn} onPress={pickReferenceImage}>
                <Ionicons name="image-outline" size={18} color={P} />
                <Text style={st.attachTxt}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
          {referenceImages.length > 0 && (
            <View style={st.refImagesRow}>
              {referenceImages.map((img, idx) => (
                <View key={idx} style={st.attachedWrap}>
                  <Image source={{ uri: img }} style={st.attachedImg} />
                  <TouchableOpacity style={st.removeImg} onPress={() => removeReferenceImage(idx)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── SUMMARY ── */}
        {(selectedServices.length > 0 || selectedStylist || selectedTime) && (
          <View style={st.summary}>
            <Text style={st.summaryTitle}>Booking Summary</Text>
            {selectedServices.length > 0 && (
              <View style={st.sumRow}>
                <Text style={st.sumLabel}>Services</Text>
                <Text style={st.sumVal}>{selectedServices.map(s => prettifyServiceName(s.name)).join(', ')}</Text>
              </View>
            )}
            {selectedStylist && (
              <View style={st.sumRow}>
                <Text style={st.sumLabel}>Stylist</Text>
                <Text style={st.sumVal}>{selectedStylist.name}</Text>
              </View>
            )}
            {selectedTime && (
              <View style={st.sumRow}>
                <Text style={st.sumLabel}>Date & Time</Text>
                <Text style={st.sumVal}>{fmtDate(selectedDate)} · {selectedTime}</Text>
              </View>
            )}
            {selectedServices.length > 0 && (
              <View style={st.sumRow}>
                <Text style={st.sumLabel}>Subtotal</Text>
                <Text style={st.sumVal}>₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            )}
            {selectedPromo && selectedServices.length > 0 && (
              <View style={st.sumRow}>
                <Text style={st.sumLabel}>Promo Discount ({promoDiscountPercent}%)</Text>
                <Text style={st.sumVal}>- ₱{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            )}
            {selectedServices.length > 0 && (
              <View style={[st.sumRow, st.totalRow]}>
                <Text style={st.totalLabel}>Total Amount</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  {selectedPromo ? (
                    <>
                      <Text style={st.totalOriginalPrice}>₱{totalPrice.toLocaleString()}</Text>
                      <Text style={st.totalPrice}>₱{discountedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </>
                  ) : (
                    <Text style={st.totalPrice}>₱{totalPrice.toLocaleString()}</Text>
                  )}
                </View>
              </View>
            )}
            {selectedPromo && (
              <View style={st.sumRow}>
                <Text style={st.sumLabel}>Promo</Text>
                <Text style={st.sumVal}>{selectedPromo.title} ({promoDiscountPercent}% OFF applied)</Text>
              </View>
            )}
          </View>
        )}

        {/* ── PROMOS ── */}
        {promos.length > 0 && (
          <View style={st.card}>
            <View style={st.stepRow}>
              <View style={st.stepDot}><Text style={st.stepDotTxt}>6</Text></View>
              <Text style={st.stepTitle}>Promos Offer</Text>
            </View>
            {promos.map((promo) => {
              const active = selectedPromo?.id === promo.id;
              const promoPct = Number(promo.discount_percentage || 0);
              const promoDiscountValue = totalPrice * (promoPct / 100);
              const promoTotal = Math.max(0, totalPrice - promoDiscountValue);
              return (
                <View key={promo.id} style={[st.promoCard, active && st.promoCardActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.promoTitle}>{promo.title}</Text>
                    <Text style={st.promoDesc}>{promo.discount_percentage}% OFF</Text>
                    <Text style={st.promoTimer}>⏰ Promo ends in: {formatPromoCountdown(promo.end_date, promoTick)}</Text>
                    {totalPrice > 0 && (
                      <View style={st.promoAmountBox}>
                        <Text style={st.promoAmountLine}>Subtotal: ₱{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        <Text style={st.promoAmountLine}>Discount ({promoPct}%): - ₱{promoDiscountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        <Text style={st.promoAmountTotal}>Total Amount: ₱{promoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[st.applyPromoBtn, active && st.applyPromoBtnActive]}
                    onPress={() => setSelectedPromo(active ? null : promo)}
                  >
                    <Text style={[st.applyPromoTxt, active && st.applyPromoTxtActive]}>
                      {active ? `${promo.discount_percentage}% OFF applied` : 'Apply Promo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ── BOOK BUTTON ── */}
        <TouchableOpacity
          style={[st.bookBtn, (submitting || !selectedServices.length || !selectedStylist || !selectedTime) && st.bookBtnOff]}
          onPress={handleBook}
          disabled={submitting || !selectedServices.length || !selectedStylist || !selectedTime}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[P, P2]} style={st.bookBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={st.bookBtnTxt}>
                    Confirm Booking{selectedServices.length > 1 ? ` (${selectedServices.length})` : ''} · ₱{(selectedPromo ? discountedTotal : totalPrice).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: selectedPromo ? 2 : 0 })}
                  </Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F0FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  stepDot:   { width: 26, height: 26, borderRadius: 13, backgroundColor: P, justifyContent: 'center', alignItems: 'center' },
  stepDotTxt:{ color: '#fff', fontSize: 12, fontWeight: '800' },
  stepTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B', flex: 1 },
  optTxt:    { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  badge:     { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeTxt:  { fontSize: 11, color: P, fontWeight: '700' },

  // Service chips
  svcChip:     { width: 120, height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  svcChipActive: { borderColor: P },
  svcChipImg:  { width: '100%', height: '100%', position: 'absolute' },
  svcCheck:    { position: 'absolute', top: 8, right: 8 },
  svcChipBody: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  svcChipName: { color: '#fff', fontSize: 12, fontWeight: '800' },
  svcChipPrice:{ color: '#E9D5FF', fontSize: 11, fontWeight: '700', marginTop: 2 },
  svcChipDur:  { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagTxt: { fontSize: 12, color: P, fontWeight: '600' },

  // Stylist chips
  styChip:     { width: 88, alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB' },
  styChipActive: { borderColor: P, backgroundColor: '#F5F3FF' },
  styAv:       { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  styName:     { fontSize: 11, fontWeight: '700', color: '#1E1B4B', textAlign: 'center' },
  stySpec:     { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },

  // Date
  datePicker:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerTxt: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },

  // Time
  timeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn:       { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  timeBtnActive: { backgroundColor: P, borderColor: P },
  timeBtnDisabled: { opacity: 0.4 },
  timeBtnTaken:   { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  timeBtnUnavail: { borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' },
  timeTxt:       { fontSize: 13, color: '#374151', fontWeight: '600' },
  timeTxtActive: { color: '#fff' },
  timeTxtTaken:   { color: '#B91C1C' },
  timeTxtUnavail: { color: '#9CA3AF' },
  slotsInfo: { marginTop: 10, fontSize: 12, color: '#6B7280' },

  // Notes
  notesInput: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14, color: '#333', minHeight: 80 },
  attachBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#EDE9FE', backgroundColor: '#F5F3FF', alignSelf: 'flex-start' },
  attachTxt:    { fontSize: 13, color: P, fontWeight: '600' },
  refRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 4 },
  refLabel:     { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 6 },
  refImagesRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  attachedWrap: { position: 'relative' },
  attachedImg:  { width: 100, height: 80, borderRadius: 12 },
  removeImg:    { position: 'absolute', top: -8, right: -8 },
  // Summary
  summary:      { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1.5, borderColor: '#EDE9FE' },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#1E1B4B', marginBottom: 12 },
  sumRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLabel:     { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  sumVal:       { fontSize: 12, color: '#374151', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 },
  totalRow:     { borderTopWidth: 1, borderTopColor: '#EDE9FE', paddingTop: 10, marginTop: 4 },
  totalLabel:   { fontSize: 14, fontWeight: '800', color: '#1E1B4B' },
  totalOriginalPrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through', marginBottom: 2 },
  totalPrice:   { fontSize: 18, fontWeight: '800', color: P },

  // Promos
  promoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#EDE9FE', borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#FAF5FF' },
  promoCardActive: { borderColor: P, backgroundColor: '#F3E8FF' },
  promoTitle: { fontSize: 13, fontWeight: '800', color: '#1E1B4B' },
  promoDesc: { fontSize: 12, fontWeight: '700', color: P, marginTop: 2 },
  promoTimer: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  promoAmountBox: { marginTop: 8, backgroundColor: '#F3E8FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  promoAmountLine: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  promoAmountTotal: { fontSize: 12, color: '#1E1B4B', fontWeight: '800', marginTop: 4 },
  applyPromoBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EDE9FE' },
  applyPromoBtnActive: { backgroundColor: P },
  applyPromoTxt: { fontSize: 11, color: P, fontWeight: '800' },
  applyPromoTxtActive: { color: '#fff' },

  // Book button
  bookBtn:     { borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
  bookBtnOff:  { opacity: 0.5 },
  bookBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  bookBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});
