import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';

export default function StylistsForServiceScreen({ route, navigation }) {
  const { serviceId, serviceName, userToken } = route.params || {};
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stylistRatings, setStylistRatings] = useState({});

  useEffect(() => {
    fetchStylists();
  }, [serviceId]);

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const apiUrl = await getApiUrlAsync();
      // Use the new filtered endpoint
      const response = await fetch(`${apiUrl}/api/stylists/by-service/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Stylists fetched for service ${serviceName}:`, data.length);
        setStylists(data);
        
        // Fetch ratings for each stylist
        const ratingsData = {};
        for (const stylist of data) {
          try {
            const ratingResponse = await fetch(`${apiUrl}/api/stylists/${stylist.id}/ratings`);
            if (ratingResponse.ok) {
              const ratings = await ratingResponse.json();
              if (ratings.length > 0) {
                const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
                ratingsData[stylist.id] = {
                  average: avgRating,
                  count: ratings.length
                };
              }
            }
          } catch (error) {
            console.log(`No ratings found for stylist ${stylist.id}`);
          }
        }
        setStylistRatings(ratingsData);
      } else {
        console.error('Failed to fetch stylists:', response.status);
        Alert.alert('Error', 'Failed to load stylists for this service');
      }
    } catch (error) {
      console.error('Error fetching stylists:', error);
      Alert.alert('Error', 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStylist = ({ item }) => (
    <View style={styles.stylistCard}>
      <View style={styles.stylistHeader}>
        <View style={styles.avatarContainer}>
          <LinearGradient 
            colors={['#667eea', '#764ba2']} 
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.stylistInfo}>
          <Text style={styles.stylistName}>{item.name}</Text>
          <View style={styles.specializationRow}>
            <Ionicons name="cut" size={14} color="#667eea" />
            <Text style={styles.specialization}>{item.specialization}</Text>
          </View>
          <View style={styles.ratingContainer}>
            {stylistRatings[item.id] ? (
              <>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(stylistRatings[item.id].average) ? 'star' : 'star-outline'}
                      size={14}
                      color={star <= Math.round(stylistRatings[item.id].average) ? '#ffc107' : '#ddd'}
                    />
                  ))}
                </View>
                <Text style={styles.rating}>
                  {stylistRatings[item.id].average.toFixed(1)} ({stylistRatings[item.id].count} reviews)
                </Text>
              </>
            ) : (
              <Text style={styles.rating}>No ratings yet</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.stylistDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#667eea" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.detailText, { color: '#4CAF50' }]}>
            {item.status === 'active' ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>Stylists for</Text>
        <Text style={styles.serviceName}>{serviceName}</Text>
      </LinearGradient>

      {stylists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No stylists available</Text>
        </View>
      ) : (
        <FlatList
          data={stylists}
          renderItem={renderStylist}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  stylistCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  stylistHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  specializationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialization: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 6,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  rating: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  stylistDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
    fontWeight: '500',
  },
});
