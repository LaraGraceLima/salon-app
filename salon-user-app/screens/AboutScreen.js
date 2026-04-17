import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useState, useEffect } from 'react';

export default function AboutScreen() {
  const [salonInfo, setSalonInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchSalonInfo();
  }, []);

  const fetchSalonInfo = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/salon-info`);
      if (res.ok) {
        const data = await res.json();
        setSalonInfo(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatBusinessHours = (hoursInput) => {
    if (!hoursInput) return ['Mon-Sat: 8AM-8PM', 'Sunday: 9AM-6PM'];
    const hours = Array.isArray(hoursInput)
      ? hoursInput
      : Object.entries(hoursInput).map(([day, value]) => ({ day, ...value }));
    const fmt = (v) => {
      const [hh, mm] = String(v || '00:00').split(':').map(Number);
      const period = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh % 12 || 12;
      return mm ? `${h12}:${String(mm).padStart(2, '0')}${period}` : `${h12}${period}`;
    };
    const monSat = hours.find(h => h.day === 'Monday') || hours.find(h => h.open);
    const sunday = hours.find(h => h.day === 'Sunday');
    const line1 = monSat ? `Mon-Sat: ${monSat.open ? `${fmt(monSat.from)}-${fmt(monSat.to)}` : 'Closed'}` : 'Hours vary';
    const line2 = sunday ? `Sunday: ${sunday.open ? `${fmt(sunday.from)}-${fmt(sunday.to)}` : 'Closed'}` : 'Sunday: Closed';
    return [line1, line2];
  };

  const [hours1, hours2] = formatBusinessHours(salonInfo?.business_hours);
  const aboutText = salonInfo?.about_us || 'Welcome to BeautyBoss Salon, where elegance meets expertise. We are passionate about helping you look and feel your best through top-tier salon services and personalized care.';
  const salonImages = Array.isArray(salonInfo?.salon_images) ? salonInfo.salon_images.filter(Boolean) : [];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f3eeff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={st.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1a0030', '#2d0050', '#3d0070']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={st.headerContent}>
            <Ionicons name="cut" size={48} color="#fff" />
            <Text style={st.headerTitle}>About Us</Text>
            <Text style={st.headerSub}>Your trusted beauty destination</Text>
          </View>
        </LinearGradient>

        {/* About Section */}
        <View style={st.section}>
          <View style={st.card}>
            <Text style={st.sectionTitle}>Who We Are</Text>
            <Text style={st.sectionText}>{aboutText}</Text>
            <Text style={st.sectionText}>
              Our team of skilled stylists and beauty professionals is dedicated to delivering exceptional results that exceed your expectations.
            </Text>
          </View>
        </View>

        {/* Salon Info Section */}
        {salonInfo && (
          <View style={st.section}>
            <View style={st.card}>
              <Text style={st.sectionTitle}>Visit Us</Text>
              
              <View style={st.infoRow}>
                <View style={st.infoIconWrap}>
                  <Ionicons name="location" size={20} color="#7c3aed" />
                </View>
                <View style={st.infoText}>
                  <Text style={st.infoLabel}>Address</Text>
                  <Text style={st.infoValue}>{salonInfo.address || '123 Salon St, Brgy. Elegance'}</Text>
                </View>
              </View>

              <View style={st.infoRow}>
                <View style={st.infoIconWrap}>
                  <Ionicons name="call" size={20} color="#7c3aed" />
                </View>
                <View style={st.infoText}>
                  <Text style={st.infoLabel}>Phone</Text>
                  <Text style={st.infoValue}>{salonInfo.phone || '+63 912 345 6789'}</Text>
                </View>
              </View>

              <View style={st.infoRow}>
                <View style={st.infoIconWrap}>
                  <Ionicons name="mail" size={20} color="#7c3aed" />
                </View>
                <View style={st.infoText}>
                  <Text style={st.infoLabel}>Email</Text>
                  <Text style={st.infoValue}>{salonInfo.email || 'hello@salonsuite.com'}</Text>
                </View>
              </View>

              <View style={st.infoRow}>
                <View style={st.infoIconWrap}>
                  <Ionicons name="time" size={20} color="#7c3aed" />
                </View>
                <View style={st.infoText}>
                  <Text style={st.infoLabel}>Hours</Text>
                  <Text style={st.infoValue}>{hours1}</Text>
                  <Text style={st.infoValue}>{hours2}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Salon Places Gallery */}
        {salonImages.length > 0 && (
          <View style={st.section}>
            <View style={st.card}>
              <Text style={st.sectionTitle}>Salon Places</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {salonImages.map((img, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setSelectedImage(img)} activeOpacity={0.85}>
                    <Image source={{ uri: img }} style={st.placeImg} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Services Section */}
        <View style={st.section}>
          <View style={st.card}>
            <Text style={st.sectionTitle}>Our Services</Text>
            <Text style={st.sectionText}>
              We offer a wide range of premium services including:
            </Text>
            <View style={st.servicesList}>
              <View style={st.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={st.serviceText}>Haircuts & Styling</Text>
              </View>
              <View style={st.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={st.serviceText}>Coloring & Highlights</Text>
              </View>
              <View style={st.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={st.serviceText}>Manicure & Pedicure</Text>
              </View>
              <View style={st.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={st.serviceText}>Facials & Skincare</Text>
              </View>
              <View style={st.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={st.serviceText}>Massage & Spa Treatments</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mission Section */}
        <View style={st.section}>
          <View style={st.card}>
            <Text style={st.sectionTitle}>Our Mission</Text>
            <Text style={st.sectionText}>
              To enhance your natural beauty through professional excellence, personalized service, and a relaxing environment. We believe every visit should be an experience you look forward to.
            </Text>
          </View>
        </View>

        {/* Contact CTA */}
        <View style={st.ctaSection}>
          <Text style={st.ctaTitle}>Ready for your beauty transformation?</Text>
          <Text style={st.ctaSub}>Visit us at the salon for your beauty needs</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  root: { flex: 1, backgroundColor: '#f3eeff' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 30, 
    alignItems: 'center', 
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 10 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  section: { padding: 16, marginTop: 8 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a0030', marginBottom: 12 },
  sectionText: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 12 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#e0d0f0', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 13, color: '#1a0030', fontWeight: '500' },
  placeImg: { width: 180, height: 120, borderRadius: 12, backgroundColor: '#e5e7eb' },
  
  servicesList: { gap: 10 },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceText: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  
  ctaSection: { padding: 20, marginTop: 8, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#1a0030', marginBottom: 6, textAlign: 'center' },
  ctaSub: { fontSize: 14, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  imageViewerOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 40, right: 20, padding: 10, zIndex: 10000 },
  imageViewerImg: { width: '100%', height: '80%', resizeMode: 'contain' },
});
