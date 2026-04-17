import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  Platform, useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import InAppNotificationManager from '../services/InAppNotificationManager';
import { useAppContext } from '../context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const P = '#5B21B6';
const P2 = '#7C3AED';
const TABS = ['Upcoming', 'Completed', 'Cancelled'];

// Date formatting helpers
const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtTime = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const STATUS_COLORS = {
  pending:   { bg: '#FEF3C7', txt: '#D97706' },
  confirmed: { bg: '#DBEAFE', txt: '#1D4ED8' },
  completed: { bg: '#DCFCE7', txt: '#16A34A' },
  cancelled: { bg: '#FEE2E2', txt: '#DC2626' },
};

const MAX_RESCHEDULES = 2;

function getRescheduleCount(booking) {
  if (!booking) return 0;
  if (Number.isFinite(Number(booking.reschedule_count))) return Number(booking.reschedule_count);
  if (Number.isFinite(Number(booking.rescheduleCount))) return Number(booking.rescheduleCount);
  if (Array.isArray(booking.reschedule_history)) return booking.reschedule_history.length;
  if (Array.isArray(booking.rescheduleHistory)) return booking.rescheduleHistory.length;
  return 0;
}

function getDateTimeParts(value) {
  if (!value) return { date: '', time: '09:00' };
  const raw = String(value).trim();
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const [datePart, timePartRaw] = normalized.split('T');
  const timePart = (timePartRaw || '09:00').substring(0, 5);
  return { date: datePart || '', time: timePart || '09:00' };
}

