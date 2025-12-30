import React from 'react';
import { Tabs } from 'expo-router';

import { useUnreadCounts } from '../../src/context/AppContext';
import { useUnreadSync } from '../../src/hooks/useUnreadSync';
import BlurTabBar from '../../src/components/BlurTabBar';

export default function TabsLayout() {
  const { unreadCounts } = useUnreadCounts();

  useUnreadSync();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BlurTabBar {...props} unreadCounts={unreadCounts} />}
    >
      <Tabs.Screen name="novedades" options={{ title: 'Novedades' }} />
      <Tabs.Screen name="eventos" options={{ title: 'Eventos' }} />
      <Tabs.Screen name="mensajes" options={{ title: 'Mensajes' }} />
      <Tabs.Screen name="cambios" options={{ title: 'Cambios' }} />
      <Tabs.Screen name="boletines" options={{ title: 'Boletines' }} />
    </Tabs>
  );
}
