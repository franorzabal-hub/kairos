import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useUnreadCounts } from '../context/AppContext';
import { useUnreadSync } from '../hooks/useUnreadSync';
import BlurTabBar from '../components/BlurTabBar';

import NovedadesStack from './NovedadesStack';
import EventosStack from './EventosStack';
import MensajesStack from './MensajesStack';
import CambiosScreen from '../screens/CambiosScreen';
import BoletinesScreen from '../screens/BoletinesScreen';

const Tab = createBottomTabNavigator();

// Hide tab bar on specific screens within nested stacks
const getTabBarStyle = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  // Hide tab bar on detail screens that need full-screen input (like chat)
  const hideOnScreens = ['ConversationChat', 'MessageDetail', 'NovedadDetail', 'EventoDetail'];
  if (hideOnScreens.includes(routeName ?? '')) {
    return { display: 'none' as const };
  }
  return { position: 'absolute' as const };
};

const COLORS = {
  activeBlue: '#007AFF',
  gray: '#8E8E93',
};

export default function TabNavigator() {
  const { unreadCounts } = useUnreadCounts();

  // Sync unread counts when data changes
  useUnreadSync();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.activeBlue,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: { position: 'absolute' },
      }}
      tabBar={(props) => <BlurTabBar {...props} unreadCounts={unreadCounts} />}
    >
      <Tab.Screen
        name="Novedades"
        component={NovedadesStack}
        options={({ route }) => ({ tabBarStyle: getTabBarStyle(route) })}
      />
      <Tab.Screen
        name="Eventos"
        component={EventosStack}
        options={({ route }) => ({ tabBarStyle: getTabBarStyle(route) })}
      />
      <Tab.Screen
        name="Mensajes"
        component={MensajesStack}
        options={({ route }) => ({ tabBarStyle: getTabBarStyle(route) })}
      />
      <Tab.Screen name="Cambios" component={CambiosScreen} />
      <Tab.Screen name="Boletines" component={BoletinesScreen} />
    </Tab.Navigator>
  );
}
