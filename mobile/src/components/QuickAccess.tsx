/**
 * QuickAccess - Quick action buttons for common tasks
 *
 * Migrated to NativeWind (Tailwind CSS) for styling consistency.
 * Uses custom theme colors defined in tailwind.config.js.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../theme';

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
  onPress?: () => void;
}

interface QuickAccessProps {
  onReportAbsence?: () => void;
  onPickupChange?: () => void;
  onContactSchool?: () => void;
}

function QuickAccess({
  onReportAbsence,
  onPickupChange,
  onContactSchool
}: QuickAccessProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'absence',
      label: 'Reportar Ausencia',
      icon: 'medical-outline',
      color: COLORS.primary,
      onPress: onReportAbsence,
    },
    {
      id: 'pickup',
      label: 'Cambio de Salida',
      icon: 'time-outline',
      color: COLORS.primary,
      onPress: onPickupChange || (() => router.push('/mishijos')),
    },
    {
      id: 'contact',
      label: 'Contactar Colegio',
      icon: 'call-outline',
      color: COLORS.primary,
      onPress: onContactSchool || (() => router.push('/mensajes')),
    },
  ];

  return (
    <View className="bg-white py-3 mb-6">
      <Text className="text-xl font-bold text-darkGray px-4 mb-2">
        Acciones Rápidas
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            className="items-center w-20"
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 rounded-xl items-center justify-center mb-1 bg-lightGray">
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text
              className="text-xs text-darkGray text-center font-medium"
              numberOfLines={2}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(QuickAccess);
