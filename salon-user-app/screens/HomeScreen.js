import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, StatusBar, Animated,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useAppContext } from '../context/AppContext';
import salonImage from '../assets/images/salon.png';

const P  = '#1a0030';  // Dark violet from BEAUTYBOSS logo
const P2 = '#7c3aad';  // Violet-lavender from BEAUTYBOSS logo
const FALLBACK = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80';

const QUOTES = [
  { text: 'Your beauty, your confidence.', icon: '✨' },
  { text: 'Relax. Refresh. Renew.', icon: '🌸' },
  { text: 'Because you deserve to feel amazing.', icon: '💇‍♀️' },
  { text: 'Invest in your hair, it’s the crown you never take off.', icon: '👑' },
  { text: 'Welcome back, beautiful.', icon: '💜' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function parseBookingDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}

function countUpcomingToday(bookings) {
  if (!Array.isArray(bookings) || !bookings.length) return 0;
  const now = new Date();
  return bookings.filter((b) => {
    if (!['pending', 'confirmed'].includes(String(b?.status || '').toLowerCase())) return false;
    const dt = parseBookingDate(b?.date);
    if (!dt) return false;
    return (
      dt.getFullYear() === now.getFullYear() &&
      dt.getMonth() === now.getMonth() &&
      dt.getDate() === now.getDate()
    );
  }).length;
}

function formatBusinessHours(hoursInput) {
  if (!hoursInput) return ['Mon-Sat  8AM-8PM', 'Sunday  9AM-6PM'];
  const hours = Array.isArray(hoursInput)
    ? hoursInput
    : Object.entries(hoursInput).map(([day, value]) => ({ day, ...value }));
  const openDays = hours.filter(h => h.open);
  if (!openDays.length) return ['Currently closed', 'Please contact salon'];

  const fmt = (v) => {
    const [hh, mm] = String(v || '00:00').split(':').map(Number);
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return mm ? `${h12}:${String(mm).padStart(2, '0')}${period}` : `${h12}${period}`;
  };

  const monSat = openDays.filter(h => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].includes(h.day));
  const sunday = hours.find(h => h.day === 'Sunday');
  const line1 = monSat.length
    ? `Mon-Sat  ${fmt(monSat[0].from)}-${fmt(monSat[0].to)}`
    : `${openDays[0].day.slice(0,3)}  ${fmt(openDays[0].from)}-${fmt(openDays[0].to)}`;
  const line2 = sunday
    ? (sunday.open ? `Sunday  ${fmt(sunday.from)}-${fmt(sunday.to)}` : 'Sunday  Closed')
    : 'Hours may vary';
  return [line1, line2];
}

