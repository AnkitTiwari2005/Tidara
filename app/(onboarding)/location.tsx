import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export default function LocationScreen() {
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setTimeout(() => {
          router.replace('/(onboarding)/confirm-location');
        }, 1200);
      } else {
        router.replace('/(onboarding)/confirm-location');
      }
    } catch {
      router.replace('/(onboarding)/confirm-location');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Radar Graphic */}
        <View style={styles.radarCircleOuter}>
          <View style={styles.radarCircleMiddle}>
            <View style={styles.radarCircleInner}>
              <Ionicons name="location" size={36} color={Colors.primary} />
            </View>
          </View>
        </View>

        <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: 24 }} />

        <View style={styles.textSection}>
          <Text style={styles.title}>Detecting Your Location</Text>
          <Text style={styles.subtitle}>
            Finding nearby certified professionals in your sector...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  radarCircleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleMiddle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  textSection: {
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
});
