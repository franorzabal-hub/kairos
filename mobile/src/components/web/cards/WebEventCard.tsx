/**
 * WebEventCard - Web-optimized event card
 *
 * Features:
 * - Horizontal layout utilizing full width
 * - Date block on left
 * - Detailed content in middle
 * - Map/Image/Context on right
 * - Hover actions
 */
import React from 'react';
import { View, Text, Pressable, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../../../api/directus';
import { useEventCardLogic } from '../../../hooks';
import { COLORS } from '../../../theme';
import { EventStatus } from '../../../types/events';
import DirectusImage from '../../DirectusImage';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

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
    dateBlockBgColor,
    dateBlockTextColor,
    accessibilityLabel,
    isPast,
    isCancelled,
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

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer h-full group"
    >
      {/* Header: Date & Status */}
      <View className="flex-row items-start justify-between p-4 pb-2">
        {/* Date Block (Compact) */}
        <View className="flex-row items-baseline gap-1">
          <Text className="text-2xl font-bold text-gray-900">
            {formatDay(event.start_date)}
          </Text>
          <Text className="text-sm font-semibold uppercase text-gray-500">
            {formatMonth(event.start_date)}
          </Text>
        </View>

        {/* Badges */}
        <View className="flex-row gap-2">
           {isUnread && (
            <View className="bg-orange-100 px-2 py-0.5 rounded text-orange-700">
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

      {/* Body: Content */}
      <View className="px-4 flex-1">
        {/* Child Indicator */}
        {childName && (
           <Text className="text-xs font-medium text-gray-500 mb-1">
             {childName}
           </Text>
        )}

        {/* Title */}
        <Text 
          className={`text-lg font-bold text-gray-900 leading-snug mb-2 ${isPast ? 'text-gray-500' : ''} ${isCancelled ? 'line-through' : ''}`}
        >
          {event.title}
        </Text>

        {/* Details */}
        <View className="gap-1 mb-4">
           <View className="flex-row items-center gap-1.5">
             <Ionicons name="time-outline" size={14} color={COLORS.gray500} />
             <Text className="text-sm text-gray-600">{formatTime(event.start_date)}</Text>
           </View>
           {event.location_external && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={14} color={COLORS.gray500} />
              <Text className="text-sm text-gray-600" numberOfLines={1}>{event.location_external}</Text>
            </View>
           )}
        </View>
      </View>

      {/* Footer: Action Button */}
      <View className="mt-auto border-t border-gray-100">
        {ctaConfig ? (
          <Pressable 
            onPress={handleActionPress}
            className="w-full py-3 items-center justify-center bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <Text 
              className="text-sm font-bold text-orange-600"
            >
              {ctaConfig.label}
            </Text>
          </Pressable>
        ) : (
          <View className="w-full py-3 items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
            <Text className="text-sm font-medium text-gray-500">Ver detalles</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default WebEventCard;
