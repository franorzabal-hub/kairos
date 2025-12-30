import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppProvider, useAuth } from '../src/context/AppContext';
import LoginScreen from '../src/screens/LoginScreen';
import { registerForPushNotifications, savePushToken } from '../src/services/notifications';

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

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushToken(user.id, token);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settings"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
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
          <RootContent />
        </AppProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
