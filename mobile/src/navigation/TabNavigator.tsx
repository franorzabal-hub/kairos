import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUnreadCounts } from '../context/AppContext';

import NovedadesScreen from '../screens/NovedadesScreen';
import EventosScreen from '../screens/EventosScreen';
import MensajesScreen from '../screens/MensajesScreen';
import CambiosScreen from '../screens/CambiosScreen';
import BoletinesScreen from '../screens/BoletinesScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#8B1538',
  gray: '#9E9E9E',
  white: '#FFFFFF',
};

// Simple icon component using emoji (can replace with react-native-vector-icons later)
function TabIcon({ icon, focused, badge }: { icon: string; focused: boolean; badge?: number }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabNavigator() {
  const { unreadCounts } = useUnreadCounts();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Novedades"
        component={NovedadesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📢" focused={focused} badge={unreadCounts.novedades} />
          ),
        }}
      />
      <Tab.Screen
        name="Eventos"
        component={EventosScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" focused={focused} badge={unreadCounts.eventos} />
          ),
        }}
      />
      <Tab.Screen
        name="Mensajes"
        component={MensajesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💬" focused={focused} badge={unreadCounts.mensajes} />
          ),
        }}
      />
      <Tab.Screen
        name="Cambios"
        component={CambiosScreen}
        options={{
          tabBarLabel: 'Cambios',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🕐" focused={focused} badge={unreadCounts.cambios} />
          ),
        }}
      />
      <Tab.Screen
        name="Boletines"
        component={BoletinesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📄" focused={focused} badge={unreadCounts.boletines} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#E53935',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
