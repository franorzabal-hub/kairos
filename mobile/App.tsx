import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppProvider, useAppContext } from './src/context/AppContext';
import TabNavigator from './src/navigation/TabNavigator';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Main app with navigation
function MainApp() {
  const { setChildren, setUnreadCounts } = useAppContext();

  useEffect(() => {
    // Load mock children data on mount
    // TODO: Replace with API call to get user's children
    setChildren([
      {
        id: '1',
        organization_id: 'org-1',
        first_name: 'Teodelina',
        last_name: 'Orzabal',
        birth_date: '2018-03-15',
        section_id: 'sec-1',
        status: 'active',
      },
      {
        id: '2',
        organization_id: 'org-1',
        first_name: 'Pedro',
        last_name: 'Orzabal',
        birth_date: '2016-08-22',
        section_id: 'sec-2',
        status: 'active',
      },
      {
        id: '3',
        organization_id: 'org-1',
        first_name: 'Joaquin',
        last_name: 'Orzabal',
        birth_date: '2014-11-05',
        section_id: 'sec-3',
        status: 'active',
      },
    ]);

    // Set mock unread counts
    // TODO: Replace with API call
    setUnreadCounts({
      novedades: 2,
      eventos: 0,
      mensajes: 11,
      cambios: 0,
      boletines: 2,
    });
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
