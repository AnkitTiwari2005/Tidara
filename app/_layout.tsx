import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '../store/useAppStore';

// Prevent the splash screen from auto-hiding before store hydration finishes.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  useEffect(() => {
    if (_hasHydrated) {
      // Store is ready — hide the native splash now so our animated JS
      // splash screen takes over.
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  // While SecureStore is being read, show nothing (native splash is still visible).
  // This prevents the wrong route from flashing before we know auth state.
  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#063D26', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="help" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="add-address" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="recurring-booking" />
        <Stack.Screen name="service/[id]" />
      </Stack>
    </GestureHandlerRootView>
  );
}
