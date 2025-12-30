import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

import { AppProvider, useAuth } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { registerForPushNotifications, savePushToken } from './src/services/notifications';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Register for push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      registerForPushNotifications().then(token => {
        if (token) {
          savePushToken(user.id, token);
          console.log('Push token registered:', token);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B1538" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
