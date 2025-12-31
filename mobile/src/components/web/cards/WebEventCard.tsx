/**
 * WebEventCard - Grid-friendly event card for web
 *
 * Features:
 * - Hover effects instead of touch feedback
 * - Fixed height for consistent grid layout
 * - Action buttons on hover
 * - Works well in 2-3 column grids
 */
import React from 'react';
import { View, Text, Pressable, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export type EventStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'info'
  | 'cancelled'
  | 'past';

interface WebEventCardProps {
  event: Event;
  isUnread?: boolean;
  status?: EventStatus;
  childName?: string;
  childColor?: string;
  onPress?: () => void;
  onActionPress?: () => void;
}

/**
 * Creates a pastel version of a hex color
 */
function getPastelColor(hexColor: string, intensity: number = 0.2): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const blendedR = Math.round(r * intensity + 255 * (1 - intensity));
  const blendedG = Math.round(g * intensity + 255 * (1 - intensity));
  const blendedB = Math.round(b * intensity + 255 * (1 - intensity));
  return `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`;
}

const CTA_CONFIG: Partial<Record<EventStatus, {
  label: string;
  bgColor: string;
  textColor: string;
}>> = {
  pending: { label: 'Responder', bgColor: COLORS.warningLight, textColor: COLORS.warning },
  confirmed: { label: '✓ Confirmado', bgColor: COLORS.successLight, textColor: COLORS.success },
  declined: { label: 'Declinado', bgColor: COLORS.errorLight, textColor: COLORS.error },
};

export function WebEventCard({
  event,
  isUnread = false,
  status = 'info',
  childName,
  childColor,
  onPress,
  onActionPress,
}: WebEventCardProps) {
  const router = useRouter();
  const isPast = status === 'past';
  const isCancelled = status === 'cancelled';
  const isPending = status === 'pending';
  const ctaConfig = CTA_CONFIG[status];

  const handlePress = () => {
    onPress?.();
    router.push({ pathname: '/agenda/[id]', params: { id: event.id } });
  };

  const handleActionPress = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onActionPress ? onActionPress() : handlePress();
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().replace('.', '');
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const dateBlockBgColor = childColor ? getPastelColor(childColor, 0.2) : COLORS.primaryLight;
  const dateBlockTextColor = childColor || COLORS.primary;

  return (
    <Pressable
      onPress={handlePress}
      style={(state) => ({
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDERS.radius.lg,
        padding: SPACING.md,
        alignItems: 'center',
        ...(Platform.OS === 'web' ? {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          transform: (state as WebPressableState).hovered ? 'translateY(-2px)' : 'none',
          cursor: 'pointer',
        } as any : SHADOWS.card),
        ...(isPending && {
          borderLeftWidth: 4,
          borderLeftColor: COLORS.warning,
        }),
        ...(isPast && { opacity: 0.6 }),
      })}
    >
      {/* Date Block */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: BORDERS.radius.lg,
          backgroundColor: dateBlockBgColor,
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingLeft: SPACING.sm,
          ...(isPast && { opacity: 0.7 }),
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: dateBlockTextColor,
          }}
        >
          {formatMonth(event.start_date)}
        </Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            letterSpacing: -0.5,
            marginTop: -2,
            color: dateBlockTextColor,
          }}
        >
          {formatDay(event.start_date)}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginLeft: SPACING.md, marginRight: SPACING.sm }}>
        <Text
          style={{
            ...TYPOGRAPHY.listItemTitle,
            fontWeight: isUnread ? '700' : '600',
            color: isPast ? COLORS.gray : COLORS.darkGray,
            ...(isCancelled && { textDecorationLine: 'line-through' }),
          }}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={isPast ? COLORS.border : COLORS.gray} />
          <Text style={{ ...TYPOGRAPHY.caption, color: isPast ? COLORS.border : COLORS.gray }}>
            {formatTime(event.start_date)}
          </Text>

          {event.location_external && (
            <>
              <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.border, marginHorizontal: 2 }}>•</Text>
              <Ionicons name="location-outline" size={12} color={isPast ? COLORS.border : COLORS.gray} />
              <Text
                style={{ ...TYPOGRAPHY.caption, color: isPast ? COLORS.border : COLORS.gray, flex: 1 }}
                numberOfLines={1}
              >
                {event.location_external}
              </Text>
            </>
          )}
        </View>

        {/* Child indicator */}
        {childName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: childColor || COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.white }}>
                {childName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: childColor || COLORS.primary }}>
              {childName}
            </Text>
          </View>
        )}
      </View>

      {/* Right: CTA or Chevron */}
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        {ctaConfig ? (
          <Pressable
            onPress={handleActionPress as any}
            style={(state) => ({
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.sm,
              borderRadius: BORDERS.radius.md,
              backgroundColor: ctaConfig.bgColor,
              ...(Platform.OS === 'web' && {
                cursor: 'pointer',
                opacity: (state as WebPressableState).hovered ? 0.8 : 1,
              } as any),
            })}
          >
            <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: ctaConfig.textColor }}>
              {ctaConfig.label}
            </Text>
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={isPast ? COLORS.border : COLORS.gray} />
        )}
      </View>
    </Pressable>
  );
}

export default React.memo(WebEventCard);
