import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 1100,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Wait for the store to hydrate from SecureStore, then route based on auth state
  useEffect(() => {
    if (!_hasHydrated) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // ✅ Already logged in — go straight to home
        router.replace('/(tabs)');
      } else {
        // Not logged in — go to login
        router.replace('/(auth)/login');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [_hasHydrated, isAuthenticated]);

  return (
    <LinearGradient
      colors={['#063D26', '#0B5335', '#04271A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Icon Badge */}
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.iconInner}
          >
            <Ionicons name="sparkles" size={36} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Brand Name */}
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>Tidara</Text>
          <View style={styles.brandDot} />
        </View>

        <Text style={styles.tagline}>EXPERTS AT YOUR DOORSTEP</Text>

        <Animated.View style={[styles.pillBadge, { opacity: badgeAnim }]}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.pillText}>100% Background Verified Pros</Text>
        </Animated.View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>FAST • RELIABLE • TRANSPARENT</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginLeft: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 3,
    marginTop: 8,
    marginBottom: 24,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
