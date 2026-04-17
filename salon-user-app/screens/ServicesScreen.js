import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Image, FlatList, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrlAsync } from '../config/api';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const FALLBACK = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=70';
const P = '#1a0030';
const P2 = '#7c3aad';

export default function ServicesScreen({ navigation }) {
  const { userToken } = useAppContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy]     = useState('name');
  const [cart, setCart]         = useState([]); // multi-select cart

  const fetchServices = useCallback(async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/services`);
      if (res.ok) setServices(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services
    .filter(s => {
      const q = search.toLowerCase();
      return !q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return Number(a.price) - Number(b.price);
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      return a.name?.localeCompare(b.name);
    });

  const isInCart = (id) => cart.some(s => s.id === id);

  const toggleCart = (item) => {
    setCart(prev =>
      isInCart(item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]
    );
  };

  const cartTotal = cart.reduce((sum, s) => sum + Number(s.price), 0);
  const cartDuration = cart.reduce((sum, s) => sum + Number(s.duration), 0);

  const goToBooking = () => {
    navigation.navigate('StylistPickerScreen', { selectedServices: cart, userToken });
  };

  const GridCard = ({ item }) => {
    const selected = isInCart(item.id);
    return (
      <TouchableOpacity
        style={[st.gridCard, selected && st.gridCardSelected]}
        onPress={() => navigation.navigate('ServiceDetailsScreen', { service: item, userToken })}
        activeOpacity={0.9}
      >
        <View style={st.gridImgWrap}>
          <Image source={{ uri: item.service_image_url || FALLBACK }} style={st.gridImg} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={st.gridOverlay} />
          <View style={st.gridDurBadge}>
            <Ionicons name="time-outline" size={10} color="#fff" />
            <Text style={st.gridDurTxt}>{item.duration}m</Text>
          </View>
          {/* Add/Remove toggle */}
          <TouchableOpacity
            style={[st.addBtn, selected && st.addBtnActive]}
            onPress={() => toggleCart(item)}
          >
            <Ionicons name={selected ? 'checkmark' : 'add'} size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={st.gridBody}>
          <Text style={st.gridName} numberOfLines={1}>{item.name}</Text>
          <Text style={st.gridDesc} numberOfLines={2}>{item.description || 'Professional salon service'}</Text>
          <View style={st.gridFoot}>
            <Text style={st.gridPrice}>₱{Number(item.price).toLocaleString()}</Text>
            <TouchableOpacity style={st.gridBtn} onPress={() => navigation.navigate('ServiceDetailsScreen', { service: item, userToken })}>
              <Text style={st.gridBtnTxt}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
        {selected && <View style={st.selectedBorder} />}
      </TouchableOpacity>
    );
  };

  const ListCard = ({ item }) => {
    const selected = isInCart(item.id);
    return (
      <TouchableOpacity
        style={[st.listCard, selected && st.listCardSelected]}
        onPress={() => navigation.navigate('ServiceDetailsScreen', { service: item, userToken })}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.service_image_url || FALLBACK }} style={st.listImg} />
        <View style={st.listBody}>
          <Text style={st.listName} numberOfLines={1}>{item.name}</Text>
          <Text style={st.listDesc} numberOfLines={2}>{item.description || 'Professional salon service'}</Text>
          <View style={st.listFoot}>
            <View style={st.listMeta}>
              <Text style={st.listPrice}>₱{Number(item.price).toLocaleString()}</Text>
              <View style={st.listDur}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={st.listDurTxt}>{item.duration} min</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[st.listAddBtn, selected && st.listAddBtnActive]}
              onPress={() => toggleCart(item)}
            >
              <Ionicons name={selected ? 'checkmark' : 'add'} size={14} color={selected ? '#fff' : P} />
              <Text style={[st.listAddTxt, selected && st.listAddTxtActive]}>
                {selected ? 'Added' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={st.center}><ActivityIndicator size="large" color={P} /></View>
  );

  return (
    <View style={st.root}>
      {/* Header */}
      <LinearGradient colors={['#3B0764', P, P2]} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={st.headerRow}>
          <View>
            <Text style={st.headerTitle}>Our Services</Text>
            <Text style={st.headerSub}>{services.length} services available</Text>
          </View>
          {cart.length > 0 && (
            <View style={st.cartBadge}>
              <Ionicons name="cart" size={18} color={P} />
              <Text style={st.cartBadgeNum}>{cart.length}</Text>
            </View>
          )}
        </View>
        {cart.length === 0 && (
          <Text style={st.headerHint}>
            <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.8)" /> Tap + to add multiple services
          </Text>
        )}
      </LinearGradient>

      {/* Search + controls */}
      <View style={st.controls}>
        <View style={st.searchRow}>
          <View style={st.searchBox}>
            <Ionicons name="search-outline" size={16} color="#aaa" />
            <TextInput
              style={st.searchInput}
              placeholder="Search services…"
              placeholderTextColor="#bbb"
              value={search}
              onChangeText={setSearch}
            />
            {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#bbb" /></TouchableOpacity> : null}
          </View>
          <View style={st.viewToggle}>
            <TouchableOpacity style={[st.toggleBtn, viewMode === 'grid' && st.toggleActive]} onPress={() => setViewMode('grid')}>
              <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? P : '#aaa'} />
            </TouchableOpacity>
            <TouchableOpacity style={[st.toggleBtn, viewMode === 'list' && st.toggleActive]} onPress={() => setViewMode('list')}>
              <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? P : '#aaa'} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {[['name', 'A–Z'], ['price_asc', 'Price ↑'], ['price_desc', 'Price ↓']].map(([val, lbl]) => (
            <TouchableOpacity key={val} style={[st.sortChip, sortBy === val && st.sortChipActive]} onPress={() => setSortBy(val)}>
              <Text style={[st.sortTxt, sortBy === val && st.sortTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={st.resultCount}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="search-outline" size={52} color="#ddd" />
          <Text style={st.emptyTxt}>No services found</Text>
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={filtered}
          keyExtractor={i => i.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: cart.length > 0 ? 110 : 16 }}
          renderItem={({ item }) => <GridCard item={item} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key="list"
          data={filtered}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: cart.length > 0 ? 110 : 16 }}
          renderItem={({ item }) => <ListCard item={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating cart bar */}
      {cart.length > 0 && (
        <View style={st.cartBar}>
          <View style={st.cartInfo}>
            <Text style={st.cartCount}>{cart.length} service{cart.length > 1 ? 's' : ''}</Text>
            <Text style={st.cartMeta}>~{cartDuration} min · ₱{cartTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={st.cartClear} onPress={() => setCart([])}>
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={st.cartBtn} onPress={goToBooking}>
            <Text style={st.cartBtnTxt}>Book Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f3eeff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  headerHint:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  cartBadge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartBadgeNum: { fontSize: 14, fontWeight: '800', color: P2 },
  controls: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f3ff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 8, borderWidth: 1, borderColor: '#e0d0f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#1a0030' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#e0d0f0', borderRadius: 12, padding: 3 },
  toggleBtn:  { padding: 7, borderRadius: 9 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  sortChip:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e0d0f0', borderWidth: 1, borderColor: '#d4b8e8' },
  sortChipActive: { backgroundColor: '#1a0030', borderColor: '#1a0030' },
  sortTxt:    { fontSize: 12, color: '#666', fontWeight: '600' },
  sortTxtActive: { color: '#fff' },
  resultCount: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTxt: { color: '#9CA3AF', marginTop: 12, fontSize: 15 },
  // Grid card
  gridCard: { width: CARD_W, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 10, elevation: 5 },
  gridCardSelected: { shadowColor: '#1a0030', shadowOpacity: 0.28, elevation: 9 },
  selectedBorder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, borderWidth: 2.5, borderColor: '#1a0030' },
  gridImgWrap: { position: 'relative' },
  gridImg:  { width: '100%', height: 135 },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 55 },
  gridDurBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.52)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  gridDurTxt: { fontSize: 10, color: '#fff', fontWeight: '600' },
  addBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  addBtnActive: { backgroundColor: '#1a0030' },
  gridBody: { padding: 13 },
  gridName: { fontSize: 14, fontWeight: '800', color: '#1a0030', marginBottom: 4, letterSpacing: -0.2 },
  gridDesc: { fontSize: 11, color: '#9CA3AF', lineHeight: 16, marginBottom: 10 },
  gridFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridPrice: { fontSize: 15, fontWeight: '800', color: '#7c3aad' },
  gridBtn:  { backgroundColor: '#e0d0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  gridBtnTxt: { fontSize: 11, color: '#7c3aad', fontWeight: '700' },
  // List card
  listCard: { backgroundColor: '#fff', borderRadius: 20, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  listCardSelected: { borderWidth: 2.5, borderColor: '#1a0030' },
  listImg:  { width: 112, height: 122 },
  listBody: { flex: 1, padding: 13, justifyContent: 'space-between' },
  listName: { fontSize: 15, fontWeight: '800', color: '#1a0030', letterSpacing: -0.2 },
  listDesc: { fontSize: 12, color: '#9CA3AF', lineHeight: 17, marginTop: 4 },
  listFoot: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listPrice: { fontSize: 15, fontWeight: '800', color: '#7c3aad' },
  listDur:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  listDurTxt: { fontSize: 12, color: '#9CA3AF' },
  listAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#7c3aad', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  listAddBtnActive: { backgroundColor: '#1a0030', borderColor: '#1a0030' },
  listAddTxt: { fontSize: 12, color: '#7c3aad', fontWeight: '700' },
  listAddTxtActive: { color: '#fff' },
  // Cart bar
  cartBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 14, gap: 10 },
  cartInfo: { flex: 1 },
  cartCount: { fontSize: 15, fontWeight: '800', color: '#1a0030' },
  cartMeta:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cartClear: { padding: 8 },
  cartBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a0030', paddingHorizontal: 20, paddingVertical: 13, borderRadius: 16 },
  cartBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
