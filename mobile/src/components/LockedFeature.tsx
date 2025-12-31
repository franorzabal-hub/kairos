/**
 * LockedFeature - Friendly UI for permission-denied states
 *
 * Shows a nice lock icon with a message when the user
 * doesn't have access to a feature.
 *
 * Migrated to NativeWind (Tailwind CSS) for styling consistency.
 * Uses custom theme colors defined in tailwind.config.js.
 *
 * @example
 * ```tsx
 * <LockedFeature nombre="Boletines" />
 * <LockedFeature collection="reports" />
 * ```
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

// Map collection names to friendly Spanish names
const COLLECTION_NAMES: Record<string, string> = {
  reports: 'Boletines',
  announcements: 'Novedades',
  events: 'Eventos',
  conversations: 'Mensajes',
  conversation_messages: 'Mensajes',
  pickup_requests: 'Cambios de Horario',
  students: 'Información del Alumno',
  attendance: 'Asistencia',
  grades: 'Calificaciones',
};

interface LockedFeatureProps {
  /** Human-readable name to display */
  nombre?: string;

  /** Collection name (used if nombre not provided) */
  collection?: string;

  /** Subtitle message */
  subtitle?: string;

  /** Compact mode for inline usage */
  compact?: boolean;
}

export default function LockedFeature({
  nombre,
  collection,
  subtitle = 'No tienes acceso a esta sección',
  compact = false,
}: LockedFeatureProps) {
  // Determine display name
  const displayName = nombre || (collection ? COLLECTION_NAMES[collection] || collection : 'Esta sección');

  if (compact) {
    return (
      <View className="flex-row items-center gap-1 py-1 px-2 bg-lightGray rounded-lg">
        <Ionicons name="lock-closed" size={16} color={COLORS.gray} />
        <Text className="text-xs text-gray">{displayName}</Text>
      </View>
    );
  }

  return (
    <View className="p-4 items-center bg-lightGray rounded-xl m-3">
      <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-3">
        <Ionicons name="lock-closed" size={32} color={COLORS.gray} />
      </View>
      <Text className="text-base font-medium text-darkGray text-center">
        {displayName}
      </Text>
      <Text className="text-sm text-gray mt-1 text-center">
        {subtitle}
      </Text>
    </View>
  );
}

/**
 * LockedSection - Full-width locked section for screens
 */
interface LockedSectionProps {
  nombre?: string;
  collection?: string;
  description?: string;
}

export function LockedSection({
  nombre,
  collection,
  description = 'Contacta al colegio para más información.',
}: LockedSectionProps) {
  const displayName = nombre || (collection ? COLLECTION_NAMES[collection] || collection : 'Esta sección');

  return (
    <View className="flex-1 items-center justify-center px-5 py-6">
      <View className="w-20 h-20 rounded-full bg-lightGray items-center justify-center mb-4">
        <Ionicons name="lock-closed-outline" size={48} color={COLORS.gray} />
      </View>
      <Text className="text-xl font-bold text-darkGray text-center">
        {displayName}
      </Text>
      <Text className="text-sm text-gray mt-2 text-center">
        No tienes acceso a esta sección
      </Text>
      {description && (
        <Text className="text-xs text-gray mt-3 text-center">
          {description}
        </Text>
      )}
    </View>
  );
}
