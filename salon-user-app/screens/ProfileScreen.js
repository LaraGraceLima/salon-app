import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch, Image, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getApiUrlAsync } from '../config/api';

const P = '#1a0030';
const P2 = '#3d0070';

export default function ProfileScreen() {
  const { userName, userEmail, userToken, userProfileImage, setUserProfileImage, onLogout } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(userName || 'User');
  const [email, setEmail]     = useState(userEmail || '');
  const [phone, setPhone]     = useState('');
  const [profileImage, setProfileImage] = useState(userProfileImage || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notifs, setNotifs]   = useState(true);
  const [emailRem, setEmailRem] = useState(false);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) return;
      try {
        const api = await getApiUrlAsync();
        const res = await fetch(`${api}/api/users/profile`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || userName || 'User');
          setEmail(data.email || userEmail || '');
          setPhone(data.phone || '');
          setProfileImage(data.profile_image_url || userProfileImage || null);
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
    };
    fetchProfile();
  }, [userToken, userName, userEmail, userProfileImage]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => onLogout?.() },
    ]);
  };

  const handleSave = async () => {
    try {
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      Alert.alert('Saved', 'Profile updated successfully!');
      setEditing(false);
    } catch (e) {
      console.error('Error updating profile:', e);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleUpdateProfileImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const ext = asset.uri?.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      let base64Data = asset.base64;
      if (!base64Data && asset.uri) {
        base64Data = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      }
      if (!base64Data) throw new Error('No image data');
      const img = `data:${mime};base64,${base64Data}`;

      setUploadingImage(true);
      const api = await getApiUrlAsync();
      const res = await fetch(`${api}/api/users/profile-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ profile_image_url: img }),
      });

      if (!res.ok) throw new Error('Failed to update profile image');
      setProfileImage(img);
      setUserProfileImage?.(img);
      Alert.alert('Updated', 'Profile image updated successfully.');
    } catch (e) {
      console.error('Error updating profile image:', e);
      Alert.alert('Error', 'Failed to update profile image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const MenuItem = ({ icon, label, onPress, danger, right }) => (
    <TouchableOpacity style={st.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[st.menuIcon, danger && st.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? '#DC2626' : P2} />
      </View>
      <Text style={[st.menuLabel, danger && st.menuLabelDanger]}>{label}</Text>
      {right || <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
    </TouchableOpacity>
  );

  return (
    <View style={st.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1a0030', '#2d0050', '#3d0070']} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={st.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={st.avatarImg} />
            ) : (
              <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.08)']} style={st.avatar}>
                <Ionicons name="person" size={48} color="#fff" />
              </LinearGradient>
            )}
            <TouchableOpacity style={st.editAvatarBtn} onPress={handleUpdateProfileImage} disabled={uploadingImage}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={st.headerName}>{name}</Text>
          <Text style={st.headerEmail}>{email}</Text>
          <View style={st.headerBadge}>
            <Ionicons name="fireworks" size={12} color="#FCD34D" />
            <Text style={st.headerBadgeTxt}>HELLO</Text>
          </View>
        </LinearGradient>

        <View style={st.content}>
          {/* Personal Info */}
          <View style={st.section}>
            <View style={st.secHead}>
              <Text style={st.secTitle}>Personal Information</Text>
              <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} style={st.editBtn}>
                <Ionicons name={editing ? 'checkmark' : 'pencil'} size={14} color="#fff" />
                <Text style={st.editBtnTxt}>{editing ? 'Save' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>

            {[
              { icon: 'person-outline',  label: 'Full Name',  val: name,  set: setName,  key: 'name' },
              { icon: 'mail-outline',    label: 'Email',      val: email, set: setEmail, key: 'email', kb: 'email-address' },
              { icon: 'call-outline',    label: 'Phone',      val: phone, set: setPhone, key: 'phone', kb: 'phone-pad' },
            ].map(f => (
              <View key={f.key} style={st.field}>
                <View style={[st.fieldIcon, { backgroundColor: '#e0d0f0' }]}><Ionicons name={f.icon} size={16} color="#1a0030" /></View>
                <View style={st.fieldBody}>
                  <Text style={st.fieldLabel}>{f.label}</Text>
                  {editing ? (
                    <TextInput
                      style={st.fieldInput}
                      value={f.val}
                      onChangeText={f.set}
                      keyboardType={f.kb || 'default'}
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={st.fieldVal}>{f.val || '—'}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Notifications */}
          <View style={st.section}>
            <Text style={st.secTitle}>Notifications</Text>
            <View style={st.menuItem}>
              <View style={[st.menuIcon, { backgroundColor: '#e0d0f0' }]}><Ionicons name="notifications-outline" size={18} color="#1a0030" /></View>
              <Text style={st.menuLabel}>Push Notifications</Text>
              <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: P2 }} thumbColor="#fff" />
            </View>
            <View style={st.menuItem}>
              <View style={[st.menuIcon, { backgroundColor: '#e0d0f0' }]}><Ionicons name="mail-outline" size={18} color="#1a0030" /></View>
              <Text style={st.menuLabel}>Email Reminders</Text>
              <Switch value={emailRem} onValueChange={setEmailRem} trackColor={{ true: P2 }} thumbColor="#fff" />
            </View>
          </View>

          {/* Account */}
          <View style={st.section}>
            <Text style={st.secTitle}>Account</Text>
            <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => Alert.alert('Coming soon', 'Password change will be available soon.')} />
            <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => Alert.alert('Support', 'Contact us at support@salon.com')} />
            <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => setLegalModal('terms')} />
            <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => setLegalModal('privacy')} />
          </View>

          {/* Logout */}
          <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={st.logoutTxt}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Legal Modal */}
      <Modal visible={!!legalModal} animationType="slide" transparent onRequestClose={() => setLegalModal(null)}>
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>
                {legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </Text>
              <TouchableOpacity onPress={() => setLegalModal(null)} style={st.modalClose}>
                <Ionicons name="close" size={22} color="#1a0030" />
              </TouchableOpacity>
            </View>
            <ScrollView style={st.modalBody} showsVerticalScrollIndicator={false}>
              {legalModal === 'terms' ? (
                <Text style={st.modalText}>
                  {`Welcome to our Salon App. By using this application, you agree to the following terms:\n\n1. Use of Service\nThis app is provided for booking salon services. You must be at least 13 years old to use this service.\n\n2. Account Responsibility\nYou are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.\n\n3. Bookings & Cancellations\nBookings are subject to availability. Cancellations must be made at least 24 hours in advance to avoid charges.\n\n4. Prohibited Conduct\nYou agree not to misuse the service, submit false information, or engage in any unlawful activity.\n\n5. Changes to Terms\nWe reserve the right to update these terms at any time. Continued use of the app constitutes acceptance of the revised terms.\n\n6. Contact\nFor questions about these terms, contact us at support@salon.com.`}
                </Text>
              ) : (
                <Text style={st.modalText}>
                  {`Your privacy is important to us. This policy explains how we collect and use your information.\n\n1. Information We Collect\nWe collect your name, email, phone number, and booking history to provide our services.\n\n2. How We Use Your Information\nYour information is used to manage bookings, send reminders, and improve our services. We do not sell your data to third parties.\n\n3. Profile Images\nProfile images you upload are stored securely and used only to personalize your account.\n\n4. Notifications\nWith your consent, we may send push notifications and email reminders about your bookings.\n\n5. Data Security\nWe implement industry-standard security measures to protect your personal information.\n\n6. Data Retention\nWe retain your data for as long as your account is active or as needed to provide services.\n\n7. Your Rights\nYou may request access to, correction of, or deletion of your personal data at any time by contacting support@salon.com.\n\n8. Changes to This Policy\nWe may update this policy periodically. We will notify you of significant changes via the app.`}
                </Text>
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3eeff' },
  header: { paddingTop: 54, paddingBottom: 34, alignItems: 'center', paddingHorizontal: 20 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarImg: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#7c3aad', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#fff' },
  headerName:  { fontSize: 23, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: -0.4 },
  headerEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  headerBadgeTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  content: { padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  secTitle: { fontSize: 15, fontWeight: '800', color: '#1a0030', marginBottom: 14, letterSpacing: -0.2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a0030', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editBtnTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f3eeff' },
  fieldIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#f3eeff', justifyContent: 'center', alignItems: 'center' },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldVal:   { fontSize: 14, color: '#1a0030', fontWeight: '600' },
  fieldInput: { fontSize: 14, color: '#1a0030', fontWeight: '600', borderBottomWidth: 1.5, borderBottomColor: '#1a0030', paddingVertical: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f3eeff' },
  menuIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#f3eeff', justifyContent: 'center', alignItems: 'center' },
  menuIconDanger: { backgroundColor: '#fee2e2' },
  menuLabel: { flex: 1, fontSize: 14, color: '#1a0030', fontWeight: '600' },
  menuLabelDanger: { color: '#dc2626' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#dc2626', paddingVertical: 17, borderRadius: 18, marginTop: 4, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  logoutTxt: { fontSize: 15, color: '#fff', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,0,48,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: 0 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3eeff' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1a0030' },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3eeff', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 20 },
  modalText: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
