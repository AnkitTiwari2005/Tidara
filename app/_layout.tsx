import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAppStore } from '../store/useAppStore';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { updateUserProfile } from '../lib/supabase';
import GlobalAlertModal from '../components/GlobalAlertModal';

// Prevent the splash screen from auto-hiding before store hydration finishes.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const _hasHydrated = useAppStore((s) => s._hasHydrated);

  const [fontsLoaded] = useFonts({
    'Lexend-Regular': require('../assets/fonts/Lexend-Regular.ttf'),
    'Lexend-Medium': require('../assets/fonts/Lexend-Medium.ttf'),
    'Lexend-SemiBold': require('../assets/fonts/Lexend-SemiBold.ttf'),
    'Lexend-Bold': require('../assets/fonts/Lexend-Bold.ttf'),
    'Lexend-Black': require('../assets/fonts/Lexend-Black.ttf'),
  });

  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (_hasHydrated) {
      registerForPushNotificationsAsync().then((token) => {
        if (token && user?.phone) {
          updateUserProfile(user.phone, { push_token: token });
        }
      });
    }
  }, [_hasHydrated, user?.phone]);

  useEffect(() => {
    if (_hasHydrated && fontsLoaded) {
      // Store and fonts are ready — hide the native splash now
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated, fontsLoaded]);

  // While SecureStore and fonts are being loaded, show native splash background.
  if (!_hasHydrated || !fontsLoaded) {
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
      <GlobalAlertModal />
    </GestureHandlerRootView>
  );
}
