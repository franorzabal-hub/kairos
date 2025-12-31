/**
 * EventCard - Unified event card for mobile and web
 *
 * Cross-platform component with:
 * - Mobile: Touch feedback with activeOpacity
 * - Web: Hover effects (lift, shadow, cursor)
 *
 * Uses useEventCardLogic hook for shared formatting and accessibility
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  PressableStateCallbackType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../api/directus';
import {
  COLORS,
  SPACING,
  BORDERS,
  TYPOGRAPHY,
  SHADOWS,
  SIZES,
  FONT_SIZES,
} from '../theme';
import { useEventCardLogic } from '../hooks';
import { EventStatus } from '../types/events';

// Re-export EventStatus for consumers that import from this file
export type { EventStatus } from '../types/events';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

interface EventCardProps {
  event: Event;
  isUnread?: boolean;
  status?: EventStatus;
  childName?: string;
  childColor?: string;
  onPress?: () => void;
  onActionPress?: () => void;
}

function EventCard({
  event,
  isUnread = false,
  status = 'info',
  childName,
  childColor,
  onPress,
  onActionPress,
}: EventCardProps) {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  // Use shared logic hook
  const {
    formatMonth,
    formatDay,
    formatTime,
    dateBlockBgColor,
    dateBlockTextColor,
    accessibilityLabel,
    isPast,
    isCancelled,
    isPending,
    ctaConfig,
  } = useEventCardLogic({
    event,
    childColor,
    status,
    isUnread,
    childName,
  });

  const handlePress = () => {
    onPress?.();
    router.push({ pathname: '/agenda/[id]', params: { id: event.id } });
  };

  const handleActionPress = (e: any) => {
    e.stopPropagation();
    onActionPress ? onActionPress() : handlePress();
  };

  // Platform-specific shadow styles
  const shadowStyle = Platform.select({
    web: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    } as any,
    default: SHADOWS.card,
  });

  // Platform-specific card container styles
  const getCardStyle = (state: PressableStateCallbackType) => {
    const hovered = (state as WebPressableState).hovered;

    return [
      styles.card,
      shadowStyle,
      isPending && styles.cardPending,
      isPast && styles.cardPast,
      // Web-specific hover effects
      isWeb && {
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer',
      } as any,
    ];
  };

  // Platform-specific CTA button styles
  const getCtaStyle = (state: PressableStateCallbackType) => {
    const hovered = (state as WebPressableState).hovered;

    return [
      styles.ctaButton,
      { backgroundColor: ctaConfig?.bgColor },
      isWeb && {
        cursor: 'pointer',
        opacity: hovered ? 0.8 : 1,
      } as any,
    ];
  };

  return (
    <Pressable
      style={getCardStyle}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Toca para ver detalles del evento"
    >
      {/* Left: Date Block (Squircle) - Left-aligned content */}
      <View
        style={[
          styles.dateBlock,
          { backgroundColor: dateBlockBgColor },
          isPast && styles.dateBlockPast,
        ]}
      >
        <Text style={[styles.dateMonth, { color: dateBlockTextColor }]}>
          {formatMonth(event.start_date)}
        </Text>
        <Text style={[styles.dateDay, { color: dateBlockTextColor }]}>
          {formatDay(event.start_date)}
        </Text>
      </View>

      {/* Center: Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text
          style={[
            styles.title,
            isUnread && styles.titleUnread,
            isPast && styles.textPast,
            isCancelled && styles.textCancelled,
          ]}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        {/* Meta row: time and location only */}
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={SIZES.iconXs}
            color={isPast ? COLORS.border : COLORS.gray}
          />
          <Text style={[styles.metaText, isPast && styles.textPast]}>
            {formatTime(event.start_date)}
          </Text>

          {event.location_external && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Ionicons
                name="location-outline"
                size={SIZES.iconXs}
                color={isPast ? COLORS.border : COLORS.gray}
              />
              <Text
                style={[styles.metaText, styles.locationText, isPast && styles.textPast]}
                numberOfLines={1}
              >
                {event.location_external}
              </Text>
            </>
          )}
        </View>

        {/* Child row: avatar + full name (when viewing "Todos") */}
        {childName && (
          <View style={styles.childRow}>
            <View
              style={[
                styles.childAvatar,
                { backgroundColor: childColor || COLORS.primary },
              ]}
            >
              <Text style={styles.childInitial}>
                {childName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.childName, { color: childColor || COLORS.primary }]}>
              {childName}
            </Text>
          </View>
        )}
      </View>

      {/* Right: CTA Button or Chevron */}
      <View style={styles.rightColumn}>
        {ctaConfig ? (
          <Pressable style={getCtaStyle} onPress={handleActionPress}>
            <Text style={[styles.ctaText, { color: ctaConfig.textColor }]}>
              {ctaConfig.label}
            </Text>
          </Pressable>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={SIZES.iconMd}
            color={isPast ? COLORS.border : COLORS.gray}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cardPending: {
    borderLeftWidth: BORDERS.width.thick,
    borderLeftColor: COLORS.warning,
  },
  cardPast: {
    opacity: 0.6,
  },
  // Date Block (Squircle) - Left-aligned for professional look
  dateBlock: {
    width: SIZES.avatarXl,
    height: SIZES.avatarXl,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'flex-start', // Left align content
    justifyContent: 'center',
    paddingLeft: SPACING.sm, // Internal padding for left alignment
  },
  dateBlockPast: {
    opacity: 0.7,
  },
  dateMonth: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: FONT_SIZES['6xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: -SPACING.xxs,
  },
  // Content
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  titleUnread: {
    fontWeight: '700',
  },
  textPast: {
    color: COLORS.gray,
  },
  textCancelled: {
    textDecorationLine: 'line-through',
    color: COLORS.gray,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs + SPACING.xxs,
    gap: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  locationText: {
    flex: 1, // Take remaining space and truncate if needed
    flexShrink: 1, // Allow shrinking to keep avatar on same line
  },
  metaSeparator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.border,
    marginHorizontal: SPACING.xxs,
  },
  // Child row (separate line for avatar + name)
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs + SPACING.xxs,
    gap: SPACING.xs + SPACING.xxs,
  },
  // Child avatar (mini circle with initial)
  childAvatar: {
    width: SIZES.avatarXs,
    height: SIZES.avatarXs,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInitial: {
    fontSize: FONT_SIZES.xxs,
    fontWeight: '700',
    color: COLORS.white,
  },
  childName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  // Right column
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  // CTA Button (solid chip style)
  ctaButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDERS.radius.md,
  },
  ctaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});

// Memoize to prevent unnecessary re-renders in lists
export default React.memo(EventCard);
