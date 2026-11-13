import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useCartStore } from '../stores/useCartStore';
import { useAddressStore } from '../stores/useAddressStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { SplashScreenView } from '../components/SplashScreenView';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

function ClerkAuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncProfileDirect = useAuthStore((state) => state.syncProfileDirect);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        '';
      const name = user.fullName || user.firstName || email.split('@')[0] || 'Valued Foodie';
      const phone = user.primaryPhoneNumber?.phoneNumber || '+91 98765 43210';

      syncProfileDirect({
        id: user.id,
        name,
        email,
        phone,
        avatarUrl: user.imageUrl || undefined,
        role: 'customer',
      });
    }
  }, [isLoaded, isSignedIn, user, syncProfileDirect]);

  return null;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const splashHandled = useRef(false);

  const loadCart = useCartStore((state) => state.loadCart);
  const loadAddresses = useAddressStore((state) => state.loadAddresses);
  const loadOrders = useOrderStore((state) => state.loadOrders);
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const loadFavorites = useFavoritesStore((state) => state.loadFavorites);

  useEffect(() => {
    // 1. Immediately dismiss native OS / Expo Go loading screen so our custom splash renders right away
    SplashScreen.hideAsync().catch(() => { });

    // 2. Preload persistent stores in the background
    loadAuth();
    loadCart();
    loadAddresses();
    loadOrders();
    loadFavorites();
  }, [loadAddresses, loadAuth, loadCart, loadFavorites, loadOrders]);

  // When custom animated splash screen finishes, transition to the appropriate screen
  const handleFinishSplash = () => {
    if (splashHandled.current) return;
    splashHandled.current = true;

    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    // If already authenticated with a real account, go straight to tabs; otherwise present the login page
    if (isAuthenticated && user && !user.id.startsWith('guest_')) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }

    setShowSplash(false);
  };

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkAuthSync />
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.container}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#08080C' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="signup"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="otp"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="restaurant/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="cart"
              options={{
                headerShown: true,
                title: 'Your Cart',
                headerBackTitle: 'Back',
                headerTintColor: '#1C1C24',
                headerTitleStyle: { fontWeight: '800' },
              }}
            />
            <Stack.Screen
              name="checkout"
              options={{
                headerShown: true,
                title: 'Checkout & Payment',
                headerBackTitle: 'Cart',
                headerTintColor: '#1C1C24',
                headerTitleStyle: { fontWeight: '800' },
              }}
            />
            <Stack.Screen
              name="track/[id]"
              options={{
                headerShown: true,
                title: 'Live Order Tracking',
                headerBackTitle: 'Orders',
                headerTintColor: '#1C1C24',
                headerTitleStyle: { fontWeight: '800' },
              }}
            />
            <Stack.Screen
              name="address"
              options={{
                headerShown: true,
                title: 'Manage Addresses',
                headerBackTitle: 'Back',
                headerTintColor: '#1C1C24',
                headerTitleStyle: { fontWeight: '800' },
              }}
            />
          </Stack>

          {/* Royal KHANA Launch & Splash Screen Overlay */}
          {showSplash && (
            <View style={styles.splashOverlay}>
              <SplashScreenView onFinish={handleFinishSplash} />
            </View>
          )}
        </View>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    backgroundColor: '#08080C',
  },
});
