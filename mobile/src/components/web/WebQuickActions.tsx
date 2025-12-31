/**
 * WebQuickActions - Quick action buttons following mobile pattern
 *
 * Design Pattern (matching mobile QuickAccess):
 * - 56×56px (w-14 h-14) rounded-xl icon containers
 * - Unified primary color for all icons
 * - bg-lightGray background on icon container
 * - Label below icon (2 lines max)
 * - Horizontal grid for web (vs scroll on mobile)
 */
import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../theme';

interface WebQuickAccessProps {
  onReportAbsence?: () => void;
  onPickupChange?: () => void;
  onContactSchool?: () => void;
}

export function WebQuickActions({
  onReportAbsence,
  onPickupChange,
  onContactSchool
}: WebQuickAccessProps) {
  const router = useRouter();

  const actions = [
    {
      id: 'absence',
      label: 'Reportar Ausencia',
      icon: 'medical-outline' as const,
      onPress: onReportAbsence,
    },
    {
      id: 'pickup',
      label: 'Cambio de Salida',
      icon: 'time-outline' as const,
      onPress: onPickupChange || (() => router.push('/mishijos')),
    },
    {
      id: 'contact',
      label: 'Contactar Colegio',
      icon: 'call-outline' as const,
      onPress: onContactSchool || (() => router.push('/mensajes')),
    },
  ];

  return (
    <View className="flex-row gap-6">
      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          className="items-center group"
          style={Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}}
        >
          {/* Icon Container - matching mobile w-14 h-14 rounded-xl bg-lightGray */}
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mb-2 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: COLORS.lightGray }}
          >
            <Ionicons name={action.icon} size={24} color={COLORS.primary} />
          </View>
          {/* Label */}
          <Text
            className="text-xs text-gray-700 text-center font-medium max-w-[80px]"
            numberOfLines={2}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default WebQuickActions;
