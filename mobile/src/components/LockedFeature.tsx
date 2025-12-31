/**
 * LockedFeature - Friendly UI for permission-denied states
 *
 * Shows a nice lock icon with a message when the user
 * doesn't have access to a feature.
 *
 * @example
 * ```tsx
 * <LockedFeature nombre="Boletines" />
 * <LockedFeature collection="reports" />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDERS } from '../theme';

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
      <View style={styles.compactContainer}>
        <Ionicons name="lock-closed" size={16} color={COLORS.gray} />
        <Text style={styles.compactText}>{displayName}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={32} color={COLORS.gray} />
      </View>
      <Text style={styles.title}>{displayName}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
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
    <View style={styles.sectionContainer}>
      <View style={styles.sectionIcon}>
        <Ionicons name="lock-closed-outline" size={48} color={COLORS.gray} />
      </View>
      <Text style={styles.sectionTitle}>{displayName}</Text>
      <Text style={styles.sectionSubtitle}>No tienes acceso a esta sección</Text>
      {description && (
        <Text style={styles.sectionDescription}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Standard locked feature
  container: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    margin: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Compact inline version
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.md,
  },
  compactText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },

  // Full section version
  sectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  sectionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  sectionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