function toMinutesFromHHMM(value) {
  if (!value) return null;
  const [hh, mm] = String(value).split(':').map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function getTodayBusinessHours(hoursInput, now = new Date()) {
  const fallbackHours = [
    { day: 'Monday', open: true, from: '08:00', to: '20:00' },
    { day: 'Tuesday', open: true, from: '08:00', to: '20:00' },
    { day: 'Wednesday', open: true, from: '08:00', to: '20:00' },
    { day: 'Thursday', open: true, from: '08:00', to: '20:00' },
    { day: 'Friday', open: true, from: '08:00', to: '20:00' },
    { day: 'Saturday', open: true, from: '08:00', to: '20:00' },
    { day: 'Sunday', open: true, from: '09:00', to: '18:00' },
  ];

  const hours = hoursInput
    ? (Array.isArray(hoursInput)
      ? hoursInput
      : Object.entries(hoursInput).map(([day, value]) => ({ day, ...value })))
    : fallbackHours;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[now.getDay()];
  return hours.find((h) => h.day === todayName) || null;
}

function isSalonOpenNow(hoursInput, now = new Date()) {
  const today = getTodayBusinessHours(hoursInput, now);
  if (!today || !today.open) return false;

  const fromMinutes = toMinutesFromHHMM(today.from);
  const toMinutes = toMinutesFromHHMM(today.to);
  if (fromMinutes == null || toMinutes == null) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= fromMinutes && currentMinutes < toMinutes;
}

export default function HomeScreen({ navigation }) {
  const { userToken, userName, userProfileImage, setUserProfileImage } = useAppContext();
  const [services, setServices]     = useState([]);
  const [stylists, setStylists]     = useState([]);
  const [promos, setPromos]         = useState([]);
  const [salonInfo, setSalonInfo]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [headerProfileImage, setHeaderProfileImage] = useState(userProfileImage || null);
  const [todayUpcomingCount, setTodayUpcomingCount] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [clockNow, setClockNow] = useState(new Date());
  const [hoursLine1, hoursLine2] = formatBusinessHours(salonInfo?.business_hours);
  const salonIsOpen = isSalonOpenNow(salonInfo?.business_hours, clockNow);

  const q = searchQuery.toLowerCase().trim();
  const filteredServices = q ? services.filter(s => s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) : services;
  const filteredStylists = q ? stylists.filter(s => s.name?.toLowerCase().includes(q) || s.specialization?.toLowerCase().includes(q)) : stylists;
  const filteredPromos   = q ? promos.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) : promos;
  const hasResults = filteredServices.length > 0 || filteredStylists.length > 0 || filteredPromos.length > 0;

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(24)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const fabAnim    = useRef(new Animated.Value(0)).current;
  const quote = QUOTES[quoteIndex % QUOTES.length];

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchData = useCallback(async () => {
    try {
      const api = await getApiUrlAsync();
      const [sRes, stRes, prRes, siRes] = await Promise.all([
        fetch(`${api}/api/services`),
        fetch(`${api}/api/stylists`),
        fetch(`${api}/api/promos/active`),
        fetch(`${api}/api/salon-info`),
      ]);
      if (sRes.ok)  setServices(await sRes.json());
      if (stRes.ok) setStylists((await stRes.json()).filter(s => s.status === 'active'));
      if (prRes.ok) setPromos(await prRes.json());
      if (siRes.ok) setSalonInfo(await siRes.json());
      if (userToken) {
        try {
          const profileRes = await fetch(`${api}/api/users/profile`, {
            headers: { Authorization: `Bearer ${userToken}` },
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const img = profile?.profile_image_url || null;
            setHeaderProfileImage(img);
            setUserProfileImage?.(img);
          }
        } catch {}
      }
      if (userToken) {
        const bookingsRes = await fetch(`${api}/api/users/bookings`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();
          setTodayUpcomingCount(countUpcomingToday(bookings));
        } else {
          setTodayUpcomingCount(0);
        }
      } else {
        setTodayUpcomingCount(0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [userToken, setUserProfileImage]);

  useEffect(() => {
    setHeaderProfileImage(userProfileImage || null);
  }, [userProfileImage]);

  useEffect(() => {
    fetchData();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.timing(fabAnim,   { toValue: 1, duration: 900, delay: 600, useNativeDriver: true }),
    ]).start();
    startPulse();
    
    // WebSocket for real-time salon info updates
    const wsUrl = 'ws://localhost:3001';
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'salon_info_updated') {
            fetchData(); // Refresh all data including salon info
          }
        } catch {}
      };
    } catch {}
    
    return () => {
      if (ws) ws.close();
    };
  }, [fetchData]);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <View style={st.center}>
      <ActivityIndicator size="large" color={P2} />
      <Text style={st.loadingTxt}>Loading your experience…</Text>
    </View>
  );

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={P} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={P2} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── HERO ── */}
        <View style={st.hero}>
          {/* Full-bleed salon image */}
          <Image source={salonImage} style={st.heroBg} resizeMode="cover" />
          {/* Layered gradients for readability + premium look */}
          <LinearGradient colors={['rgba(16,4,34,0.65)', 'rgba(30,7,60,0.82)', 'rgba(46,7,84,0.95)']} style={st.heroImageTint} />
          <LinearGradient colors={['rgba(124,58,237,0.18)', 'rgba(124,58,237,0.05)', 'transparent']} style={st.heroGlow} />
          <LinearGradient colors={['rgba(232,160,32,0.12)', 'rgba(232,160,32,0.03)', 'transparent']} style={st.heroGoldGlow} />
          
          <View style={st.heroContent}>
            <View style={st.topShell}>
              <View style={st.topRow}>
                <View style={st.greetingContainer}>
                  <Text style={st.greetTxt}>{`${greeting()}, ${userName || 'Guest'}!`} 👋</Text>
                  <Text style={st.nameTxt}>Welcome back!</Text>
                  <Text style={st.greetSubTxt}>
                    {todayUpcomingCount > 0
                      ? `You have ${todayUpcomingCount} upcoming appointment${todayUpcomingCount > 1 ? 's' : ''} today`
                      : 'No bookings today — treat yourself!'}
                  </Text>
                </View>
                <View style={st.topRight}>
                  <TouchableOpacity style={st.iconBtn} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.7}>
                    <Ionicons name="calendar-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={st.iconBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
                    {headerProfileImage ? (
                      <Image source={{ uri: headerProfileImage }} style={st.headerAvatarImg} />
                    ) : (
                      <Ionicons name="person-circle-outline" size={24} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Enhanced Quote Section */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 16 }}>
              <View style={st.quoteContainer}>
                <View style={st.quoteBadge}>
                  <Text style={st.quoteEmoji}>{quote.icon}</Text>
                </View>
                <Text style={st.quoteTxt}>{quote.text}</Text>
              </View>
            </Animated.View>

            {/* Enhanced Search Bar */}
            <View style={[st.searchWrap, searchFocused && st.searchWrapFocused]}>
              <View style={st.searchLeadingIcon}>
                <Ionicons name="search-outline" size={18} color={searchFocused ? '#7c3aad' : '#8b5cf6'} />
              </View>
              <TextInput
                style={st.searchInput}
                placeholder="Search services, stylists, promos..."
                placeholderTextColor="#9f8db2"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
              />
              {!searchQuery && <Text style={st.searchHint}>✨</Text>}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color="#8b5cf6" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Decorative elements */}
          <View style={st.heroOrb1} />
          <View style={st.heroOrb2} />
          <View style={st.heroOrb3} />
        </View>

        {/* ── QUICK ACTIONS ── */}
        {!q && (
        <View style={st.quickRow}>
          {[
            { icon: 'cut-outline',      label: 'Services',  bg: ['#EDE9FE','#DDD6FE'], ic: P2,        screen: 'Services' },
            { icon: 'person-outline',   label: 'Stylists',  bg: ['#EDE9FE','#DDD6FE'], ic: P2, screen: 'Stylists' },
            { icon: 'calendar-outline', label: 'Bookings',  bg: ['#EDE9FE','#DDD6FE'], ic: P2, screen: 'MyBookings' },
          ].map(qk => (
            <TouchableOpacity key={qk.screen} style={st.quickItem} onPress={() => navigation.navigate(qk.screen)} activeOpacity={0.78}>
              <LinearGradient colors={qk.bg} style={st.quickIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={qk.icon} size={24} color={qk.ic} />
              </LinearGradient>
              <Text style={st.quickLabel}>{qk.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        )}

        {/* ── NO RESULTS ── */}
        {q && !hasResults && (
          <View style={st.noResults}>
            <Ionicons name="search-outline" size={40} color="#D1D5DB" />
            <Text style={st.noResultsTxt}>No results for "{searchQuery}"</Text>
            <Text style={st.noResultsSub}>Try a different keyword</Text>
          </View>
        )}

        {/* ── FEATURED SERVICES ── */}
        {filteredServices.length > 0 && (
        <View style={st.section}>
          <View style={st.secHead}>
            <View>
              <Text style={st.secTitle}>Services Offers</Text>
              <Text style={st.secSub}>{q ? `${filteredServices.length} result${filteredServices.length !== 1 ? 's' : ''}` : 'Tap to explore & book'}</Text>
            </View>
            {!q && (
            <TouchableOpacity style={st.seeAllBtn} onPress={() => navigation.navigate('Services')}>
              <Text style={st.seeAllTxt}>See all</Text>
              <Ionicons name="arrow-forward" size={13} color={P2} />
            </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 20 }}>
            {(q ? filteredServices : services.slice(0, 8)).map(svc => (
              <View key={svc.id} style={st.svcCard}>
                <TouchableOpacity
                  style={st.svcImageTap}
                  activeOpacity={0.9}
                  onPress={() => setSelectedImage(svc.service_image_url || FALLBACK)}
                >
                  <Image source={{ uri: svc.service_image_url || FALLBACK }} style={st.svcImg} />
                  <LinearGradient colors={['transparent', 'rgba(20,5,50,0.82)']} style={st.svcGrad} />
                  <View style={st.svcZoomBadge}>
                    <Ionicons name="expand-outline" size={13} color="#fff" />
                  </View>
                  <View style={st.svcPriceBadge}>
                    <Text style={st.svcPriceTxt}>₱{Number(svc.price).toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={st.svcInfo}
                  onPress={() => navigation.navigate('ServiceDetailsScreen', { service: svc, userToken })}
                  activeOpacity={0.9}
                >
                  <Text style={st.svcName} numberOfLines={1}>{svc.name}</Text>
                  <View style={st.svcMeta}>
                    <Ionicons name="time-outline" size={11} color="#7c3aad" />
                    <Text style={st.svcDur}>{svc.duration} min</Text>
                  </View>
                  <View style={st.svcActions}>
                    <TouchableOpacity
                      style={st.svcDetailsBtn}
                      onPress={() => navigation.navigate('ServiceDetailsScreen', { service: svc, userToken })}
                      activeOpacity={0.85}
                    >
                      <Text style={st.svcDetailsTxt}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={st.svcBookBtn}
                      onPress={() => navigation.navigate('BookingAppointmentScreen', { preselectedService: svc })}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={[P, P2]} style={st.svcBookGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Ionicons name="calendar-outline" size={12} color="#fff" />
                        <Text style={st.svcBookTxt}>Book Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
        )}

        {/* ── TOP STYLISTS ── */}
        {filteredStylists.length > 0 && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View>
                <Text style={st.secTitle}>Explore Stylists</Text>
                <Text style={st.secSub}>{q ? `${filteredStylists.length} result${filteredStylists.length !== 1 ? 's' : ''}` : 'Skilled & passionate professionals'}</Text>
              </View>
              {!q && (
              <TouchableOpacity style={st.seeAllBtn} onPress={() => navigation.navigate('Stylists')}>
                <Text style={st.seeAllTxt}>See all</Text>
                <Ionicons name="arrow-forward" size={13} color={P2} />
              </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 20 }}>
              {(q ? filteredStylists : stylists.slice(0, 6)).map(sty => (
                <TouchableOpacity key={sty.id} style={st.styCard} onPress={() => navigation.navigate('StylistProfileScreen', { stylist: sty })} activeOpacity={0.88}>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      if (sty.profile_image_url || sty.profile_image) {
                        setSelectedImage(sty.profile_image_url || sty.profile_image);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {(sty.profile_image_url || sty.profile_image)
                      ? <Image source={{ uri: sty.profile_image_url || sty.profile_image }} style={st.styAvImg} />
                      : <LinearGradient colors={[P, P2]} style={st.styAv}><Ionicons name="person" size={30} color="#fff" /></LinearGradient>
                    }
                  </TouchableOpacity>
                  <View style={st.styOnline} />
                  <Text style={st.styName} numberOfLines={1}>{sty.name}</Text>
                  <Text style={st.stySpec} numberOfLines={1}>{sty.specialization}</Text>
                  {sty.years_of_experience != null && (
                    <View style={st.styExpRow}>
                      <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                      <Text style={st.styExpTxt}>{sty.years_of_experience} yrs exp</Text>
                    </View>
                  )}
                  <TouchableOpacity style={st.styViewBtn} onPress={() => navigation.navigate('StylistProfileScreen', { stylist: sty })} activeOpacity={0.8}>
                    <LinearGradient colors={[P, P2]} style={st.styViewGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={st.styViewTxt}>View Profile</Text>
                      <Ionicons name="arrow-forward" size={12} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── SPECIAL OFFERS ── */}
        {filteredPromos.length > 0 && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View>
                <Text style={st.secTitle}>Promos Offers</Text>
                <Text style={st.secSub}>{q ? `${filteredPromos.length} result${filteredPromos.length !== 1 ? 's' : ''}` : 'Limited time deals just for you'}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {filteredPromos.map((promo, idx) => {
                const GRADS = [['#5B21B6','#7C3AED'],['#BE185D','#EC4899'],['#B45309','#F59E0B'],['#065F46','#10B981'],['#1D4ED8','#60A5FA']];
                const grad = GRADS[idx % GRADS.length];
                const daysLeft = Math.ceil((new Date(promo.end_date) - new Date()) / 86400000);
                return (
                  <LinearGradient key={promo.id} colors={grad} style={st.promoCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={[st.promoOrb, { width: 80, height: 80, top: -25, right: -20 }]} />
                    <View style={st.promoBadge}><Text style={st.promoBadgeTxt}>🎉 OFFER</Text></View>
                    <Text style={st.promoDiscount}>{promo.discount_percentage}% OFF</Text>
                    <Text style={st.promoTitle} numberOfLines={1}>{promo.title}</Text>
                    <Text style={st.promoDesc} numberOfLines={1}>{promo.description}</Text>
                    <View style={st.promoFooter}>
                      <View style={st.promoExpiry}>
                        <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.8)" />
                        <Text style={st.promoExpiryTxt}>{daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}</Text>
                      </View>
                      <TouchableOpacity style={st.promoBookBtn} onPress={() => navigation.navigate('BookingAppointmentScreen')} activeOpacity={0.85}>
                        <Text style={st.promoBookTxt}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={11} color={P2} />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── ABOUT ── */}
        {!q && salonInfo && (
        <View style={[st.section, { paddingRight: 20 }]}>
          <View style={st.secHead}>
            <View>
              <Text style={st.secTitle}>About the Salon</Text>
              <Text style={st.secSub}>Find us & get in touch</Text>
            </View>
          </View>

          {/* compact card */}
          <LinearGradient colors={['#1E0A3C', '#3B0764', P]} style={st.aCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {/* decorative orbs */}
            <View style={[st.aOrb, { width: 130, height: 130, top: -40, right: -30 }]} />
            <View style={[st.aOrb, { width: 70, height: 70, bottom: 10, left: -20 }]} />

            {/* header row */}
            <View style={st.aHead}>
              <LinearGradient colors={['rgba(236, 232, 232, 0.94)', 'rgba(184, 149, 250, 0.96)']} style={st.aLogoWrap}>
                <Ionicons name="cut" size={22} color="#aa4edfff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={st.aName}>{salonInfo.name}</Text>
                <Text style={st.aTagline}>{salonInfo.tagline}</Text>
              </View>
              <View style={[st.aOpenPill, salonIsOpen ? st.aOpenPillOpen : st.aOpenPillClosed]}>
                <View style={[st.aOpenDot, salonIsOpen ? st.aOpenDotOpen : st.aOpenDotClosed]} />
                <Text style={[st.aOpenTxt, salonIsOpen ? st.aOpenTxtOpen : st.aOpenTxtClosed]}>
                  {salonIsOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            {/* divider */}
            <View style={st.aDivider} />

            {/* info chips grid */}
            <View style={st.aGrid}>
              {[
                { icon: 'location-outline', emoji: '📍', top: salonInfo.address?.split(',')[0] || '123 Salon St, Brgy. Elegance', bot: salonInfo.address?.split(',')[1] ? salonInfo.address.split(',')[1] + (salonInfo.address.split(',')[2] || '') : 'Quezon City, Metro Manila' },
                  { icon: 'time-outline',     emoji: '🕐', top: hoursLine1, bot: hoursLine2 },
                { icon: 'call-outline',     emoji: '📞', top: salonInfo.phone || '+63 912 345 6789',              bot: 'Call or text anytime' },
                { icon: 'mail-outline',     emoji: '✉️', top: salonInfo.email || 'hello@salonsuite.com',          bot: 'We reply within 24h' },
              ].map((item, i) => (
                <View key={i} style={st.aChip}>
                  <Text style={st.aChipEmoji}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.aChipTop} numberOfLines={1}>{item.top}</Text>
                    <Text style={st.aChipBot} numberOfLines={1}>{item.bot}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={st.aViewBtn} onPress={() => navigation.navigate('AboutScreen')} activeOpacity={0.85}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text style={st.aViewBtnTxt}>About the Salon</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        )}
      </ScrollView>

      {/* ── FLOATING BOOK NOW FAB ── */}
      <Animated.View style={[st.fabWrap, { opacity: fabAnim, transform: [{ translateY: fabAnim.interpolate({ inputRange: [0,1], outputRange: [60, 0] }) }] }]}>
        <TouchableOpacity onPress={() => navigation.navigate('BookingAppointmentScreen')} activeOpacity={0.88} style={st.fabTouch}>
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={st.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={st.fabGlow} />
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={st.fabTxt}>Book Now</Text>
            <View style={st.fabArrow}>
              <Ionicons name="arrow-forward" size={16} color={P2} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── IMAGE VIEWER MODAL ── */}
      {selectedImage && (
        <View style={st.imageViewerOverlay}>
          <TouchableOpacity style={st.imageViewerClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={st.imageViewerImg} resizeMode="contain" />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f3eeff' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3eeff', gap: 12 },
  loadingTxt: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

  hero:     {
    paddingTop: 8,
    paddingHorizontal: 18,
    paddingBottom: 26,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 390,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  heroBg:   { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
  heroImageTint: { position: 'absolute', inset: 0, zIndex: 2 },
  heroGlow: { position: 'absolute', inset: 0, zIndex: 2 },
  heroGoldGlow: { position: 'absolute', inset: 0, zIndex: 2 },
  heroContent: { position: 'relative', zIndex: 3, padding: 16, alignItems: 'flex-end', width: '100%', right: 0 },
  orb:      { position: 'absolute', borderRadius: 999, backgroundColor: '#fff', zIndex: 1 },
  topShell: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f031b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    backdropFilter: 'blur(10px)',
  },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 12 },
  greetingContainer: { flex: 1 },
  greetTxt: { fontSize: 17, color: '#efe7f5', fontWeight: '800', letterSpacing: 0.2, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  nameTxt:  { fontSize: 26, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5, lineHeight: 31, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  greetSubTxt: { fontSize: 12, color: 'rgba(240,230,248,0.95)', marginTop: 4, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  topRight: { flexDirection: 'row', gap: 8 },
  iconBtn:  {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(26,0,48,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerAvatarImg: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },

  quoteContainer: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  quoteBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(89, 5, 126, 0.32)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', shadowColor: '#59057e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  quoteEmoji:{ fontSize: 25, marginBottom: 4, textShadowColor: 'rgba(255,255,255,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  quoteTxt:  { fontSize: 12, color: '#f0f0e3ff', fontStyle: 'normal', fontWeight: '500', letterSpacing: 0.4, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16, maxWidth: '95%', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  heroCta:      { borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 10 },
  heroCtaGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 18 },
  heroCtaLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCtaIcon:  { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  heroCtaTitle: { fontSize: 16, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.3 },
  heroCtaSub:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  heroCtaArrow: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  quickRow:  { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 26, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  quickItem: { alignItems: 'center', gap: 9 },
  quickIcon: { width: 60, height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  quickLabel:{ fontSize: 11, color: '#4B5563', fontWeight: '700', letterSpacing: 0.2 },

  section:   { paddingLeft: 20, marginTop: 30 },
  secHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingRight: 30 },
  secTitle:  { fontSize: 19, fontWeight: '900', color: '#1a0030', letterSpacing: -0.4 },
  secSub:    { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0d0f0', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  seeAllTxt: { fontSize: 12, color: '#1a0030', fontWeight: '700' },

  svcCard:    { width: 176, borderRadius: 22, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9dbf6', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 6 },
  svcImageTap: { width: '100%', height: 124, position: 'relative' },
  svcImg:     { width: '100%', height: '100%' },
  svcGrad:    { ...StyleSheet.absoluteFillObject },
  svcZoomBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(26,0,48,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  svcPriceBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#1a0030', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  svcPriceTxt:   { color: '#fff', fontSize: 12, fontWeight: '800' },
  svcInfo:    { padding: 12 },
  svcName:    { color: '#1a0030', fontSize: 14, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  svcMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  svcDur:     { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  svcActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  svcDetailsBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8bff0',
    backgroundColor: '#f8f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
  },
  svcDetailsTxt: { fontSize: 11, color: '#5b21b6', fontWeight: '700' },
  svcBookBtn: { flex: 1.2, borderRadius: 12, overflow: 'hidden' },
  svcBookGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 14 },
  svcBookTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  styCard:    { width: 148, backgroundColor: '#fff', borderRadius: 24, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5, position: 'relative', borderWidth: 1, borderColor: '#e0d0f0' },
  styAv:      { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 10, backgroundColor: '#e0d0f0' },
  styAvImg:   { width: 68, height: 68, borderRadius: 34, marginBottom: 10, borderWidth: 3, borderColor: '#e0d0f0' },
  styOnline:  { position: 'absolute', top: 22, right: 22, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: '#fff' },
  styName:    { fontSize: 13, fontWeight: '800', color: '#1a0030', textAlign: 'center', letterSpacing: -0.2 },
  stySpec:    { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 3, lineHeight: 14 },
  styExpRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  styExpTxt:  { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  styViewBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden', width: '100%' },
  styViewGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1a0030' },
  styViewTxt: { fontSize: 11, color: '#fff', fontWeight: '800' },

  promoCard:      { width: 185, borderRadius: 20, padding: 16, overflow: 'hidden', position: 'relative', shadowColor: '#a507efff', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 7 },
  promoOrb:       { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  promoBadge:     { backgroundColor: '#1a0030', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 6, borderWidth: 1, borderColor: '#3d0070' },
  promoBadgeTxt:  { fontSize: 9, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  promoDiscount:  { fontSize: 28, fontWeight: '900', color: '#1a0030', letterSpacing: -0.5, lineHeight: 32 },
  promoTitle:     { fontSize: 13, fontWeight: '800', color: '#1a0030', marginTop: 4, marginBottom: 2 },
  promoDesc:      { fontSize: 10, color: '#edeff3ff', lineHeight: 15, marginBottom: 12 },
  promoFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoExpiry:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  promoExpiryTxt: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  promoBookBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a0030', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  promoBookTxt:   { fontSize: 11, fontWeight: '800', color: '#fff' },

  aCard:      { borderRadius: 24, padding: 20, overflow: 'hidden', shadowColor: '#1a0030', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  aOrb:       { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  aHead:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  aLogoWrap:  { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0d0f0', borderWidth: 1, borderColor: '#d4b8e8' },
  aName:      { fontSize: 16, fontWeight: '900', color: '#f1edf5ff', letterSpacing: -0.3 },
  aTagline:   { fontSize: 11, color: '#dbe0ebff', marginTop: 2 },
  aOpenPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  aOpenPillOpen: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
  aOpenPillClosed: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  aOpenDot:   { width: 7, height: 7, borderRadius: 4 },
  aOpenDotOpen: { backgroundColor: '#16A34A' },
  aOpenDotClosed: { backgroundColor: '#DC2626' },
  aOpenTxt:   { fontSize: 11, fontWeight: '800' },
  aOpenTxtOpen: { color: '#166534' },
  aOpenTxtClosed: { color: '#B91C1C' },
  aDivider:   { height: 1, backgroundColor: '#e0d0f0', marginBottom: 16 },
  aGrid:      { gap: 10 },
  aChip:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f3eeff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#e0d0f0' },
  aChipEmoji: { fontSize: 16 },
  aChipTop:   { fontSize: 12, color: '#1a0030', fontWeight: '700' },
  aChipBot:   { fontSize: 10, color: '#6b7280', marginTop: 1 },
  aViewBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124,58,237,0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  aViewBtnTxt: { fontSize: 11, color: '#fff', fontWeight: '700' },

  searchWrap:        {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 2,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(221,198,244,0.95)',
    shadowColor: '#12051f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 7
  },
  searchWrapFocused: { borderColor: '#b794f4', shadowColor: '#7c3aad', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10 },
  searchLeadingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#efe7fb',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput:       { flex: 1, fontSize: 14, color: '#1a0030', fontWeight: '600', padding: 0, placeholderTextColor: '#9ca3af' },
  searchHint: { color: '#8b5cf6', fontSize: 15, marginRight: 2 },

  heroOrb1: { position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(124,58,237,0.25)', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 },
  heroOrb2: { position: 'absolute', bottom: 30, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(139,92,246,0.22)', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 },
  heroOrb3: { position: 'absolute', top: 40, right: 24, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(196,181,221,0.18)', shadowColor: '#c4b5dd', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },

  noResults:    { alignItems: 'center', paddingVertical: 48, gap: 8 },
  noResultsTxt: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  noResultsSub: { fontSize: 12, color: '#9CA3AF' },

  fabWrap:  { position: 'absolute', bottom: 24, left: 20, right: 20 },
  fabTouch: { borderRadius: 28, overflow: 'hidden', shadowColor: '#1a0030', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 14 },
  fab:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 28, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1a0030' },
  fabGlow:  { position: 'absolute', top: -20, left: '30%', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)' },
  fabTxt:   { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  fabArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f1f7ff', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  imageViewerOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 40, right: 20, padding: 10, zIndex: 10000 },
  imageViewerImg: { width: '100%', height: '80%', resizeMode: 'contain' },
});
