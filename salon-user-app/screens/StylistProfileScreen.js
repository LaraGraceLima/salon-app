import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';

const { width } = Dimensions.get('window');
const P  = '#7C3AED';
const P2 = '#A855F7';

function Stars({ rating, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={s <= Math.round(rating) ? '#FFC107' : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

export default function StylistProfileScreen({ route, navigation }) {
  const { stylist } = route.params;
  const [ratings, setRatings]   = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const api = await getApiUrlAsync();
        const res = await fetch(`${api}/api/stylists/${stylist.id}/ratings`);
        if (res.ok) {
          const data = await res.json();
          setRatings(data);
          if (data.length > 0)
            setAvgRating(data.reduce((s, r) => s + r.rating, 0) / data.length);
        }
      } catch (e) { console.log(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <View style={st.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── HERO ── */}
        <LinearGradient colors={[P, P2, '#C084FC']} style={st.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[st.orb, { width: 180, height: 180, top: -60, right: -50, opacity: 0.12 }]} />
          <View style={[st.orb, { width: 100, height: 100, bottom: 10, left: 10, opacity: 0.1 }]} />

          <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={st.avatarWrap}>
            {(stylist.profile_image_url || stylist.profile_image)
              ? <Image source={{ uri: stylist.profile_image_url || stylist.profile_image }} style={st.avatar} />
              : (
                <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={st.avatarPlaceholder}>
                  <Ionicons name="person" size={52} color="#fff" />
                </LinearGradient>
              )
            }
            {stylist.status === 'active' && <View style={st.onlineDot} />}
          </View>

          <Text style={st.heroName}>{stylist.name}</Text>

          <View style={st.heroSpecRow}>
            <Ionicons name="cut" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={st.heroSpec}>{stylist.specialization}</Text>
          </View>

          {avgRating > 0 && (
            <View style={st.heroRatingRow}>
              <Stars rating={avgRating} size={14} />
              <Text style={st.heroRatingTxt}>{avgRating.toFixed(1)} · {ratings.length} reviews</Text>
            </View>
          )}

          <View style={st.statusPill}>
            <View style={[st.statusDot, { backgroundColor: stylist.status === 'active' ? '#4ADE80' : '#F87171' }]} />
            <Text style={st.statusTxt}>{stylist.status === 'active' ? 'Available' : 'Unavailable'}</Text>
          </View>
        </LinearGradient>

        <View style={st.body}>

          {/* ── STATS ROW ── */}
          <View style={st.statsRow}>
            {stylist.years_of_experience != null && (
              <View style={st.statItem}>
                <View style={[st.statIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="time" size={18} color={P} />
                </View>
                <Text style={st.statVal}>{stylist.years_of_experience}</Text>
                <Text style={st.statLbl}>Years Exp.</Text>
              </View>
            )}
            <View style={st.statItem}>
              <View style={[st.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={18} color="#D97706" />
              </View>
              <Text style={st.statVal}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
              <Text style={st.statLbl}>Rating</Text>
            </View>
            <View style={st.statItem}>
              <View style={[st.statIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="chatbubbles" size={18} color="#16A34A" />
              </View>
              <Text style={st.statVal}>{ratings.length}</Text>
              <Text style={st.statLbl}>Reviews</Text>
            </View>
          </View>

          {/* ── ABOUT ── */}
          {stylist.bio ? (
            <View style={st.card}>
              <View style={st.cardTitleRow}>
                <View style={[st.cardIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="person-outline" size={16} color={P} />
                </View>
                <Text style={st.cardTitle}>About</Text>
              </View>
              <Text style={st.bioTxt}>{stylist.bio}</Text>
            </View>
          ) : null}

          {/* ── ACHIEVEMENTS ── */}
          {stylist.achievements ? (
            <View style={st.card}>
              <View style={st.cardTitleRow}>
                <View style={[st.cardIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="trophy" size={16} color="#D97706" />
                </View>
                <Text style={st.cardTitle}>Achievements</Text>
              </View>
              {stylist.achievements.split('\n').filter(Boolean).map((item, i) => (
                <View key={i} style={st.achieveRow}>
                  <View style={st.achieveDot}>
                    <Ionicons name="trophy" size={12} color="#D97706" />
                  </View>
                  <Text style={st.achieveTxt}>{item.trim()}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── REVIEWS ── */}
          <View style={st.card}>
            <View style={st.cardTitleRow}>
              <View style={[st.cardIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="chatbubble-outline" size={16} color="#DC2626" />
              </View>
              <Text style={st.cardTitle}>Client Reviews</Text>
              {ratings.length > 0 && (
                <View style={st.reviewCountBadge}>
                  <Text style={st.reviewCountTxt}>{ratings.length}</Text>
                </View>
              )}
            </View>

            {loading ? (
              <ActivityIndicator color={P} style={{ marginVertical: 16 }} />
            ) : ratings.length === 0 ? (
              <View style={st.emptyReviews}>
                <Ionicons name="chatbubble-outline" size={36} color="#D1D5DB" />
                <Text style={st.emptyTxt}>No reviews yet</Text>
              </View>
            ) : (
              ratings.slice(0, 5).map((r, i) => (
                <View key={i} style={[st.reviewCard, i < ratings.length - 1 && { marginBottom: 12 }]}>
                  <View style={st.reviewTop}>
                    <View style={st.reviewAvatar}>
                      <Ionicons name="person" size={16} color={P} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.reviewerName}>{r.clientName || r.client_name || 'Client'}</Text>
                      <Stars rating={r.rating} size={12} />
                    </View>
                    <Text style={st.reviewRating}>{r.rating}.0</Text>
                  </View>
                  {r.comment ? <Text style={st.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3FF' },

  // Hero
  hero:       { paddingTop: 54, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20, overflow: 'hidden' },
  orb:        { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  backBtn:    { position: 'absolute', top: 54, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar:     { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  onlineDot:  { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#4ADE80', borderWidth: 2.5, borderColor: '#fff' },
  heroName:   { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  heroSpecRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  heroSpec:   { fontSize: 14, color: 'rgba(255,255,255,0.88)', fontWeight: '600' },
  heroRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  heroRatingTxt: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusTxt:  { fontSize: 13, color: '#fff', fontWeight: '700' },

  // Body
  body: { padding: 16 },

  // Stats
  statsRow:  { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: P, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, justifyContent: 'space-around' },
  statItem:  { alignItems: 'center', gap: 6 },
  statIcon:  { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statVal:   { fontSize: 20, fontWeight: '900', color: '#1E1B4B' },
  statLbl:   { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  // Cards
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: P, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon:     { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: '#1E1B4B', flex: 1 },
  bioTxt:       { fontSize: 14, color: '#6B7280', lineHeight: 22 },

  // Achievements
  achieveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  achieveDot: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  achieveTxt: { fontSize: 14, color: '#374151', flex: 1, lineHeight: 20 },

  // Reviews
  reviewCountBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  reviewCountTxt:   { fontSize: 11, color: P, fontWeight: '700' },
  emptyReviews: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyTxt:     { fontSize: 13, color: '#9CA3AF' },
  reviewCard:   { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14 },
  reviewTop:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#1E1B4B', marginBottom: 3 },
  reviewRating: { fontSize: 14, fontWeight: '800', color: '#D97706' },
  reviewComment:{ fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
