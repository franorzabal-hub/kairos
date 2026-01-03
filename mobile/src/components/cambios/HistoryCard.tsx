import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickupRequest } from '../../api/frappe';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, BADGE_STYLES, SHADOWS } from '../../theme';

interface Child {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface HistoryCardProps {
  request: PickupRequest;
  children: Child[];
  canEdit: boolean;
  onEdit: (request: PickupRequest) => void;
}

const HistoryCard = React.memo(({ request, children, canEdit, onEdit }: HistoryCardProps) => {
  const child = children.find(c => c.id === request.student_id);
  const childName = child ? `${child.first_name} ${child.last_name}` : 'Estudiante';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getStatusBadgeStyle = () => {
    switch (request.status) {
      case 'approved':
        return styles.statusBadgeApproved;
      case 'rejected':
        return styles.statusBadgeRejected;
      default:
        return styles.statusBadgePending;
    }
  };

  const getStatusLabel = () => {
    switch (request.status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>
          {formatDate(request.pickup_date)} - {request.pickup_time}
        </Text>
        <View style={styles.headerRight}>
          {canEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(request)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <View style={getStatusBadgeStyle()}>
            <Text style={styles.statusText}>{getStatusLabel()}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.historyChild}>{childName}</Text>
      <Text style={styles.historyDetail}>Motivo: {request.reason}</Text>
      <Text style={styles.historyDetail}>Se retira con: {request.authorized_person}</Text>
      {request.notes ? (
        <Text style={styles.historyDetail}>Notas: {request.notes}</Text>
      ) : null}
    </View>
  );
});

HistoryCard.displayName = 'HistoryCard';

export default HistoryCard;

const styles = StyleSheet.create({
  historyCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  historyDate: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    padding: SPACING.xs,
  },
  historyChild: {
    ...TYPOGRAPHY.listItemTitle,
    marginBottom: SPACING.sm,
  },
  historyDetail: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: 2,
  },
  statusBadgeApproved: {
    ...BADGE_STYLES.statusApproved,
  },
  statusBadgeRejected: {
    ...BADGE_STYLES.statusRejected,
  },
  statusBadgePending: {
    ...BADGE_STYLES.statusPending,
  },
  statusText: {
    color: COLORS.white,
    ...TYPOGRAPHY.badge,
  },
});
