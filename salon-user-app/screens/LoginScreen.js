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
import { refreshApiUrl, getApiUrlAsync } from '../config/api';
import beautybossLogo from '../assets/BEAUTYBOSS.png';

// Login uses a callback passed via React Context at the App level.
// We receive it via route.params.setIsLoggedIn (set by AuthStack).
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
      
      const response = await fetch(`${currentApiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful, received token:', data.token ? data.token.substring(0, 20) + '...' : 'EMPTY');
        console.log('Login response data:', { token: data.token ? 'present' : 'missing', name: data.name, email: data.email });
        Alert.alert('Success', 'Logged in successfully!');
        // Call the setIsLoggedIn function with token, name, and email
        if (setIsLoggedIn) {
          setIsLoggedIn(data.token, data.name, data.email, data.id);
        }
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', `Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a0030', '#3d0070']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={beautybossLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>BEAUTYBOSS</Text>
          <Text style={styles.subtitle}>Book your perfect style</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#fff" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(17, 3, 3, 0.6)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#fff" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(15, 10, 10, 0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#130202ff"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#100202ff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>Already have an account? [Sign Up]</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Demo Credentials:</Text>
          <Text style={styles.demoText}>Email: user@example.com</Text>
          <Text style={styles.demoText}>Password: password123</Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, refreshingIP && styles.buttonDisabled]}
          onPress={handleRefreshIP}
          disabled={refreshingIP}
        >
          {refreshingIP ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#fff" />
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
    paddingBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loginButton: {
    backgroundColor: '#1a0030',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
  },
  signupButton: {
    borderWidth: 2,
    borderColor: '#1a0030',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#1a0030',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
  },
  demoTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  demoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginBottom: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
