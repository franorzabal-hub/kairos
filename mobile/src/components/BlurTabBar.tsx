import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

interface BlurTabBarProps extends BottomTabBarProps {
  unreadCounts: {
    inicio: number;      // Combined novedades + upcoming events
    agenda: number;      // All events
    mensajes: number;
    mishijos: number;    // Reports + pickup + attendance
    // Legacy keys for backwards compatibility
    novedades: number;
    eventos: number;
    cambios: number;
    boletines: number;
  };
}

// Only these 4 routes should appear as visible tabs
const VISIBLE_TAB_ROUTES = new Set([
  'inicio/index',
  'agenda/index',
  'mensajes/index',
  'mishijos/index',
]);

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'inicio/index': 'home-outline',
  'agenda/index': 'calendar-outline',
  'mensajes/index': 'chatbubbles-outline',
  'mishijos/index': 'people-outline',
};

const TAB_BADGE_KEYS: Record<string, keyof BlurTabBarProps['unreadCounts']> = {
  'inicio/index': 'inicio',
  'agenda/index': 'agenda',
  'mensajes/index': 'mensajes',
  'mishijos/index': 'mishijos',
};

// Map hidden/legacy routes to their parent tab for focus state
const ROUTE_TO_PARENT_TAB: Record<string, string> = {
  'novedades/index': 'inicio/index',
  'novedades/[id]': 'inicio/index',
  'eventos/index': 'agenda/index',
  'eventos/[id]': 'agenda/index',
  'cambios/index': 'mishijos/index',
  'boletines/index': 'mishijos/index',
};

export default function BlurTabBar({ state, descriptors, navigation, unreadCounts }: BlurTabBarProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Hide tab bar on web - WebLayout sidebar handles navigation
  if (Platform.OS === 'web') {
    return null;
  }

  // Hide tab bar only on detail screens (routes with dynamic [id] params)
  // segments example: ['(tabs)', 'agenda', '[id]'] for /agenda/123
  const isDetailScreen = segments.some(s => s.startsWith('[') && s.endsWith(']'));

  if (isDetailScreen) {
    return null;
  }

  // Only show the 4 main tab routes (explicitly filter by name)
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_ROUTES.has(route.name));

  // Determine which tab should be focused (handle hidden route → parent tab mapping)
  const currentRouteName = state.routes[state.index]?.name;
  const effectiveFocusedRoute = ROUTE_TO_PARENT_TAB[currentRouteName] || currentRouteName;

  return (
    <BlurView
      tint="light"
      intensity={80}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.borderTop} />
      <View style={styles.tabsContainer}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          // Use effective focused route to handle hidden route → parent tab mapping
          const isFocused = route.name === effectiveFocusedRoute;
          const iconName = TAB_ICONS[route.name] || 'help-outline';
          const badgeKey = TAB_BADGE_KEYS[route.name];
          const badge = badgeKey ? unreadCounts[badgeKey] : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? COLORS.tabActive : COLORS.tabInactive}
                />
                {badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? COLORS.tabActive : COLORS.tabInactive },
                ]}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(249, 249, 249, 0.85)',
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.tabBadge,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  badgeText: {
    color: COLORS.white,
    ...TYPOGRAPHY.badgeSmall,
  },
  label: {
    ...TYPOGRAPHY.badgeSmall,
    fontWeight: '500',
    marginTop: SPACING.xs / 2,
  },
});
