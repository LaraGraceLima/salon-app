import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function InAppNotification({ 
  visible, 
  message, 
  type = 'info', 
  duration = 4000, 
  onHide 
}) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#4CAF50', iconName: 'checkmark-circle' };
      case 'warning':
        return { backgroundColor: '#FF9800', iconName: 'warning' };
      case 'error':
        return { backgroundColor: '#F44336', iconName: 'alert-circle' };
      case 'appointment':
        return { backgroundColor: '#667eea', iconName: 'calendar' };
      default:
        return { backgroundColor: '#2196F3', iconName: 'information-circle' };
    }
  };

  if (!visible) return null;

  const { backgroundColor, iconName } = getNotificationStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color="#fff" />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50, // Account for status bar
    paddingBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});