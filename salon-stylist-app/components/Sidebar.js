import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Sidebar({ navigation, currentRoute, stylistName, onLogout }) {
  const menuItems = [
    {
      name: 'Dashboard',
      icon: 'analytics',
      route: 'Dashboard',
    },
    {
      name: 'My Bookings',
      icon: 'calendar',
      route: 'Bookings',
    },
    {
      name: 'Profile',
      icon: 'person',
      route: 'Profile',
    },
  ];

  const handleNavigation = (route) => {
    navigation.navigate(route);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={60} color="#fff" />
            </View>
            <Text style={styles.stylistName}>{stylistName || 'Stylist'}</Text>
            <Text style={styles.roleText}>Hair Stylist</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                currentRoute === item.route && styles.activeMenuItem,
              ]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={currentRoute === item.route ? '#667eea' : '#fff'}
              />
              <Text
                style={[
                  styles.menuText,
                  currentRoute === item.route && styles.activeMenuText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stylistName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
    borderRadius: 15,
  },
  activeMenuItem: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    fontWeight: '500',
  },
});