import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';

/**
 * Creates a pastel/light version of a hex color by blending with white
 * @param hexColor - The base color in hex format (e.g., "#5C6BC0")
 * @param intensity - How much of the original color to keep (0.15-0.25 works well)
 * @returns Pastel version of the color
 */
function getPastelColor(hexColor: string, intensity: number = 0.2): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Blend with white (255, 255, 255)
  const blendedR = Math.round(r * intensity + 255 * (1 - intensity));
  const blendedG = Math.round(g * intensity + 255 * (1 - intensity));
  const blendedB = Math.round(b * intensity + 255 * (1 - intensity));

  return `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
}

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

  // Date block colors: always use soft pastel background with strong text
  // This creates visual consistency across all cards while maintaining child identification
  const dateBlockBgColor = childColor ? getPastelColor(childColor, 0.2) : COLORS.primaryLight;
  const dateBlockTextColor = childColor || COLORS.primary;

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
      {/* Left: Date Block (Squircle) - Left-aligned content */}
      <View style={[
        styles.dateBlock,
        { backgroundColor: dateBlockBgColor },
        isPast && styles.dateBlockPast,
      ]}>
        <Text style={[
          styles.dateMonth,
          { color: dateBlockTextColor },
        ]}>
          {formatMonth(event.start_date)}
        </Text>
        <Text style={[
          styles.dateDay,
          { color: dateBlockTextColor },
        ]}>
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
              <Text style={[styles.metaText, styles.locationText, isPast && styles.textPast]} numberOfLines={1}>
                {event.location_external}
              </Text>
            </>
          )}
        </View>

        {/* Child row: avatar + full name (when viewing "Todos") */}
        {childName && (
          <View style={styles.childRow}>
            <View style={[styles.childAvatar, { backgroundColor: childColor || COLORS.primary }]}>
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
  // Date Block (Squircle) - Left-aligned for professional look
  dateBlock: {
    width: 56,
    height: 56,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'flex-start',  // Left align content
    justifyContent: 'center',
    paddingLeft: SPACING.sm,   // Internal padding for left alignment
  },
  dateBlockPast: {
    opacity: 0.7,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: -2,
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
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  locationText: {
    flex: 1,        // Take remaining space and truncate if needed
    flexShrink: 1,  // Allow shrinking to keep avatar on same line
  },
  metaSeparator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.border,
    marginHorizontal: 2,
  },
  // Child row (separate line for avatar + name)
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
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
