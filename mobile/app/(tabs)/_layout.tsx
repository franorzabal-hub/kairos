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
      {/* Index redirects to inicio */}
      <Tabs.Screen name="index" options={{ href: null }} />

      {/* Main 4-tab navigation */}
      <Tabs.Screen name="inicio/index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="agenda/index" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="agenda/[id]" options={{ href: null }} />
      <Tabs.Screen name="mensajes/index" options={{ title: 'Mensajes' }} />
      <Tabs.Screen name="mensajes/[id]" options={{ href: null }} />
      <Tabs.Screen name="mishijos/index" options={{ title: 'Mis Hijos' }} />

      {/* Legacy routes - hidden from tab bar but accessible for deep linking */}
      <Tabs.Screen name="novedades/index" options={{ href: null }} />
      <Tabs.Screen name="novedades/[id]" options={{ href: null }} />
      <Tabs.Screen name="eventos/index" options={{ href: null }} />
      <Tabs.Screen name="eventos/[id]" options={{ href: null }} />
      <Tabs.Screen name="cambios/index" options={{ href: null }} />
      <Tabs.Screen name="boletines/index" options={{ href: null }} />
      <Tabs.Screen name="salidas/index" options={{ href: null }} />
      <Tabs.Screen name="salidas/[id]" options={{ href: null }} />
    </Tabs>
  );
}
