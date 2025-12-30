import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import QuickAccess from '../components/QuickAccess';
import FilterBar from '../components/FilterBar';
import SwipeableAnnouncementCard from '../components/SwipeableAnnouncementCard';
import DirectusImage from '../components/DirectusImage';
import { useFilters, useUnreadCounts, useAppContext } from '../context/AppContext';
import {
  useAnnouncements,
  useChildren,
  useContentReadStatus,
  useAnnouncementStates,
  useAnnouncementPin,
  useAnnouncementArchive,
  useEvents
} from '../api/hooks';
import { Announcement, Event } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';
import { stripHtml } from '../utils';

export default function InicioScreen() {
  const router = useRouter();
  const { filterMode, selectedChildId, children } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { user } = useAppContext();
  const { isRead, filterUnread, markAsRead } = useContentReadStatus('announcements');

  // Fetch children on mount
  useChildren();

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements, isRefetching: isRefetchingAnnouncements } = useAnnouncements();

  // Fetch events for upcoming section
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();

  // Fetch user's pinned/archived/acknowledged states
  const { data: announcementStates, isLoading: statesLoading } = useAnnouncementStates();
  const pinnedIds = announcementStates?.pinnedIds ?? new Set<string>();
  const archivedIds = announcementStates?.archivedIds ?? new Set<string>();
  const acknowledgedIds = announcementStates?.acknowledgedIds ?? new Set<string>();

  // Pin and archive mutations for swipe actions
  const { togglePin } = useAnnouncementPin();
  const { toggleArchive } = useAnnouncementArchive();

  // Get selected child's section for filtering
  const selectedChild = selectedChildId
    ? children.find(c => c.id === selectedChildId)
    : null;

  // Calculate counts for filter badges
  const pinnedCount = pinnedIds.size;
  const archivedCount = archivedIds.size;

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return events
      .filter(event => {
        const startDate = new Date(event.start_date);
        return startDate >= now && startDate <= weekFromNow;
      })
      .slice(0, 3); // Show max 3 events
  }, [events]);

  // Apply filters and sorting to announcements
  const filteredAnnouncements = useMemo(() => {
    let result = announcements;

    // Filter by selected child first (always applies)
    if (selectedChild) {
      result = result.filter(announcement => {
        if (announcement.target_type === 'all') return true;
        if (announcement.target_type === 'section') {
          return announcement.target_id === selectedChild.section_id;
        }
        if (announcement.target_type === 'grade') {
          return true; // TODO: Need to fetch grade_id from section
        }
        return true;
      });
    }

    // Apply filter mode
    switch (filterMode) {
      case 'unread':
        result = filterUnread(result).filter(a => !archivedIds.has(a.id));
        break;
      case 'all':
        result = result.filter(a => !archivedIds.has(a.id));
        break;
      case 'pinned':
        result = result.filter(a => pinnedIds.has(a.id));
        break;
      case 'archived':
        result = result.filter(a => archivedIds.has(a.id));
        break;
    }

    // Sort: pinned items first
    if (filterMode !== 'pinned' && filterMode !== 'archived') {
      result = [...result].sort((a, b) => {
        const aPinned = pinnedIds.has(a.id) || a.is_pinned;
        const bPinned = pinnedIds.has(b.id) || b.is_pinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.published_at || b.created_at).getTime() -
               new Date(a.published_at || a.created_at).getTime();
      });
    }

    return result;
  }, [announcements, filterMode, filterUnread, selectedChild, pinnedIds, archivedIds]);

  const isLoading = announcementsLoading || statesLoading;

  const onRefresh = async () => {
    await Promise.all([refetchAnnouncements(), refetchEvents()]);
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  // Placeholder handlers for quick actions
  const handleReportAbsence = () => {
    // TODO: Implement absence report flow
    console.log('Report absence');
  };

  const handlePickupChange = () => {
    router.push('/mishijos');
  };

  const handleContactSchool = () => {
    router.push('/mensajes');
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Header with settings icon */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Hola, {user?.first_name || 'Usuario'}
          </Text>
          <Text style={styles.subGreeting}>
            Bienvenido a Kairos
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>

      {/* Quick Access Buttons */}
      <QuickAccess
        onReportAbsence={handleReportAbsence}
        onPickupChange={handlePickupChange}
        onContactSchool={handleContactSchool}
      />

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <TouchableOpacity onPress={() => router.push('/agenda')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
          >
            {upcomingEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push({ pathname: '/agenda/[id]', params: { id: event.id } })}
              >
                <DirectusImage
                  fileId={event.image}
                  style={styles.eventImage}
                  resizeMode="cover"
                  fallback={
                    <View style={styles.eventImagePlaceholder}>
                      <Ionicons name="calendar" size={24} color={COLORS.primary} />
                    </View>
                  }
                />
                <View style={styles.eventContent}>
                  <Text style={styles.eventDate}>{formatEventDate(event.start_date)}</Text>
                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Novedades Section Header */}
      <View style={styles.novedadesHeader}>
        <Text style={styles.sectionTitle}>Novedades</Text>
      </View>
      <FilterBar
        unreadCount={unreadCounts.inicio}
        pinnedCount={pinnedCount}
        archivedCount={archivedCount}
        showPinnedFilter={true}
        showArchivedFilter={true}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredAnnouncements}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetchingAnnouncements} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: Announcement }) => {
            const itemIsUnread = !isRead(item.id);
            const itemIsPinned = pinnedIds.has(item.id) || Boolean(item.is_pinned);
            const itemIsArchived = archivedIds.has(item.id);
            const itemIsAcknowledged = acknowledgedIds.has(item.id);

            return (
              <SwipeableAnnouncementCard
                item={item}
                isUnread={itemIsUnread}
                isPinned={itemIsPinned}
                isArchived={itemIsArchived}
                isAcknowledged={itemIsAcknowledged}
                onMarkAsRead={() => markAsRead(item.id)}
                onTogglePin={() => togglePin(item.id, itemIsPinned)}
                onArchive={() => toggleArchive(item.id, false)}
                onUnarchive={() => toggleArchive(item.id, true)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {filterMode === 'unread'
                  ? 'No hay novedades sin leer'
                  : filterMode === 'pinned'
                  ? 'No hay novedades fijadas'
                  : filterMode === 'archived'
                  ? 'No hay novedades archivadas'
                  : 'No hay novedades'}
              </Text>
            </View>
          }
          estimatedItemSize={150}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  listHeader: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.heading,
    color: COLORS.darkGray,
  },
  subGreeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginTop: 2,
  },
  settingsButton: {
    padding: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  eventsSection: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
  },
  seeAll: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  eventsScroll: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
  },
  eventCard: {
    width: 180,
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  eventImage: {
    width: '100%',
    height: 100,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    padding: SPACING.sm,
  },
  eventDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTitle: {
    ...TYPOGRAPHY.listItemTitle,
    fontSize: 14,
  },
  novedadesHeader: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
