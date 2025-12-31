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

      {/* Footer: Child Info & Action */}
      <View className="mt-auto border-t border-gray-100 bg-gray-50/50 px-4 py-3 flex-row items-center justify-between">
        
        {/* Left: Child Identity */}
        <View className="flex-row items-center gap-2">
          {childName ? (
            <>
              <View 
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: childColor || COLORS.primary }}
              >
                <Text className="text-[10px] font-bold text-white">
                  {childName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-xs font-medium text-gray-600">
                {childName}
              </Text>
            </>
          ) : (
            <Text className="text-xs font-medium text-gray-400">General</Text>
          )}
        </View>

        {/* Right: Compact Action */}
        {ctaConfig ? (
          <Pressable 
            onPress={handleActionPress}
            className="px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
          >
            <Text 
              className="text-xs font-bold"
              style={{ color: ctaConfig.textColor }}
            >
              {ctaConfig.label}
            </Text>
          </Pressable>
        ) : (
          <View className="px-3 py-1.5">
            <Text className="text-xs font-medium text-gray-400">Detalles</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default WebEventCard;
