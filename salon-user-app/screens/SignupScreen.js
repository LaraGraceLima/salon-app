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
import { getApiUrlAsync } from '../config/api';
import beautybossLogo from '../assets/BEAUTYBOSS.png';

export default function SignupScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setIsLoggedIn = route?.params?.setIsLoggedIn;

  const pwRules = [
    { label: 'At least 8 characters',       pass: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)',   pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a–z)',   pass: /[a-z]/.test(password) },
    { label: 'One number (0–9)',             pass: /[0-9]/.test(password) },
    { label: 'One special character (!@#$)', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const pwStrong = pwRules.every(r => r.pass);

  const handleSignup = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!pwStrong) {
      Alert.alert('Weak Password', 'Password must have uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = await getApiUrlAsync();
      const response = await fetch(`${apiUrl}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after signup
        const loginResponse = await fetch(`${apiUrl}/api/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          Alert.alert('Success', 'Account created and logged in!');
          // Call the setIsLoggedIn function with token, name, and email
          if (setIsLoggedIn) {
            setIsLoggedIn(loginData.token, loginData.name, loginData.email);
          }
        } else {
          Alert.alert('Success', 'Account created! Please login.');
          navigation.navigate('Login');
        }
      } else {
        Alert.alert('Error', data.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a0030', '#3d0070']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={beautybossLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us for beautiful styles</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="#1a0030" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#1a0030" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color="#1a0030" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#1a0030" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#1a0030"
              />
            </TouchableOpacity>
          </View>

          {/* Password strength checklist */}
          {password.length > 0 && (
            <View style={styles.pwRules}>
              {pwRules.map((r, i) => (
                <View key={i} style={styles.pwRule}>
                  <Ionicons
                    name={r.pass ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={r.pass ? '#16A34A' : '#9CA3AF'}
                  />
                  <Text style={[styles.pwRuleTxt, r.pass && styles.pwRulePass]}>{r.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#1a0030" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLink}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
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
    marginBottom: 15,
    paddingBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  signupButton: {
    backgroundColor: '#1a0030',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    color: '#1a0030',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  pwRules:    { marginBottom: 12, gap: 5 },
  pwRule:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pwRuleTxt:  { fontSize: 12, color: '#9CA3AF' },
  pwRulePass: { color: '#16A34A', fontWeight: '600' },
});
