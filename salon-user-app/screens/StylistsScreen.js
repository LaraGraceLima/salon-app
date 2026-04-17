import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useAppContext } from '../context/AppContext';

export default function StylistsScreen({ navigation }) {
  const { userToken } = useAppContext();
  const [stylists, setStylists] = useState([]);
  const [filteredStylists, setFilteredStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [stylistRatings, setStylistRatings] = useState({});

  useEffect(() => {
    fetchStylists();
  }, []);

  useEffect(() => {
    filterStylists();
  }, [searchQuery, selectedFilter, stylists]);

  const fetchStylists = async () => {
    try {
      const apiUrl = await getApiUrlAsync();
      const response = await fetch(`${apiUrl}/api/stylists`);
      const data = await response.json();
      setStylists(data);
      setFilteredStylists(data);

      const ratingsData = {};
      for (const stylist of data) {
        try {
          const ratingResponse = await fetch(`${apiUrl}/api/stylists/${stylist.id}/ratings`);
          if (ratingResponse.ok) {
            const ratings = await ratingResponse.json();
            if (ratings.length > 0) {
              const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
              ratingsData[stylist.id] = { average: avgRating, count: ratings.length };
            }
          }
        } catch (_) {}
      }
      setStylistRatings(ratingsData);
    } catch (error) {
      console.error('Error fetching stylists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStylists = () => {
    let filtered = stylists;
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(
        (s) => s.specialization.toLowerCase() === selectedFilter.toLowerCase()
      );
    }
    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredStylists(filtered);
  };

  const specializations = ['all', 'Hair Cutting', 'Hair Coloring', 'Styling'];

  const renderStars = (stylistId) => {
    const data = stylistRatings[stylistId];
    if (!data) return null;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.round(data.average) ? 'star' : 'star-outline'}
            size={13}
            color={star <= Math.round(data.average) ? '#ffc107' : '#ddd'}
          />
        ))}
        <Text style={styles.ratingText}>
          {data.average.toFixed(1)} ({data.count})
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading stylists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1a0030', '#3d0070', '#7c3aad']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Our Stylists</Text>
            <Text style={styles.headerSubtitle}>
              {filteredStylists.length} professional{filteredStylists.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="cut" size={28} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        {/* Search Bar inside header */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stylists..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {specializations.map((spec) => (
            <TouchableOpacity
              key={spec}
              style={[styles.filterChip, selectedFilter === spec && styles.filterChipActive]}
              onPress={() => setSelectedFilter(spec)}
            >
              {selectedFilter === spec && (
                <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.filterChipText, selectedFilter === spec && styles.filterChipTextActive]}>
                {spec === 'all' ? 'All' : spec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stylists List */}
        <View style={styles.listContainer}>
          {filteredStylists.length > 0 ? (
            filteredStylists.map((stylist) => (
              <TouchableOpacity
                key={stylist.id}
                style={styles.stylistCard}
                onPress={() => navigation.navigate('StylistProfileScreen', { stylist })}
                activeOpacity={0.85}
              >
                {/* Top accent bar */}
                <LinearGradient
                  colors={['#1a0030', '#7c3aad']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardAccent}
                />

                <View style={styles.cardContent}>
                  {/* Avatar */}
                  <View style={styles.avatarWrapper}>
                    <LinearGradient colors={['#1a0030', '#7c3aad']} style={styles.avatarGradient}>
                      <Ionicons name="person" size={42} color="#fff" />
                    </LinearGradient>
                    <View style={[
                      styles.onlineDot,
                      { backgroundColor: stylist.status === 'active' ? '#4CAF50' : '#e74c3c' }
                    ]} />
                  </View>

                  {/* Info */}
                  <View style={styles.infoContainer}>
                    <Text style={styles.stylistName}>{stylist.name}</Text>

                    <View style={styles.tagRow}>
                      <View style={styles.specTag}>
                        <Ionicons name="cut" size={12} color="#1a0030" />
                        <Text style={styles.specTagText}>{stylist.specialization}</Text>
                      </View>
                    </View>

                    {renderStars(stylist.id)}

                    <View style={styles.metaRow}>
                      <Ionicons name="call-outline" size={13} color="#aaa" />
                      <Text style={styles.metaText}>{stylist.phone}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons
                        name={stylist.status === 'active' ? 'checkmark-circle' : 'close-circle'}
                        size={13}
                        color={stylist.status === 'active' ? '#4CAF50' : '#e74c3c'}
                      />
                      <Text style={[
                        styles.metaText,
                        { color: stylist.status === 'active' ? '#4CAF50' : '#e74c3c' }
                      ]}>
                        {stylist.status === 'active' ? 'Available Now' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrowContainer}>
                  <LinearGradient colors={['#1a0030', '#7c3aad']} style={styles.arrowBtn}>
                      <Ionicons name="chevron-forward" size={18} color="#fff" />
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <LinearGradient colors={['#E5E7EB', '#F3F4F6']} style={styles.emptyIcon}>
                <Ionicons name="search" size={40} color="#bbb" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No stylists found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3eeff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3eeff' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#9CA3AF', fontWeight: '600' },

  header: {
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1a0030' },

  filterContainer: { paddingVertical: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d4b8e8',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#1a0030', borderColor: '#1a0030' },
  filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  listContainer: { paddingHorizontal: 16, paddingBottom: 30 },

  stylistCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1a0030',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 7,
  },
  cardAccent: { height: 4 },
  cardContent: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
  },

  avatarWrapper: { position: 'relative', marginRight: 16 },
  avatarGradient: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a0030',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#1a0030',
  },

  infoContainer: { flex: 1 },
  stylistName: { fontSize: 17, fontWeight: '800', color: '#1a0030', marginBottom: 6, letterSpacing: -0.2 },
  tagRow: { flexDirection: 'row', marginBottom: 6 },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0d0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  specTagText: { fontSize: 12, color: '#1a0030', fontWeight: '700', marginLeft: 4 },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 2 },
  ratingText: { fontSize: 12, color: '#9CA3AF', marginLeft: 6, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText: { fontSize: 12, color: '#9CA3AF', marginLeft: 6 },

  arrowContainer: { marginLeft: 10 },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#e0d0f0',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#6B7280', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#D1D5DB' },
});
