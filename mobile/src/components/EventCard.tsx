import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';

// Event status types
export type EventStatus =
  | 'pending'      // Requires confirmation, not yet confirmed
  | 'confirmed'    // Confirmed attendance
  | 'declined'     // Declined attendance
  | 'info'         // Informational only, no action needed
  | 'cancelled'    // Event cancelled by school
  | 'past';        // Past event

interface EventCardProps {
  event: Event;
  isUnread?: boolean;
  status?: EventStatus;
  childName?: string;
  childColor?: string;
  onPress?: () => void;
  onActionPress?: () => void;
}

// CTA button configuration by status
const CTA_CONFIG: Partial<Record<EventStatus, {
  label: string;
  bgColor: string;
  textColor: string;
}>> = {
  pending: {
    label: 'Responder',
    bgColor: COLORS.warningLight,
    textColor: COLORS.warning,
  },
  confirmed: {
    label: '✓ Confirmado',
    bgColor: COLORS.successLight,
    textColor: COLORS.success,
  },
  declined: {
    label: 'Declinado',
    bgColor: COLORS.errorLight,
    textColor: COLORS.error,
  },
};

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
  const isPast = status === 'past';
  const isCancelled = status === 'cancelled';
  const isPending = status === 'pending';
  const ctaConfig = CTA_CONFIG[status];

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    router.push({ pathname: '/agenda/[id]', params: { id: event.id } });
  };

  const handleActionPress = (e: any) => {
    e.stopPropagation();
    if (onActionPress) {
      onActionPress();
    } else {
      handlePress();
    }
  };

  // Format month abbreviation (uppercase)
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().replace('.', '');
  };

  // Format day number
  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get relative day label if applicable
  const getRelativeDay = (dateStr: string): string | null => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'HOY';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'MAÑANA';
    }
    return null;
  };

  const relativeDay = getRelativeDay(event.start_date);

  // Date block colors: child color if provided, otherwise default
  const dateBlockBgColor = childColor || COLORS.primaryLight;
  const dateBlockTextColor = childColor ? COLORS.white : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isPending && styles.cardPending,
        isPast && styles.cardPast,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Left: Date Block (Squircle) */}
      <View style={[
        styles.dateBlock,
        { backgroundColor: dateBlockBgColor },
        isPast && styles.dateBlockPast,
      ]}>
        <Text style={[
          styles.dateMonth,
          { color: dateBlockTextColor },
          childColor && styles.dateTextLight,
        ]}>
          {formatMonth(event.start_date)}
        </Text>
        <Text style={[
          styles.dateDay,
          { color: dateBlockTextColor },
          childColor && styles.dateTextLight,
        ]}>
          {formatDay(event.start_date)}
        </Text>
        {relativeDay && (
          <View style={[
            styles.relativeDayBadge,
            isPending && styles.relativeDayBadgePending,
            childColor && { backgroundColor: childColor },
          ]}>
            <Text style={styles.relativeDayText}>{relativeDay}</Text>
          </View>
        )}
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

        {/* Meta row: time, location, child */}
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={12}
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
                size={12}
                color={isPast ? COLORS.border : COLORS.gray}
              />
              <Text style={[styles.metaText, isPast && styles.textPast]} numberOfLines={1}>
                {event.location_external}
              </Text>
            </>
          )}

          {/* Child indicator (when viewing "Todos") - avatar style */}
          {childName && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <View style={[styles.childAvatar, { backgroundColor: childColor || COLORS.primary }]}>
                <Text style={styles.childInitial}>
                  {childName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.metaText, isPast && styles.textPast]}>
                {childName}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Right: CTA Button or Chevron */}
      <View style={styles.rightColumn}>
        {ctaConfig ? (
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: ctaConfig.bgColor }]}
            onPress={handleActionPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.ctaText, { color: ctaConfig.textColor }]}>
              {ctaConfig.label}
            </Text>
          </TouchableOpacity>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isPast ? COLORS.border : COLORS.gray}
          />
        )}
      </View>
    </TouchableOpacity>
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
    ...SHADOWS.card,
  },
  cardPending: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  cardPast: {
    opacity: 0.6,
  },
  // Date Block (Squircle)
  dateBlock: {
    width: 56,
    height: 56,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateBlockPast: {
    opacity: 0.7,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: -2,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dateTextLight: {
    color: COLORS.white,
  },
  relativeDayBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDERS.radius.sm,
  },
  relativeDayBadgePending: {
    backgroundColor: COLORS.warning,
  },
  relativeDayText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  // Content
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '500',
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
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  metaSeparator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.border,
    marginHorizontal: 2,
  },
  // Child avatar (mini circle with initial)
  childAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInitial: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
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
