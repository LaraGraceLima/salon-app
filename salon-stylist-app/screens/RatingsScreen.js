import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

const P = '#7C3AED';

const Stars = ({ rating, size = 16 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Ionicons key={s} name={s <= rating ? 'star' : 'star-outline'} size={size} color={s <= rating ? '#FBBF24' : '#D1D5DB'} />
    ))}
  </View>
);

export default function RatingsScreen({ route }) {
  const { stylistToken } = route.params || {};
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (stylistToken) fetchRatings();
    }, [stylistToken])
  );

  const fetchRatings = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/stylists/ratings`, {
        headers: { Authorization: `Bearer ${stylistToken}` },
      });
      if (res.ok) setRatings(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const total = ratings.length;
  const avg = total > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
    pct: total > 0 ? (ratings.filter(r => r.rating === star).length / total) * 100 : 0,
  }));

  const renderItem = ({ item }) => (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={st.avatar}>
          <Text style={st.avatarTxt}>{(item.clientName || 'C')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.clientName}>{item.clientName}</Text>
          <Text style={st.serviceName}>{item.serviceName}</Text>
        </View>
        <View style={st.ratingBadge}>
          <Ionicons name="star" size={13} color="#FBBF24" />
          <Text style={st.ratingBadgeTxt}>{item.rating}.0</Text>
        </View>
      </View>
      <Stars rating={item.rating} size={15} />
      {item.review ? (
        <View style={st.reviewBox}>
          <Text style={st.reviewTxt}>"{item.review}"</Text>
        </View>
      ) : null}
      <Text style={st.dateTxt}>{new Date(item.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
    </View>
  );

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={P} /></View>;

  return (
    <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.root} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={st.headerInner}>
          {/* Big average */}
          <View style={st.avgBlock}>
            <Text style={st.avgNum}>{avg.toFixed(1)}</Text>
            <Stars rating={Math.round(avg)} size={20} />
            <Text style={st.avgSub}>{total} review{total !== 1 ? 's' : ''}</Text>
          </View>
          {/* Breakdown bars */}
          <View style={st.breakdown}>
            {breakdown.map(({ star, count, pct }) => (
              <View key={star} style={st.barRow}>
                <Text style={st.barLabel}>{star}</Text>
                <Ionicons name="star" size={11} color="#FBBF24" />
                <View style={st.barTrack}>
                  <View style={[st.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={st.barCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {ratings.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="star-outline" size={60} color="#D1D5DB" />
          <Text style={st.emptyTxt}>No reviews yet</Text>
          <Text style={st.emptySub}>Complete appointments to receive feedback</Text>
        </View>
      ) : (
        <FlatList
          data={ratings}
          renderItem={renderItem}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  headerInner: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avgBlock: { alignItems: 'center', minWidth: 80 },
  avgNum:  { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52 },
  avgSub:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  breakdown: { flex: 1, gap: 5 },
  barRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barLabel: { fontSize: 12, color: '#fff', fontWeight: '700', width: 10, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', backgroundColor: '#FBBF24', borderRadius: 3 },
  barCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)', width: 16, textAlign: 'right' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '800', color: P },
  clientName:  { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  serviceName: { fontSize: 12, color: P, fontWeight: '600', marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingBadgeTxt: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  reviewBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginTop: 10, borderLeftWidth: 3, borderLeftColor: P },
  reviewTxt: { fontSize: 13, color: '#4B5563', lineHeight: 19, fontStyle: 'italic' },
  dateTxt: { fontSize: 11, color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTxt: { fontSize: 17, color: '#6B7280', marginTop: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
});
