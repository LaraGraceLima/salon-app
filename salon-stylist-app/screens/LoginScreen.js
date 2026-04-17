import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL, { refreshApiUrl, getApiUrlAsync } from '../config/api';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [refreshingIP, setRefreshingIP] = useState(false);
  const setIsLoggedIn = route?.params?.setIsLoggedIn;

  const handleRefreshIP = async () => {
    setRefreshingIP(true);
    try {
      const newUrl = await refreshApiUrl();
      Alert.alert('IP Refreshed', `New API URL: ${newUrl}`, [
        { text: 'OK', onPress: () => console.log('IP refreshed to:', newUrl) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh IP address');
    } finally {
      setRefreshingIP(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const currentApiUrl = await getApiUrlAsync();
      console.log('Using API URL:', currentApiUrl);
      
      const response = await fetch(`${currentApiUrl}/api/stylists/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Stylist login successful, token:', data.token ? data.token.substring(0, 20) + '...' : 'EMPTY');
        Alert.alert('Success', 'Logged in successfully!');
        // Call the setIsLoggedIn function with token, name, email
        if (setIsLoggedIn) {
          setIsLoggedIn(data.token, data.name, data.email);
        }
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Stylist login error:', error);
      Alert.alert('Error', `Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#7C3AED', '#FFFFFF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/BEAUTYBOSS.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Stylist Portal</Text>
          <Text style={styles.subtitle}>Manage your bookings & clients</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#7C3AED" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#f3f7fdff"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#7C3AED" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#7C3AED"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#7C3AED" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Admin Created Account?</Text>
          <Text style={styles.infoText}>
            Your admin will create your account and provide login credentials.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, refreshingIP && styles.buttonDisabled]}
          onPress={handleRefreshIP}
          disabled={refreshingIP}
        >
          {refreshingIP ? (
            <ActivityIndicator color="#7C3AED" size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#7C3AED" />
              <Text style={styles.refreshButtonText}>Refresh IP Connection</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#53318fff',
    marginTop: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#e0e3e9ff',
    marginTop: 8,
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  icon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 25,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#7C3AED',
    marginBottom: 20,
  },
  infoTitle: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
  },
  refreshButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
});
