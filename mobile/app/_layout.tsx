import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { AppProvider, useAuth } from '../src/context/AppContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import LoginScreen from '../src/screens/LoginScreen';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationResponseListener,
} from '../src/services/notifications';
import {
  savePendingDeepLink,
  consumePendingDeepLink,
  navigateFromDeepLink,
} from '../src/services/deepLinking';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

function RootContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hasHandledDeepLink = useRef(false);

  // Handle push notifications registration
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushToken(user.id, token);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

  // Handle notification tap - navigate to deep link
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = addNotificationResponseListener((response) => {
      // Extract deep link from notification data
      const data = response.notification.request.content.data;

      // Support multiple data formats:
      // { url: 'kairos://novedades/123' }
      // { type: 'announcement', id: '123' }
      // { path: '/novedades/123' }
      let deepLinkUrl: string | null = null;

      if (data?.url && typeof data.url === 'string') {
        deepLinkUrl = data.url;
      } else if (data?.path && typeof data.path === 'string') {
        deepLinkUrl = `kairos:/${data.path}`;
      } else if (data?.type && data?.id) {
        // Map notification types to routes
        const typeToRoute: Record<string, string> = {
          announcement: 'novedades',
          event: 'agenda',
          message: 'mensajes',
        };
        const route = typeToRoute[data.type as string];
        if (route) {
          deepLinkUrl = `kairos://${route}/${data.id}`;
        }
      }

      if (deepLinkUrl) {
        navigateFromDeepLink(deepLinkUrl);
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // Handle deep links when not authenticated - save for later
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      const handleUrl = (event: { url: string }) => {
        savePendingDeepLink(event.url);
      };

      // Check initial URL
      Linking.getInitialURL().then((url) => {
        if (url) {
          savePendingDeepLink(url);
        }
      });

      // Listen for incoming URLs
      const subscription = Linking.addEventListener('url', handleUrl);
      return () => subscription.remove();
    }
  }, [isAuthenticated, isLoading]);

  // Navigate to pending deep link after authentication
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasHandledDeepLink.current) {
      hasHandledDeepLink.current = true;
      consumePendingDeepLink().then((url) => {
        if (url) {
          // Small delay to ensure navigation stack is ready
          setTimeout(() => {
            navigateFromDeepLink(url);
          }, 100);
        }
      });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8B1538" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24, // 24h
          }}
        >
          <AppProvider>
            <StatusBar style="dark" />
            <ErrorBoundary>
              <RootContent />
            </ErrorBoundary>
          </AppProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
