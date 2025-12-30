import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import ScreenHeader from '../components/ScreenHeader';
import QuickAccess from '../components/QuickAccess';
import SegmentedControl from '../components/SegmentedControl';
import ChildSelector from '../components/ChildSelector';
import SwipeableAnnouncementCard from '../components/SwipeableAnnouncementCard';
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
  const { filterMode, setFilterMode, selectedChildId, children } = useFilters();
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
  const pinnedIds = useMemo(() => announcementStates?.pinnedIds instanceof Set ? announcementStates.pinnedIds : new Set<string>(), [announcementStates]);
  const archivedIds = useMemo(() => announcementStates?.archivedIds instanceof Set ? announcementStates.archivedIds : new Set<string>(), [announcementStates]);
  const acknowledgedIds = useMemo(() => announcementStates?.acknowledgedIds instanceof Set ? announcementStates.acknowledgedIds : new Set<string>(), [announcementStates]);

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

  const formatEventDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  };

  const formatEventMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().replace('.', '');
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
      {/* Header with avatar */}
      <ScreenHeader />

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
                {/* Date Block - prominently displayed */}
                <View style={styles.eventDateBlock}>
                  <Text style={styles.eventDateMonth}>{formatEventMonth(event.start_date)}</Text>
                  <Text style={styles.eventDateDay}>{formatEventDay(event.start_date)}</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Novedades Section Header */}
      <View style={styles.novedadesHeader}>
        <View style={styles.novedadesTitleRow}>
          <Text style={styles.sectionTitle}>Novedades</Text>
          <ChildSelector compact />
        </View>
      </View>
      <SegmentedControl
        segments={[
          { key: 'unread', label: 'No leídas', count: unreadCounts.inicio },
          { key: 'all', label: 'Todas' },
        ]}
        selectedKey={filterMode === 'unread' ? 'unread' : 'all'}
        onSelect={(key) => setFilterMode(key as 'unread' | 'all')}
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
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  eventsSection: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg, // Increased spacing before Novedades section
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
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
    padding: SPACING.md,
    alignItems: 'center',
  },
  eventDateBlock: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  eventDateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: -2,
  },
  eventDateDay: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  eventContent: {
    alignItems: 'center',
  },
  eventTitle: {
    ...TYPOGRAPHY.listItemTitle,
    fontSize: 13,
    textAlign: 'center',
    color: COLORS.darkGray,
  },
  novedadesHeader: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  novedadesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