// Defined outside component so TouchableOpacity always works
function BookingCard({ b, ratedBookingIds, onCancel, onRate, onRemind, onTestReminder, onReschedule, onNearReminder }) {
  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
  const dt = new Date(b.dateTime);
  const [timeLeft, setTimeLeft] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [nearTriggered, setNearTriggered] = useState(false);
  const rescheduleCount = getRescheduleCount(b);
  const canReschedule = rescheduleCount < MAX_RESCHEDULES;
  const basePrice = Number(b.originalPrice ?? b.price ?? 0);
  const finalPrice = Number(b.discountedPrice ?? b.price ?? 0);
  const hasPromoDiscount = Number(b.promoDiscountPercentage || 0) > 0 && finalPrice < basePrice;

  // Show countdown only for confirmed bookings
  useEffect(() => {
    if (b.status === 'confirmed') {
      setShowCountdown(true);
    }
  }, [b.status]);

  // Countdown timer
  useEffect(() => {
    if (!showCountdown) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = dt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsNear(false);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );

      const nearNow = totalSeconds <= 30 * 60; // 30 minutes
      setIsNear(nearNow);
      if (nearNow && !nearTriggered && b.status === 'confirmed') {
        setNearTriggered(true);
        onNearReminder?.(b);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Live seconds countdown
    return () => clearInterval(interval);
  }, [dt, showCountdown, nearTriggered, b, onNearReminder]);

  return (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={st.cardLeft}>
          <View style={st.svcIcon}><Ionicons name="cut-outline" size={20} color={P} /></View>
          <View>
            <Text style={st.svcName}>{b.serviceName}</Text>
            <Text style={st.styName}>{b.stylistName}</Text>
          </View>
        </View>
        <View style={[st.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[st.statusTxt, { color: sc.txt }]}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</Text>
        </View>
      </View>

      <View style={st.cardMeta}>
        <View style={st.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
          <Text style={st.metaTxt}>{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
        <View style={st.metaItem}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text style={st.metaTxt}>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={st.metaItem}>
          <Ionicons name="pricetag-outline" size={14} color="#9CA3AF" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {hasPromoDiscount && (
              <Text style={st.metaOldPrice}>₱{basePrice.toLocaleString()}</Text>
            )}
            <Text style={st.metaTxt}>₱{finalPrice.toLocaleString()}</Text>
            {hasPromoDiscount && (
              <Text style={st.metaPromoBadge}>-{Number(b.promoDiscountPercentage)}%</Text>
            )}
          </View>
        </View>
      </View>

      {b.notes ? (
        <View style={st.notesRow}>
          <Ionicons name="document-text-outline" size={13} color="#9CA3AF" />
          <Text style={st.notesTxt} numberOfLines={1}>{b.notes}</Text>
        </View>
      ) : null}

      {/* Countdown Timer */}
      {showCountdown && timeLeft && (
        <View style={st.countdownContainer}>
          <Ionicons name="timer-outline" size={14} color={P2} />
          <Text style={st.countdownText}>Starts in: {timeLeft}</Text>
        </View>
      )}
      {showCountdown && isNear && (
        <View style={st.nearContainer}>
          <Ionicons name="warning" size={15} color="#B45309" />
          <Text style={st.nearText}>Your appointment is near!</Text>
        </View>
      )}

      <View style={st.cardActions}>
        {b.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[st.rescheduleBtn, !canReschedule && st.rescheduleBtnDisabled]}
              onPress={() => onReschedule(b)}
              disabled={!canReschedule}
            >
              <Ionicons name="calendar-outline" size={16} color={P2} />
              <Text style={[st.rescheduleTxt, !canReschedule && st.rescheduleTxtDisabled]}>
                {canReschedule ? 'Reschedule' : 'Reschedule Limit Reached'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.cancelBtn} onPress={() => onCancel(b)}>
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={st.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {b.status === 'confirmed' && (
          <TouchableOpacity style={st.cancelBtn} onPress={() => onCancel(b)}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={st.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        )}
        {b.status === 'completed' && (
          ratedBookingIds.has(b.id) ? (
            <View style={st.ratedBadge}>
              <Ionicons name="star" size={15} color="#D97706" />
              <Text style={st.ratedTxt}>Rated</Text>
            </View>
          ) : (
            <TouchableOpacity style={st.rateBtn} onPress={() => onRate(b)}>
              <Ionicons name="star-outline" size={16} color="#D97706" />
              <Text style={st.rateTxt}>Rate Service</Text>
            </TouchableOpacity>
          )
        )}
        {b.status === 'confirmed' && (
          <>
            <TouchableOpacity style={st.reminderBtn} onPress={() => onRemind(b)}>
              <Ionicons name="notifications-outline" size={16} color={P} />
              <Text style={st.reminderTxt}>Remind Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.testReminderBtn} onPress={() => onTestReminder(b)}>
              <Ionicons name="flask-outline" size={16} color={P2} />
              <Text style={st.testReminderTxt}>Test Reminder</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function MyBookingsScreen() {
  const { userToken, userId, refreshUnreadCount } = useAppContext();
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [ratingModal, setRatingModal] = useState(false);
  const [selBooking, setSelBooking]   = useState(null);
  const [rating, setRating]           = useState(5);
  const [review, setReview]           = useState('');
  const [ratedBookingIds, setRatedBookingIds] = useState(new Set());

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSecondsLeft, setCancelSecondsLeft] = useState(null);
  const cancelTimerRef = useRef(null);

  // Reminder modal state
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderOption, setReminderOption] = useState('both'); // '15min', '30min', '1hour', '1day', 'both'
  const nearReminderSentRef = useRef(new Set());

  const fetchBookings = useCallback(async () => {
    if (!userToken) { setLoading(false); return; }
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/users/bookings`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
        // Check which completed bookings already have a rating
        const completed = data.filter(b => b.status === 'completed');
        const ratedIds = new Set();
        await Promise.all(completed.map(async b => {
          try {
            const r = await fetch(`${api}/api/bookings/${b.id}/rating`);
            if (r.ok) ratedIds.add(b.id);
          } catch {}
        }));
        setRatedBookingIds(ratedIds);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [userToken]);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  const tabFilter = b => {
    if (activeTab === 'Upcoming')  return ['pending','confirmed'].includes(b.status);
    if (activeTab === 'Completed') return b.status === 'completed';
    return b.status === 'cancelled';
  };

  const filtered = bookings.filter(tabFilter);

  const openCancelModal = (b) => {
    // Check 5-min window for confirmed bookings
    if (b.status === 'confirmed' && b.confirmedAt) {
      const diffMs = Date.now() - new Date(b.confirmedAt).getTime();
      const remaining = Math.floor((5 * 60 * 1000 - diffMs) / 1000);
      if (remaining <= 0) {
        Alert.alert('Cannot Cancel', 'The 5-minute cancellation window has expired.');
        return;
      }
      setCancelSecondsLeft(remaining);
      // start countdown
      clearInterval(cancelTimerRef.current);
      cancelTimerRef.current = setInterval(() => {
        setCancelSecondsLeft(prev => {
          if (prev <= 1) { clearInterval(cancelTimerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCancelSecondsLeft(null);
    }
    setCancelTarget(b);
    setCancelReason('');
    setCancelModal(true);
  };

  const closeCancelModal = () => {
    clearInterval(cancelTimerRef.current);
    setCancelModal(false);
    setCancelTarget(null);
    setCancelReason('');
    setCancelSecondsLeft(null);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please state why you are cancelling.');
      return;
    }
    if (cancelTarget?.status === 'confirmed' && cancelSecondsLeft === 0) {
      Alert.alert('Window Expired', 'The 5-minute cancellation window has expired.');
      closeCancelModal();
      return;
    }
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/bookings/${cancelTarget.id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      if (res.ok) {
        closeCancelModal();
        Alert.alert('Cancelled', 'Your booking has been cancelled.');
        fetchBookings();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Could not cancel booking.');
      }
    } catch { Alert.alert('Error', 'Connection failed.'); }
  };

  const submitRating = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/ratings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: selBooking.id, rating, review: review.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Thanks!', 'Your rating has been submitted.');
        setRatingModal(false);
        fetchBookings();
      } else {
        Alert.alert('Could Not Submit', data.message || 'Please try again.');
      }
    } catch { Alert.alert('Error', 'Connection failed. Check your internet.'); }
  };

  const handleRate = useCallback((b) => {
    setSelBooking(b);
    setRating(5);
    setReview('');
    setRatingModal(true);
  }, []);

  const handleRemind = useCallback((b) => {
    setReminderTarget(b);
    setReminderOption('both');
    setReminderModal(true);
  }, []);

  const handleTestReminder = useCallback(async (b) => {
    const successMessage = '✅ Test successful! Reminder notifications are active.';
    try {
      InAppNotificationManager.emit('notification', { type: 'info', message: successMessage });

      const api = await getApiUrlAsync();
      await fetch(`${api}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          client_id: userId || undefined,
          title: 'Test Reminder',
          message: successMessage,
          type: 'info',
          booking_id: b?.id || undefined,
        }),
      });
      await refreshUnreadCount?.();

      Alert.alert('Test Reminder', successMessage);
    } catch (e) {
      console.error('Error creating test reminder notification:', e);
      Alert.alert('Error', 'Could not send test reminder. Please try again.');
    }
  }, [userToken, userId, refreshUnreadCount]);

  const handleReschedule = useCallback((b) => {
    if (!b) return;
    const rescheduleCount = getRescheduleCount(b);
    if (rescheduleCount >= MAX_RESCHEDULES) {
      Alert.alert('Reschedule Limit', `You can only reschedule this appointment up to ${MAX_RESCHEDULES} times.`);
      return;
    }
    const { date, time } = getDateTimeParts(b.dateTime);
    setRescheduleTarget(b);
    setRescheduleDate(date);
    setRescheduleTime(time);
    setRescheduleStylist(b.stylistId || null);
    setRescheduleService(b.serviceId || null);
    setRescheduleReason('');
    setRescheduleModal(true);
  }, []);

  const handleNearReminder = useCallback(async (b) => {
    if (!b?.id || nearReminderSentRef.current.has(b.id)) return;
    nearReminderSentRef.current.add(b.id);
    try {
      const api = await getApiUrlAsync();
      const msg = `⚠️ Your appointment is near! ${b.serviceName} with ${b.stylistName} starts at ${new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      await fetch(`${api}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          client_id: userId || undefined,
          title: 'Appointment Reminder',
          message: msg,
          type: 'near',
          booking_id: b.id,
        }),
      });
      await refreshUnreadCount?.();
      Alert.alert('Reminder', '⚠️ Your appointment is near!');
    } catch (e) {
      console.error('Error creating near reminder notification:', e);
    }
  }, [userToken, userId, refreshUnreadCount]);

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleStylist, setRescheduleStylist] = useState(null);
  const [rescheduleService, setRescheduleService] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableStylists, setAvailableStylists] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [conflictError, setConflictError] = useState('');

  // Fetch available stylists and services when reschedule modal opens
  useEffect(() => {
    if (rescheduleModal && rescheduleTarget) {
      fetchAvailableData();
    }
  }, [rescheduleModal, rescheduleTarget]);

  const fetchAvailableData = async () => {
    try {
      const api = await getApiUrlAsync();
      const [stRes, svRes] = await Promise.all([
        fetch(`${api}/api/stylists`),
        fetch(`${api}/api/services`)
      ]);
      if (stRes.ok) setAvailableStylists(await stRes.json());
      if (svRes.ok) setAvailableServices(await svRes.json());
    } catch (e) { console.error(e); }
  };

  // Generate time slots based on selected date
  useEffect(() => {
    if (rescheduleDate) {
      generateTimeSlots();
    }
  }, [rescheduleDate]);

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 16;
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    setTimeSlots(slots);
  };

  // Check for conflicts
  const checkConflict = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleTarget) return true;
    
    const selectedDateTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
    const now = new Date();
    
    // Check if selected time is within 1 hour of now
    if (selectedDateTime.getTime() - now.getTime() < 60 * 60 * 1000) {
      setConflictError('Cannot reschedule within 1 hour of the appointment.');
      return false;
    }
    
    // Check if slot is already booked
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/bookings/check-conflict?date=${rescheduleDate}&time=${rescheduleTime}&stylistId=${rescheduleStylist || rescheduleTarget.stylistId}&excludeBookingId=${rescheduleTarget.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conflict) {
          setConflictError('Selected time is not available. Please choose another slot.');
          return false;
        } else {
          setConflictError('');
          return true;
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      setConflictError('Unable to verify slot availability. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    if (!rescheduleModal) return;
    if (!rescheduleDate || !rescheduleTime || !rescheduleTarget) return;
    checkConflict();
  }, [rescheduleModal, rescheduleDate, rescheduleTime, rescheduleStylist, rescheduleTarget]);

  const confirmReschedule = async () => {
    if (getRescheduleCount(rescheduleTarget) >= MAX_RESCHEDULES) {
      Alert.alert('Reschedule Limit', `You can only reschedule this appointment up to ${MAX_RESCHEDULES} times.`);
      setRescheduleModal(false);
      return;
    }
    const isValidSlot = await checkConflict();
    if (!isValidSlot || conflictError) {
      Alert.alert('Conflict', conflictError || 'Selected time is not available. Please choose another slot.');
      return;
    }
    
    if (!rescheduleDate || !rescheduleTime) {
      Alert.alert('Error', 'Please select a date and time.');
      return;
    }
    
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/bookings/${rescheduleTarget.id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          new_date_time: `${rescheduleDate} ${rescheduleTime}:00`,
          new_stylist_id: rescheduleStylist || rescheduleTarget.stylistId,
          new_service_id: rescheduleService || rescheduleTarget.serviceId,
          reason: rescheduleReason.trim() || 'Rescheduled by client'
        })
      });
      
      if (res.ok) {
        // Remove old reminder and add new one
        InAppNotificationManager.removeAppointment(rescheduleTarget.id);
        InAppNotificationManager.addAppointment({
          id: rescheduleTarget.id,
          date_time: `${rescheduleDate} ${rescheduleTime}:00`,
          stylist_name: availableStylists.find(s => s.id === (rescheduleStylist || rescheduleTarget.stylistId))?.name || rescheduleTarget.stylistName,
          reminderOption: 'both'
        });
        
        setRescheduleModal(false);
        Alert.alert(
          'Rescheduled! 🔄',
          `Your appointment has been successfully rescheduled.\n\nOld: ${fmtDate(rescheduleTarget.dateTime)} ${fmtTime(rescheduleTarget.dateTime)}\nNew: ${fmtDate(new Date(`${rescheduleDate} ${rescheduleTime}:00`))} ${fmtTime(`${rescheduleDate} ${rescheduleTime}:00`)}`,
          [{ text: 'OK', onPress: () => fetchBookings() }]
        );
      } else {
        let errMessage = 'Could not reschedule booking.';
        try {
          const err = await res.json();
          errMessage = err.message || err.error || err;
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page), use text
          try {
            const textErr = await res.text();
            if (textErr) {
              errMessage = textErr.substring(0, 200); // Limit error text
            }
          } catch {
            // If both fail, use default message
          }
        }
        if ((errMessage || '').toLowerCase().includes('reschedule') && (errMessage || '').toLowerCase().includes('limit')) {
          errMessage = `You can only reschedule this appointment up to ${MAX_RESCHEDULES} times.`;
        }
        Alert.alert('Error', errMessage);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Connection failed. Please try again.');
    }
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={P} /></View>;

  return (
    <View style={st.root}>
      {/* Header */}
      <LinearGradient colors={['#3B0764', P, P2]} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={st.headerTitle}>My Appointments</Text>
        <Text style={st.headerSub}>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={st.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[st.tabTxt, activeTab === tab && st.tabTxtActive]}>{tab}</Text>
            <View style={[st.tabCount, activeTab === tab && st.tabCountActive]}>
              <Text style={[st.tabCountTxt, activeTab === tab && st.tabCountTxtActive]}>
                {bookings.filter(b => {
                  if (tab === 'Upcoming')  return ['pending','confirmed'].includes(b.status);
                  if (tab === 'Completed') return b.status === 'completed';
                  return b.status === 'cancelled';
                }).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={P} />}
      >
        {filtered.length === 0 ? (
          <View style={st.empty}>
            <Ionicons name="calendar-outline" size={56} color="#ddd" />
            <Text style={st.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={st.emptySub}>Your {activeTab.toLowerCase()} appointments will appear here</Text>
          </View>
        ) : (
          filtered.map(b => <BookingCard key={b.id} b={b} ratedBookingIds={ratedBookingIds} onCancel={openCancelModal} onRate={handleRate} onRemind={handleRemind} onTestReminder={handleTestReminder} onReschedule={handleReschedule} onNearReminder={handleNearReminder} />)
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={cancelModal} transparent animationType="slide" onRequestClose={closeCancelModal}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={st.modalHead}>
              <Text style={st.modalTitle}>Cancel Booking</Text>
              <TouchableOpacity onPress={closeCancelModal}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {cancelTarget && (
              <Text style={st.modalSub}>{cancelTarget.serviceName} with {cancelTarget.stylistName}</Text>
            )}

            {/* 5-min countdown warning */}
            {cancelSecondsLeft !== null && (
              <View style={[st.windowBanner, cancelSecondsLeft <= 30 && st.windowBannerUrgent]}>
                <Ionicons name="timer-outline" size={16} color={cancelSecondsLeft <= 30 ? '#DC2626' : '#D97706'} />
                <Text style={[st.windowTxt, cancelSecondsLeft <= 30 && { color: '#DC2626' }]}>
                  {cancelSecondsLeft > 0
                    ? `Cancellation window closes in ${Math.floor(cancelSecondsLeft / 60)}:${String(cancelSecondsLeft % 60).padStart(2, '0')}`
                    : 'Window expired — you can no longer cancel this booking.'}
                </Text>
              </View>
            )}

            <Text style={st.ratingLabel}>Why are you cancelling?</Text>
            <TextInput
              style={st.reviewInput}
              placeholder="Please state your reason…"
              placeholderTextColor="#bbb"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalCancel} onPress={closeCancelModal}>
                <Text style={st.modalCancelTxt}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.modalSubmit, { backgroundColor: '#DC2626' }, (cancelSecondsLeft === 0) && { opacity: 0.4 }]}
                onPress={confirmCancel}
                disabled={cancelSecondsLeft === 0}
              >
                <Text style={st.modalSubmitTxt}>Confirm Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={ratingModal} transparent animationType="slide" onRequestClose={() => setRatingModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={st.modalHead}>
              <Text style={st.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setRatingModal(false)}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {selBooking && (
              <Text style={st.modalSub}>{selBooking.serviceName} with {selBooking.stylistName}</Text>
            )}
            <Text style={st.ratingLabel}>How was your experience?</Text>
            <View style={st.starsRow}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={36} color={i <= rating ? '#FFC107' : '#ddd'} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={st.reviewInput}
              placeholder="Share your experience (optional)…"
              placeholderTextColor="#bbb"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalCancel} onPress={() => setRatingModal(false)}>
                <Text style={st.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.modalSubmit} onPress={submitRating}>
                <Text style={st.modalSubmitTxt}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Modal */}
      <Modal visible={reminderModal} transparent animationType="slide" onRequestClose={() => setReminderModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={st.modalHead}>
              <Text style={st.modalTitle}>Set Reminder</Text>
              <TouchableOpacity onPress={() => setReminderModal(false)}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {reminderTarget && (
              <Text style={st.modalSub}>{reminderTarget.serviceName} with {reminderTarget.stylistName}</Text>
            )}

            <Text style={st.ratingLabel}>When would you like to be reminded?</Text>
            <View style={st.reminderOptions}>
              <TouchableOpacity 
                style={[st.reminderOption, reminderOption === '15min' && st.reminderOptionActive]}
                onPress={() => setReminderOption('15min')}
              >
                <Ionicons 
                  name={reminderOption === '15min' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={reminderOption === '15min' ? P2 : '#9CA3AF'} 
                />
                <Text style={[st.reminderOptionText, reminderOption === '15min' && st.reminderOptionTextActive]}>15 minutes before</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[st.reminderOption, reminderOption === '30min' && st.reminderOptionActive]}
                onPress={() => setReminderOption('30min')}
              >
                <Ionicons 
                  name={reminderOption === '30min' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={reminderOption === '30min' ? P2 : '#9CA3AF'} 
                />
                <Text style={[st.reminderOptionText, reminderOption === '30min' && st.reminderOptionTextActive]}>30 minutes before</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[st.reminderOption, reminderOption === '1hour' && st.reminderOptionActive]}
                onPress={() => setReminderOption('1hour')}
              >
                <Ionicons 
                  name={reminderOption === '1hour' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={reminderOption === '1hour' ? P2 : '#9CA3AF'} 
                />
                <Text style={[st.reminderOptionText, reminderOption === '1hour' && st.reminderOptionTextActive]}>1 hour before</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[st.reminderOption, reminderOption === '1day' && st.reminderOptionActive]}
                onPress={() => setReminderOption('1day')}
              >
                <Ionicons 
                  name={reminderOption === '1day' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={reminderOption === '1day' ? P2 : '#9CA3AF'} 
                />
                <Text style={[st.reminderOptionText, reminderOption === '1day' && st.reminderOptionTextActive]}>1 day before</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[st.reminderOption, reminderOption === 'both' && st.reminderOptionActive]}
                onPress={() => setReminderOption('both')}
              >
                <Ionicons 
                  name={reminderOption === 'both' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={reminderOption === 'both' ? P2 : '#9CA3AF'} 
                />
                <Text style={[st.reminderOptionText, reminderOption === 'both' && st.reminderOptionTextActive]}>Both (1hr + 1day)</Text>
              </TouchableOpacity>
            </View>

            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalCancel} onPress={() => setReminderModal(false)}>
                <Text style={st.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={st.modalSubmit} 
                onPress={async () => {
                  try {
                    const api = await getApiUrlAsync();
                    await fetch(`${api}/api/reminders`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                      },
                      body: JSON.stringify({
                        booking_id: reminderTarget.id,
                        reminder_time: reminderOption,
                        scheduled_at: reminderTarget.dateTime
                      })
                    });
                    
                    InAppNotificationManager.addAppointment({ 
                      id: reminderTarget.id, 
                      date_time: reminderTarget.dateTime, 
                      stylist_name: reminderTarget.stylistName,
                      reminderOption
                    });
                    setReminderModal(false);
                    Alert.alert('Reminder Set', `You'll be notified ${reminderOption === 'both' ? '1 hour and 1 day before' : reminderOption === '1hour' ? '1 hour before' : reminderOption === '30min' ? '30 minutes before' : reminderOption === '15min' ? '15 minutes before' : '1 day before'} your appointment.`);
                  } catch (err) {
                    console.error('Error saving reminder:', err);
                    Alert.alert('Error', 'Could not save reminder. Please try again.');
                  }
                }}
              >
                <Text style={st.modalSubmitTxt}>Save Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={rescheduleModal} transparent animationType="slide" onRequestClose={() => setRescheduleModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <View style={st.modalHead}>
              <Text style={st.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModal(false)}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {rescheduleTarget ? (
              <Text style={st.modalSub}>{rescheduleTarget.serviceName} with {rescheduleTarget.stylistName}</Text>
            ) : null}

            {/* Current booking info */}
            {rescheduleTarget && (
              <View style={st.currentInfoBox}>
                <Text style={st.currentInfoLabel}>Current Appointment</Text>
                <View style={st.currentInfoRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={st.currentInfoText}>{rescheduleTarget.dateTime ? new Date(rescheduleTarget.dateTime).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={st.currentInfoRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={st.currentInfoText}>{rescheduleTarget.dateTime ? new Date(rescheduleTarget.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
                </View>
              </View>
            )}

            {/* New Date */}
            <Text style={st.ratingLabel}>Select New Date</Text>
            <TouchableOpacity 
              style={st.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" style={st.dateIcon} />
              <Text style={st.dateInputText}>{rescheduleDate || 'Select date'}</Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            {/* Date Picker */}
            {showDatePicker && (
              <View style={st.datePickerContainer}>
                <DateTimePicker
                  value={rescheduleDate ? new Date(rescheduleDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const isoDate = selectedDate.toISOString().split('T')[0];
                      setRescheduleDate(isoDate);
                    }
                  }}
                  minimumDate={new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}
                  maximumDate={new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)}
                  textColor="#333"
                  style={st.datePicker}
                />
              </View>
            )}
            
            {/* New Time */}
            <Text style={st.ratingLabel}>Select New Time</Text>
            <View style={st.timeSlotsContainer}>
              {timeSlots.map((slot) => {
                const [hour, minute] = slot.split(':').map(Number);
                const displayHour = hour > 12 ? hour - 12 : hour;
                const displayMinute = minute === '00' ? '' : `:${minute}`;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayTime = `${displayHour}${displayMinute} ${ampm}`;
                
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[st.timeSlot, rescheduleTime === slot && st.timeSlotActive]}
                    onPress={() => setRescheduleTime(slot)}
                  >
                    <Text style={[st.timeSlotText, rescheduleTime === slot && st.timeSlotTextActive]}>{displayTime}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Change Stylist */}
            <Text style={st.ratingLabel}>Change Stylist (Optional)</Text>
            <View style={st.stylistSelect}>
              <TouchableOpacity
                style={[st.stylistOption, rescheduleStylist === null && st.stylistOptionActive]}
                onPress={() => setRescheduleStylist(null)}
              >
                <Text style={[st.stylistOptionText, rescheduleStylist === null && st.stylistOptionTextActive]}>Keep Current Stylist</Text>
              </TouchableOpacity>
              {availableStylists.map(sty => (
                <TouchableOpacity
                  key={sty.id}
                  style={[st.stylistOption, rescheduleStylist === sty.id && st.stylistOptionActive]}
                  onPress={() => setRescheduleStylist(sty.id)}
                >
                  <Text style={[st.stylistOptionText, rescheduleStylist === sty.id && st.stylistOptionTextActive]}>{sty.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conflict Warning */}
            {conflictError && (
              <View style={st.conflictBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={st.conflictText}>{conflictError}</Text>
              </View>
            )}

            {/* Reason (Optional) */}
            <Text style={st.ratingLabel}>Reason for Rescheduling (Optional)</Text>
            <TextInput
              style={st.reviewInput}
              placeholder="e.g., Schedule conflict, Personal reason..."
              placeholderTextColor="#bbb"
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <View style={st.modalActions}>
              <TouchableOpacity style={st.modalCancel} onPress={() => setRescheduleModal(false)}>
                <Text style={st.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[st.modalSubmit, conflictError && { opacity: 0.5 }]}
                onPress={confirmReschedule}
                disabled={!!conflictError}
              >
                <Text style={st.modalSubmitTxt}>Confirm Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F0FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 22 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  tab:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 14, backgroundColor: '#F9FAFB' },
  tabActive: { backgroundColor: '#EDE9FE' },
  tabTxt:    { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  tabTxtActive: { color: P2 },
  tabCount:  { backgroundColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: P2 },
  tabCountTxt: { fontSize: 10, color: '#6B7280', fontWeight: '700' },
  tabCountTxtActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 17, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  svcIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  svcName: { fontSize: 15, fontWeight: '800', color: '#1E1B4B', letterSpacing: -0.2 },
  styName: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { fontSize: 12, color: '#6B7280' },
  metaOldPrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  metaPromoBadge: { fontSize: 10, color: '#166534', backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontWeight: '700' },
  notesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 8, marginBottom: 10 },
  notesTxt: { flex: 1, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#F9FAFB', paddingTop: 12 },
  cancelBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  cancelTxt:   { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  rateBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  rateTxt:     { fontSize: 12, color: '#D97706', fontWeight: '700' },
  ratedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FEF9C3' },
  ratedTxt:    { fontSize: 12, color: '#92400E', fontWeight: '700' },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE', backgroundColor: '#EDE9FE' },
  reminderTxt: { fontSize: 12, color: P2, fontWeight: '700' },
  testReminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#C4B5FD', backgroundColor: '#F5F3FF' },
  testReminderTxt: { fontSize: 12, color: P2, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#9CA3AF', marginTop: 16 },
  emptySub:   { fontSize: 13, color: '#D1D5DB', marginTop: 6, textAlign: 'center' },
  windowBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FCD34D' },
  windowBannerUrgent: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  windowTxt:          { flex: 1, fontSize: 13, color: '#D97706', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox:  { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 26, paddingBottom: 38 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 },
  modalSub:   { fontSize: 13, color: '#9CA3AF', marginBottom: 22 },
  ratingLabel: { fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center', marginBottom: 14 },
  starsRow:   { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 22 },
  reviewInput: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14, color: '#333', minHeight: 80, marginBottom: 22 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  modalCancelTxt: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  modalSubmit: { flex: 1, paddingVertical: 15, borderRadius: 16, backgroundColor: P2, alignItems: 'center' },
  modalSubmitTxt: { fontSize: 14, color: '#fff', fontWeight: '700' },
  reminderOptions: { marginTop: 12, marginBottom: 22 },
  reminderOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 16 },
  reminderOptionActive: { backgroundColor: '#EDE9FE' },
  reminderOptionText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  reminderOptionTextActive: { color: P2 },
  countdownContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDE9FE', borderRadius: 10, padding: 8, marginTop: 8 },
  countdownText: { fontSize: 12, color: P2, fontWeight: '700' },
  nearContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#FDE68A' },
  nearText: { fontSize: 12, color: '#92400E', fontWeight: '700' },
  rescheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE', backgroundColor: '#EDE9FE' },
  rescheduleTxt: { fontSize: 12, color: P2, fontWeight: '700' },
  rescheduleBtnDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  rescheduleTxtDisabled: { color: '#9CA3AF' },
  currentInfoBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  currentInfoLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700', marginBottom: 8 },
  currentInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  currentInfoText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  dateInput: { flex: 1, fontSize: 14, color: '#333', padding: 0, backgroundColor: 'transparent' },
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  dateIcon: { marginRight: 10 },
  dateInputText: { flex: 1, fontSize: 14, color: '#333' },
  datePickerContainer: { marginBottom: 16 },
  datePicker: { width: '100%', height: 120 },
  timeSlotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeSlot: { width: 60, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  timeSlotActive: { backgroundColor: '#EDE9FE', borderColor: P2 },
  timeSlotText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  timeSlotTextActive: { color: P2, fontWeight: '700' },
  stylistSelect: { marginBottom: 16 },
  stylistOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F9FAFB', marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  stylistOptionActive: { backgroundColor: '#EDE9FE', borderColor: P2 },
  stylistOptionText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  stylistOptionTextActive: { color: P2, fontWeight: '700' },
  conflictBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  conflictText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '600' },
});
