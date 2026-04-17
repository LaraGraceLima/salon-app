import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { logoutRef } from '../App';
import API_BASE_URL, { getApiUrlAsync } from '../config/api';

export default function ProfileScreen({ route }) {
  const { stylistToken } = route.params || {};
  const [stylist, setStylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (stylistToken && !stylist) {
        loadProfile();
      }
    }, [stylistToken])
  );

  const loadProfile = async () => {
    try {
      if (!stylistToken) {
        setLoading(false);
        return;
      }

      const apiUrl = await getApiUrlAsync();
      const response = await fetch(`${apiUrl}/api/stylists/profile`, {
        headers: {
          'Authorization': `Bearer ${stylistToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStylist(data);
        setEditForm({
          name: data.name,
          email: data.email,
          phone: data.phone,
          specialization: data.specialization
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to load profile:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const apiUrl = await getApiUrlAsync();
      const response = await fetch(`${apiUrl}/api/stylists/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${stylistToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setStylist({ ...stylist, ...editForm });
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = await getApiUrlAsync();
      const response = await fetch(`${apiUrl}/api/stylists/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${stylistToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        Alert.alert('Success', 'Password changed successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Profile picture — pick from gallery and save as base64 to server
  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const base64Image = `data:image/jpeg;base64,${asset.base64}`;
    try {
      const apiUrl = await getApiUrlAsync();
      const res = await fetch(`${apiUrl}/api/stylists/profile-image`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${stylistToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile_image_url: base64Image }),
      });
      if (res.ok) {
        setStylist(prev => ({ ...prev, profile_image_url: base64Image }));
        Alert.alert('Success', 'Profile picture updated.');
      } else {
        Alert.alert('Error', 'Failed to update profile picture.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not upload image.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          if (logoutRef.current) {
            logoutRef.current();
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!stylist) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#4C1D95', '#7C3AED', '#A855F7']} style={styles.header}>
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={handleImagePicker}
        >
          {stylist.profile_image_url ? (
            <Image source={{ uri: stylist.profile_image_url }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={120} color="#fff" />
          )}
          <View style={styles.editImageBadge}>
            <Ionicons name="camera" size={20} color="#7C3AED" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{stylist.name}</Text>
        <Text style={styles.email}>{stylist.email}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Ionicons name={editing ? "close" : "create"} size={20} color="#fff" />
            <Text style={styles.editButtonText}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {editing ? (
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specialization</Text>
              <TextInput
                style={styles.input}
                value={editForm.specialization}
                onChangeText={(text) => setEditForm({ ...editForm, specialization: text })}
                placeholder="Enter your specialization"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={22} color="#7C3AED" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{stylist.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={22} color="#7C3AED" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{stylist.phone}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Info</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="cut" size={22} color="#7C3AED" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Specialization</Text>
                    <Text style={styles.infoValue}>{stylist.specialization}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, { color: '#4CAF50' }]}>
                      {stylist.status.charAt(0).toUpperCase() + stylist.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="lock-closed" size={22} color="#7C3AED" />
            <Text style={styles.passwordButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.changePasswordButton, saving && styles.saveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    padding: 25,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
  },
  editSection: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#7C3AED',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 20,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  passwordButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#7C3AED',
  },
  passwordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 20,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 25,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  changePasswordButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
