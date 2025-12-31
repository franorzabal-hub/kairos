import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, SHADOWS, FONT_SIZES } from '../theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
  style?: ViewStyle;
}

const TOAST_COLORS = {
  success: COLORS.success,
  error: COLORS.error,
  info: COLORS.info,
};

const ICONS = {
  success: 'checkmark-circle' as const,
  error: 'alert-circle' as const,
  info: 'information-circle' as const,
};

/**
 * Simple Toast component for ephemeral feedback messages.
 * Follows UX best practices: non-intrusive, auto-dismissing, visually clear.
 */
export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
  style,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: TOAST_COLORS[type] },
        { opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      <Ionicons name={ICONS[type]} size={20} color={COLORS.white} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.tabBarOffset,
    left: SPACING.xl,
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.listItemPadding,
    paddingHorizontal: SPACING.screenPadding,
    borderRadius: BORDERS.radius.lg,
    gap: SPACING.md,
    ...SHADOWS.fab,
  },
  message: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '500',
    flex: 1,
  },
});
