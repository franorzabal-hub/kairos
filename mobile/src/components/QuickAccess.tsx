import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';

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

export default function QuickAccess({
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
    <View style={styles.container}>
      <Text style={styles.title}>Acciones Rápidas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={2}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
  },
  actionButton: {
    alignItems: 'center',
    width: 80,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.lightGray,
  },
  actionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
});
