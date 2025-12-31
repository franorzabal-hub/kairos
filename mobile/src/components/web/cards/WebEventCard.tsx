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
      className="flex-row bg-white rounded-xl overflow-hidden shadow-sm border border-transparent hover:border-gray-300 hover:shadow-md transition-all cursor-pointer h-32 group"
    >
      {/* Date Block - Left Side */}
      <View 
        className="w-24 items-center justify-center border-r border-gray-100"
        style={{ backgroundColor: isPast ? '#F3F4F6' : dateBlockBgColor + '10' }} // Light background opacity
      >
        <Text 
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: isPast ? COLORS.gray : dateBlockBgColor }}
        >
          {formatMonth(event.start_date)}
        </Text>
        <Text 
          className="text-3xl font-bold"
          style={{ color: isPast ? COLORS.gray : dateBlockBgColor }}
        >
          {formatDay(event.start_date)}
        </Text>
        <Text className="text-xs font-medium text-gray-500 mt-1">
          {formatTime(event.start_date)}
        </Text>
      </View>

      {/* Main Content - Center */}
      <View className="flex-1 p-4 justify-center">
        {/* Status / Child Tag */}
        <View className="flex-row items-center mb-2 gap-2">
          {childName && (
            <View className="flex-row items-center bg-gray-100 rounded-full px-2 py-0.5">
              <View 
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: childColor || COLORS.primary }} 
              />
              <Text className="text-xs font-medium text-gray-600">
                {childName}
              </Text>
            </View>
          )}
          {isCancelled && (
            <View className="bg-red-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-red-600 uppercase">Cancelado</Text>
            </View>
          )}
          {isUnread && (
            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-primary uppercase">Nuevo</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text 
          className={`text-lg font-semibold text-gray-900 mb-1 ${isPast ? 'text-gray-500' : ''} ${isCancelled ? 'line-through' : ''}`}
          numberOfLines={1}
        >
          {event.title}
        </Text>

        {/* Location */}
        {event.location_external && (
          <View className="flex-row items-center text-gray-500">
            <Ionicons name="location-outline" size={14} color={COLORS.gray500} style={{ marginRight: 4 }} />
            <Text className="text-sm text-gray-500" numberOfLines={1}>
              {event.location_external}
            </Text>
          </View>
        )}
      </View>

      {/* Action / Context - Right Side */}
      <View className="w-32 p-4 items-end justify-center border-l border-gray-50 bg-gray-50/30">
        {ctaConfig ? (
          <Pressable 
            onPress={handleActionPress}
            className="px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: ctaConfig.bgColor }}
          >
            <Text 
              className="text-xs font-bold"
              style={{ color: ctaConfig.textColor }}
            >
              {ctaConfig.label}
            </Text>
          </Pressable>
        ) : (
          <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray500} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default WebEventCard;
