import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';

interface PendingEventsBannerProps {
  events: Event[];
  acknowledgedIds: Set<string>;
}

export default function PendingEventsBanner({ events, acknowledgedIds }: PendingEventsBannerProps) {
  const router = useRouter();

  // Filter events that require confirmation and haven't been acknowledged
  const pendingEvents = events.filter(event =>
    event.requires_confirmation && !acknowledgedIds.has(event.id)
  );

  if (pendingEvents.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={18} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Pendientes de Respuesta</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingEvents.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal={pendingEvents.length > 1}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.eventsContainer}
      >
        {pendingEvents.map((event, index) => (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.eventItem,
              pendingEvents.length === 1 && styles.eventItemFull,
              index < pendingEvents.length - 1 && styles.eventItemWithMargin,
            ]}
            onPress={() => router.push({ pathname: '/agenda/[id]', params: { id: event.id } })}
          >
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>{formatDate(event.start_date)}</Text>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>Responder</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.warning} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warningLight,
    marginHorizontal: SPACING.screenPadding,
    marginVertical: SPACING.sm,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  badge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDERS.radius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  eventsContainer: {
    flexDirection: 'row',
  },
  eventItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 200,
    ...SHADOWS.small,
  },
  eventItemFull: {
    flex: 1,
  },
  eventItemWithMargin: {
    marginRight: SPACING.sm,
  },
  eventInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  eventDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: 2,
  },
  eventTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.warning,
  },
});
