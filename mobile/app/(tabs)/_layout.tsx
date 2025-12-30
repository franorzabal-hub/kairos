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
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="novedades/index" options={{ title: 'Novedades' }} />
      <Tabs.Screen name="novedades/[id]" options={{ href: null }} />
      <Tabs.Screen name="eventos/index" options={{ title: 'Eventos' }} />
      <Tabs.Screen name="eventos/[id]" options={{ href: null }} />
      <Tabs.Screen name="mensajes/index" options={{ title: 'Mensajes' }} />
      <Tabs.Screen name="mensajes/[id]" options={{ href: null }} />
      <Tabs.Screen name="cambios/index" options={{ title: 'Cambios' }} />
      <Tabs.Screen name="boletines/index" options={{ title: 'Boletines' }} />
    </Tabs>
  );
}
