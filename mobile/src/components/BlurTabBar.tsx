import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

interface BlurTabBarProps extends BottomTabBarProps {
  unreadCounts: {
    novedades: number;
    eventos: number;
    mensajes: number;
    cambios: number;
    boletines: number;
  };
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Novedades: 'megaphone-outline',
  Eventos: 'calendar-outline',
  Mensajes: 'chatbubbles-outline',
  Cambios: 'time-outline',
  Boletines: 'document-text-outline',
};

const TAB_BADGE_KEYS: Record<string, keyof BlurTabBarProps['unreadCounts']> = {
  Novedades: 'novedades',
  Eventos: 'eventos',
  Mensajes: 'mensajes',
  Cambios: 'cambios',
  Boletines: 'boletines',
};

export default function BlurTabBar({ state, descriptors, navigation, unreadCounts }: BlurTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      tint="light"
      intensity={80}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.borderTop} />
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;
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
