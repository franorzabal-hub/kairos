import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import ScreenHeader from '../components/ScreenHeader';
import QuickAccess from '../components/QuickAccess';
import SegmentedControl from '../components/SegmentedControl';
import ChildSelector from '../components/ChildSelector';
import SwipeableAnnouncementCard from '../components/SwipeableAnnouncementCard';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import {
  useAnnouncements,
  useContentReadStatus,
  useAnnouncementStates,
  useAnnouncementPin,
  useAnnouncementArchive,
  useEvents
} from '../api/hooks';
import { useSession } from '../hooks';
import { Announcement, Event } from '../api/directus';
import { COLORS, CHILD_COLORS, SPACING, BORDERS, TYPOGRAPHY, FONT_SIZES, SIZES } from '../theme';
import { stripHtml, logger } from '../utils';

export default function InicioScreen() {
  const router = useRouter();
  // Centralized session state - user, children, permissions
  const { user, children, selectedChildId, getChildById } = useSession();
  const { filterMode, setFilterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useContentReadStatus('announcements');

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements, isRefetching: isRefetchingAnnouncements } = useAnnouncements();

  // Fetch events for upcoming section
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();

  // Fetch user's pinned/archived/acknowledged states
  const { data: announcementStates, isLoading: statesLoading } = useAnnouncementStates();

  // OPTIMIZED: Consolidated 3 useMemo into 1 to reduce overhead
  const { pinnedIds, archivedIds, acknowledgedIds } = useMemo(() => ({
    pinnedIds: announcementStates?.pinnedIds instanceof Set ? announcementStates.pinnedIds : new Set<string>(),
    archivedIds: announcementStates?.archivedIds instanceof Set ? announcementStates.archivedIds : new Set<string>(),
    acknowledgedIds: announcementStates?.acknowledgedIds instanceof Set ? announcementStates.acknowledgedIds : new Set<string>(),
  }), [announcementStates]);

  // Pin and archive mutations for swipe actions
  const { togglePin } = useAnnouncementPin();
  const { toggleArchive } = useAnnouncementArchive();

  // Get selected child's section for filtering
  const selectedChild = selectedChildId ? getChildById(selectedChildId) || null : null;

  // Track previous child ID to detect changes and animate layout
  const prevChildIdRef = useRef(selectedChildId);
  useEffect(() => {
    if (prevChildIdRef.current !== selectedChildId) {
      // Animate layout change when child filter changes
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      prevChildIdRef.current = selectedChildId;
    }
  }, [selectedChildId]);

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

  // Get child info for announcement - shows which child it targets when viewing "Todos"
  const getChildInfo = (announcement: Announcement): { name?: string; color?: string } => {
    // Only show child indicator when viewing all children and there are multiple
    if (!selectedChildId && children.length > 1) {
      if (announcement.target_type === 'section') {
        const childIndex = children.findIndex(c => c.section_id === announcement.target_id);
        if (childIndex >= 0) {
          return {
            name: children[childIndex].first_name,
            color: CHILD_COLORS[childIndex % CHILD_COLORS.length],
          };
        }
      }
      // Announcements for all children don't get a specific indicator
      return {};
    }
    return {};
  };

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

  // Memoize handlers to prevent ListHeader re-renders
  const handleReportAbsence = useCallback(() => {
    // TODO: Implement absence report flow
    logger.debug('Report absence');
  }, []);

  const handlePickupChange = useCallback(() => {
    router.push('/mishijos');
  }, [router]);

  const handleContactSchool = useCallback(() => {
    router.push('/mensajes');
  }, [router]);

  // OPTIMIZED: Use useMemo instead of useCallback for JSX
  // Split into stable and dynamic parts to minimize re-renders
  const stableHeaderContent = useMemo(() => (
    <>
      {/* Header with avatar */}
      <ScreenHeader />

      {/* Quick Access Buttons - handlers are stable via useCallback */}
      <QuickAccess
        onReportAbsence={handleReportAbsence}
        onPickupChange={handlePickupChange}
        onContactSchool={handleContactSchool}
      />
    </>
  ), [handleReportAbsence, handlePickupChange, handleContactSchool]);

  // Event navigation handler - memoized to prevent inline function creation
  const handleEventPress = useCallback((eventId: string) => {
    router.push({ pathname: '/agenda/[id]', params: { id: eventId } });
  }, [router]);

  const handleSeeAllEvents = useCallback(() => {
    router.push('/agenda');
  }, [router]);

  // Memoize the events section separately since it depends on upcomingEvents
  const eventsSection = useMemo(() => {
    if (upcomingEvents.length === 0) return null;

    return (
      <View style={styles.eventsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <TouchableOpacity onPress={handleSeeAllEvents}>
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
              onPress={() => handleEventPress(event.id)}
            >
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
    );
  }, [upcomingEvents, handleSeeAllEvents, handleEventPress]);

  // Memoize filter section - depends on filterMode and unreadCounts
  const filterSection = useMemo(() => (
    <>
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
    </>
  ), [filterMode, unreadCounts.inicio, setFilterMode]);

  // Compose the full header from memoized parts
  const ListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {stableHeaderContent}
      {eventsSection}
      {filterSection}
    </View>
  ), [stableHeaderContent, eventsSection, filterSection]);

  // OPTIMIZED: Memoize renderItem to prevent re-creating callbacks on each render
  const renderAnnouncementItem = useCallback(({ item }: { item: Announcement }) => {
    const itemIsUnread = !isRead(item.id);
    const itemIsPinned = pinnedIds.has(item.id) || Boolean(item.is_pinned);
    const itemIsArchived = archivedIds.has(item.id);
    const itemIsAcknowledged = acknowledgedIds.has(item.id);
    const childInfo = getChildInfo(item);

    return (
      <SwipeableAnnouncementCard
        item={item}
        isUnread={itemIsUnread}
        isPinned={itemIsPinned}
        isArchived={itemIsArchived}
        isAcknowledged={itemIsAcknowledged}
        childName={childInfo.name}
        childColor={childInfo.color}
        onMarkAsRead={() => markAsRead(item.id)}
        onTogglePin={() => togglePin(item.id, itemIsPinned)}
        onArchive={() => toggleArchive(item.id, false)}
        onUnarchive={() => toggleArchive(item.id, true)}
      />
    );
  }, [isRead, pinnedIds, archivedIds, acknowledgedIds, getChildInfo, markAsRead, togglePin, toggleArchive]);

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: Announcement) => item.id, []);

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
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl refreshing={isRefetchingAnnouncements} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={renderAnnouncementItem}
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
    marginBottom: SPACING.xxl, // 24px gap before Novedades section
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
    width: 140, // Narrower for 2.5 peek-a-boo effect
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'flex-start', // Left align content
  },
  eventDateBlock: {
    width: SIZES.avatarXl,
    height: SIZES.avatarXl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  eventDateMonth: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: -SPACING.xxs,
  },
  eventDateDay: {
    fontSize: FONT_SIZES['7xl'] - SPACING.xxs,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  eventContent: {
    alignItems: 'flex-start',
    width: '100%',
  },
  eventTitle: {
    ...TYPOGRAPHY.listItemTitle,
    fontSize: FONT_SIZES.base,
    textAlign: 'left',
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
    paddingVertical: SPACING.xxxl + SPACING.xxl,
    gap: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
