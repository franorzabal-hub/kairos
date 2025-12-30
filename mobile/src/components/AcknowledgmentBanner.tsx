import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS } from '../theme';

interface AcknowledgmentBannerProps {
  isAcknowledged: boolean;
  onAcknowledge: () => void;
  isLoading?: boolean;
}

export default function AcknowledgmentBanner({
  isAcknowledged,
  onAcknowledge,
  isLoading = false,
}: AcknowledgmentBannerProps) {
  if (isAcknowledged) {
    return (
      <View style={[styles.container, styles.acknowledgedContainer]}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.acknowledgedTitle}>Confirmado</Text>
          <Text style={styles.acknowledgedSubtitle}>
            Has confirmado la lectura de esta novedad
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.pendingContainer]}>
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.pendingTitle}>Requiere confirmación</Text>
          <Text style={styles.pendingSubtitle}>
            El colegio solicita que confirmes la lectura
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.acknowledgeButton}
        onPress={onAcknowledge}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
            <Text style={styles.buttonText}>Confirmar lectura</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDERS.radius.lg,
  },
  pendingContainer: {
    backgroundColor: '#FEF3C7', // Light amber
    borderWidth: 1,
    borderColor: '#F59E0B', // Amber border
  },
  acknowledgedContainer: {
    backgroundColor: '#D1FAE5', // Light green
    borderWidth: 1,
    borderColor: '#10B981', // Green border
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E', // Dark amber
    marginBottom: 2,
  },
  pendingSubtitle: {
    fontSize: 14,
    color: '#B45309', // Medium amber
  },
  acknowledgedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46', // Dark green
    marginBottom: 2,
  },
  acknowledgedSubtitle: {
    fontSize: 14,
    color: '#047857', // Medium green
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.xs,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
