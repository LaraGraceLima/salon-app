import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const P  = '#7C3AED';
const P2 = '#6D28D9';
const P3 = '#A855F7';

const GREETINGS = [
  'Ready to make magic today?',
  'Your clients are waiting!',
  'Let\'s create something beautiful.',
  'Another great day ahead!',
  'Time to shine ✨',
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const fmtTime = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const today   = () => new Date().toISOString().split('T')[0];

const STATUS = {
  pending:   { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline',          label: 'Pending'   },
  confirmed: { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  completed: { color: '#3B82F6', bg: '#DBEAFE', icon: 'trophy-outline',         label: 'Completed' },
  cancelled: { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline',   label: 'Cancelled' },
};

export default function DashboardScreen({ route, navigation }) {
  const { stylistToken, stylistName, stylistData } = route.params || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const quote = GREETINGS[new Date().getDay() % GREETINGS.length];

  useFocusEffect(
    React.useCallback(() => {
      if (stylistToken) fetchData();
    }, [stylistToken])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/stylists/bookings`, {
        headers: { Authorization: `Bearer ${stylistToken}` },
      });
      if (res.ok) setBookings(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const todayStr  = today();
  const todayList = bookings.filter(b => b.dateTime?.startsWith(todayStr));
  const now = new Date().toISOString();
  const confirmedList = bookings.filter(b => b.status === 'confirmed');
  const upcoming  = confirmedList.filter(b => b.dateTime > now);
  const completed = bookings.filter(b => b.status === 'completed');
  const pending   = bookings.filter(b => b.status === 'pending');
  const revenue   = completed.reduce((s, b) => s + parseFloat(b.price || 0), 0);

  if (loading) return (
    <View style={st.center}>
      <ActivityIndicator size="large" color={P} />
      <Text style={st.loadingTxt}>Loading your dashboard…</Text>
    </View>
  );

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={P} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── HERO ── */}
        <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[st.orb, { width: 220, height: 220, top: -70, right: -60, opacity: 0.1 }]} />
          <View style={[st.orb, { width: 120, height: 120, top: 30, right: 50, opacity: 0.07 }]} />
          <View style={[st.orb, { width: 80,  height: 80,  bottom: 10, left: 10, opacity: 0.1 }]} />

          {/* Top row */}
          <View style={st.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={st.heroGreet}>{greeting()} 👋</Text>
              <Text style={st.heroName}>{stylistName || 'Stylist'}</Text>
              <Text style={st.heroDate}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Quote pill */}
          <Animated.View style={[st.quotePill, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={st.quoteTxt}>{quote}</Text>
          </Animated.View>

          {/* Stats strip */}
          <View style={st.strip}>
            {[
              { val: todayList.length, lbl: "Today's Appts", icon: 'calendar', color: '#FCD34D' },
              { val: pending.length,   lbl: 'Pending',       icon: 'time',     color: '#FCA5A5' },
              { val: `₱${revenue >= 1000 ? (revenue/1000).toFixed(1)+'k' : revenue.toFixed(0)}`, lbl: 'Revenue', icon: 'cash', color: '#6EE7B7' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={st.stripDiv} />}
                <View style={st.stripItem}>
                  <View style={[st.stripIconWrap, { backgroundColor: s.color + '30' }]}>
                    <Ionicons name={s.icon} size={14} color={s.color} />
                  </View>
                  <Text style={st.stripVal}>{s.val}</Text>
                  <Text style={st.stripLbl}>{s.lbl}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* ── STAT CARDS ── */}
        <View style={st.statsRow}>
          {[
            { icon: 'calendar-outline',       label: 'Total',     value: bookings.length,  color: P,        bg: '#EDE9FE' },
            { icon: 'checkmark-circle-outline', label: 'Confirmed', value: confirmedList.length,  color: '#10B981', bg: '#D1FAE5' },
            { icon: 'checkmark-done-outline',  label: 'Completed', value: completed.length, color: '#10B981', bg: '#D1FAE5' },
            { icon: 'close-circle-outline',    label: 'Cancelled', value: bookings.filter(b=>b.status==='cancelled').length, color: '#EF4444', bg: '#FEE2E2' },
          ].map((s, i) => (
            <View key={i} style={st.statCard}>
              <View style={[st.statIconWrap, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[st.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={st.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── PENDING ALERT ── */}
        {pending.length > 0 && (
          <TouchableOpacity
            style={st.alertCard}
            onPress={() => navigation.navigate('Bookings')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={st.alertGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={st.alertIconWrap}>
                <Ionicons name="notifications" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.alertTitle}>{pending.length} Pending Request{pending.length > 1 ? 's' : ''}</Text>
                <Text style={st.alertSub}>Tap to review and respond</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D97706" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── TODAY'S SCHEDULE ── */}
        <View style={st.section}>
          <View style={st.secHead}>
            <View style={st.secTitleRow}>
              <View style={st.secDot} />
              <Text style={st.secTitle}>Today's Schedule</Text>
            </View>
            <View style={st.secBadge}>
              <Text style={st.secBadgeTxt}>{todayList.length} appt{todayList.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {todayList.length === 0 ? (
            <View style={st.emptyCard}>
              <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={st.emptyGrad}>
                <Ionicons name="calendar-outline" size={44} color={P3} />
                <Text style={st.emptyTitle}>Free day!</Text>
                <Text style={st.emptyTxt}>No appointments scheduled for today.</Text>
              </LinearGradient>
            </View>
          ) : (
            todayList.map((b, i) => {
              const meta = STATUS[b.status] || STATUS.pending;
              return (
                <View key={b.id} style={[st.apptCard, { marginBottom: i < todayList.length - 1 ? 12 : 0 }]}>
                  <View style={[st.apptAccent, { backgroundColor: meta.color }]} />
                  <View style={st.apptBody}>
                    <View style={st.apptTop}>
                      <View style={st.apptClientRow}>
                        <View style={[st.apptAvatar, { backgroundColor: meta.bg }]}>
                          <Ionicons name="person" size={14} color={meta.color} />
                        </View>
                        <Text style={st.apptClient}>{b.clientName}</Text>
                      </View>
                      <View style={[st.apptBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={11} color={meta.color} />
                        <Text style={[st.apptBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={st.apptService}>{b.serviceName}</Text>
                    <View style={st.apptMeta}>
                      <View style={st.apptMetaItem}>
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                        <Text style={st.apptMetaTxt}>{fmtTime(b.dateTime)}</Text>
                      </View>
                      <View style={st.apptMetaDot} />
                      <View style={st.apptMetaItem}>
                        <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                        <Text style={st.apptMetaTxt}>₱{Number(b.price).toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── UPCOMING CONFIRMED ── */}
        {upcoming.length > 0 && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View style={st.secTitleRow}>
                <View style={[st.secDot, { backgroundColor: '#10B981' }]} />
                <Text style={st.secTitle}>Upcoming Confirmed</Text>
              </View>
              <View style={[st.secBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[st.secBadgeTxt, { color: '#10B981' }]}>{upcoming.length}</Text>
              </View>
            </View>
            {upcoming.slice(0, 4).map((b, i) => (
              <View key={b.id} style={[st.upcomingCard, { marginBottom: i < Math.min(upcoming.length, 4) - 1 ? 10 : 0 }]}>
                <View style={st.upcomingLeft}>
                  <View style={st.upcomingDateBox}>
                    <Text style={st.upcomingMonth}>{new Date(b.dateTime).toLocaleDateString('en-US', { month: 'short' })}</Text>
                    <Text style={st.upcomingDay}>{new Date(b.dateTime).getDate()}</Text>
                  </View>
                </View>
                <View style={st.upcomingBody}>
                  <Text style={st.upcomingClient}>{b.clientName}</Text>
                  <Text style={st.upcomingService}>{b.serviceName}</Text>
                  <View style={st.apptMetaItem}>
                    <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                    <Text style={st.apptMetaTxt}>{fmtTime(b.dateTime)}</Text>
                  </View>
                </View>
                <Text style={st.upcomingPrice}>₱{Number(b.price).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── QUICK ACTIONS ── */}
        <View style={st.section}>
          <View style={st.secHead}>
            <View style={st.secTitleRow}>
              <View style={[st.secDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={st.secTitle}>Quick Actions</Text>
            </View>
          </View>
          <View style={st.actionsGrid}>
            {[
              { icon: 'calendar',           label: 'My Bookings',  color: P,        bg: '#EDE9FE', screen: 'Bookings'      },
              { icon: 'calendar-number',    label: 'Schedule',     color: '#3B82F6', bg: '#DBEAFE', screen: 'Schedule'      },
              { icon: 'star',               label: 'Ratings',      color: '#F59E0B', bg: '#FEF3C7', screen: 'Ratings'       },
              { icon: 'notifications',      label: 'Notifications',color: '#10B981', bg: '#D1FAE5', screen: 'Notifications' },
            ].map(a => (
              <TouchableOpacity
                key={a.screen}
                style={st.actionItem}
                onPress={() => navigation.navigate(a.screen)}
                activeOpacity={0.8}
              >
                <View style={[st.actionIcon, { backgroundColor: a.bg }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <Text style={st.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── BOTTOM SPACER ── */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F9FAFB' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 13, color: '#9CA3AF' },

  // Hero
  hero:     { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 28, overflow: 'hidden' },
  orb:      { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  heroGreet:{ fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  heroName: { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 2, letterSpacing: -0.5 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  quotePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  quoteTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', flex: 1 },

  strip:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  stripItem:    { flex: 1, alignItems: 'center', gap: 4 },
  stripIconWrap:{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  stripVal:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  stripLbl:     { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'center' },
  stripDiv:     { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 6 },

  // Stat cards
  statsRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16, marginBottom: 14 },
  statCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  statIconWrap:{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statVal:     { fontSize: 20, fontWeight: '900' },
  statLbl:     { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2, textAlign: 'center' },

  // Alert
  alertCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 16, overflow: 'hidden', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 },
  alertGrad: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  alertIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(217,119,6,0.15)', justifyContent: 'center', alignItems: 'center' },
  alertTitle:{ fontSize: 15, fontWeight: '800', color: '#92400E' },
  alertSub:  { fontSize: 12, color: '#B45309', marginTop: 2 },

  // Section
  section:     { paddingHorizontal: 16, marginBottom: 20 },
  secHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secDot:      { width: 12, height: 12, borderRadius: 6, backgroundColor: P },
  secTitle:    { fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  secBadge:    { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  secBadgeTxt: { fontSize: 12, color: P, fontWeight: '700' },

  // Appointment cards
  apptCard:      { backgroundColor: '#fff', borderRadius: 18, flexDirection: 'row', overflow: 'hidden', shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  apptAccent:    { width: 6, backgroundColor: P },
  apptBody:      { flex: 1, padding: 16 },
  apptTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  apptClientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  apptAvatar:    { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  apptClient:    { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  apptBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  apptBadgeTxt:  { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  apptService:   { fontSize: 14, color: P2, fontWeight: '600', marginBottom: 10 },
  apptMeta:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apptMetaItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  apptMetaDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  apptMetaTxt:   { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Empty
  emptyCard: { borderRadius: 20, overflow: 'hidden' },
  emptyGrad: { padding: 40, alignItems: 'center', gap: 10 },
  emptyTitle:{ fontSize: 20, fontWeight: '800', color: P },
  emptyTxt:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Upcoming cards
  upcomingCard:  { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 16, shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  upcomingLeft:  { marginRight: 16 },
  upcomingDateBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  upcomingMonth: { fontSize: 10, color: P, fontWeight: '700', textTransform: 'uppercase' },
  upcomingDay:   { fontSize: 20, fontWeight: '900', color: P, lineHeight: 24 },
  upcomingBody:  { flex: 1, gap: 4 },
  upcomingClient:{ fontSize: 14, fontWeight: '800', color: '#1E1B4B' },
  upcomingService:{ fontSize: 12, color: '#6B7280', fontWeight: '500' },
  upcomingPrice: { fontSize: 14, fontWeight: '800', color: '#10B981' },

  // Quick actions
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionItem:   { width: (width - 32 - 14) / 2 - 7, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', gap: 12, shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  actionIcon:   { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionLabel:  { fontSize: 13, fontWeight: '700', color: '#1E1B4B', textAlign: 'center' },
});
