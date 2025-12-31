/**
 * WebEventCard - Web-optimized event card following mobile pattern
 *
 * Design Pattern (matching mobile InicioScreen):
 * - Prominent date block (MES/DÍA) with primaryLight background
 * - Simple, clean layout
 * - Title and basic info
 * - Hover effects for web
 */
import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DirectusImage from '../../DirectusImage';
import { Event } from '../../../api/directus';
import { useEventCardLogic } from '../../../hooks';
import { COLORS } from '../../../theme';
import { EventStatus } from '../../../types/events';

interface WebEventCardProps {
  event: Event;
  isUnread?: boolean;
  status?: EventStatus;
  childName?: string;
  childColor?: string;
  onPress?: () => void;
  onActionPress?: () => void;
}

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

  const {
    formatMonth,
    formatDay,
    formatTime,
    accessibilityLabel,
    isPast,
    isCancelled,
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

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer h-full group"
      style={Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}}
    >
      {/* Image Section - Full width at top like mobile cards */}
      {event.image ? (
        <View className="relative">
          <DirectusImage
            fileId={event.image}
            style={{ width: '100%', height: 120 }}
            contentFit="cover"
          />
          {/* Date Badge Overlay (like mobile announcement pattern) */}
          <View
            className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md flex-row items-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          >
            <Ionicons name="calendar-outline" size={12} color={COLORS.white} style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-semibold">
              {formatDay(event.start_date)} {formatMonth(event.start_date)}
            </Text>
          </View>
          {/* Badges */}
          {isUnread && (
            <View className="absolute top-2 right-2 bg-orange-500 px-2 py-0.5 rounded">
              <Text className="text-[10px] font-bold text-white uppercase">NUEVO</Text>
            </View>
          )}
          {isCancelled && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded">
              <Text className="text-[10px] font-bold text-white uppercase">CANCELADO</Text>
            </View>
          )}
        </View>
      ) : (
        /* Fallback: Date Block Style (matching mobile InicioScreen) */
        <View className="p-4 pb-2">
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mb-3"
            style={{ backgroundColor: COLORS.primaryLight }}
          >
            <Text
              className="text-xs font-semibold uppercase"
              style={{ color: COLORS.primary, letterSpacing: 0.5, marginBottom: -2 }}
            >
              {formatMonth(event.start_date)}
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{ color: COLORS.primary, letterSpacing: -0.5 }}
            >
              {formatDay(event.start_date)}
            </Text>
          </View>

          {/* Badges for no-image cards */}
          <View className="absolute top-2 right-2 flex-row gap-2">
            {isUnread && (
              <View className="bg-orange-100 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-orange-700 uppercase">NUEVO</Text>
              </View>
            )}
            {isCancelled && (
              <View className="bg-red-100 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-red-600 uppercase">CANCELADO</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Content Section */}
      <View className={`px-4 ${event.image ? 'pt-3' : 'pt-0'} pb-3 flex-1`}>
        {/* Title */}
        <Text
          className={`text-base font-bold leading-snug mb-2 ${isPast ? 'text-gray-400' : 'text-gray-900'} ${isCancelled ? 'line-through' : ''}`}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        {/* Time & Location */}
        <View className="gap-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={14} color={COLORS.gray500} />
            <Text className="text-sm text-gray-500">{formatTime(event.start_date)}</Text>
          </View>
          {event.location_external && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={14} color={COLORS.gray500} />
              <Text className="text-sm text-gray-500" numberOfLines={1}>{event.location_external}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View className="mt-auto border-t border-gray-100 px-4 py-2.5 flex-row items-center justify-between bg-gray-50/50">
        {childName ? (
          <View className="flex-row items-center gap-2">
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{ backgroundColor: childColor || COLORS.primary }}
            >
              <Text className="text-[9px] font-bold text-white">
                {childName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">{childName}</Text>
          </View>
        ) : (
          <Text className="text-xs text-gray-400">General</Text>
        )}

        <View className="flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Text className="text-xs font-medium text-gray-500">Ver detalles</Text>
          <Ionicons name="chevron-forward" size={12} color={COLORS.gray400} />
        </View>
      </View>
    </Pressable>
  );
}

export default WebEventCard;
