import React, { useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import SwipeableAnnouncementCard from '../components/SwipeableAnnouncementCard';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useAnnouncements, useChildren, useContentReadStatus, useAnnouncementStates, useAnnouncementPin, useAnnouncementArchive } from '../api/hooks';
import { Announcement } from '../api/directus';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

export default function NovedadesScreen() {
  const { filterMode, selectedChildId, children } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useContentReadStatus('announcements');

  // Fetch children on mount
  useChildren();

  // Fetch announcements
  const { data: announcements = [], isLoading, refetch, isRefetching } = useAnnouncements();

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

  // Apply filters and sorting
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
        // Show only unread, exclude archived
        result = filterUnread(result).filter(a => !archivedIds.has(a.id));
        break;
      case 'all':
        // Show all except archived
        result = result.filter(a => !archivedIds.has(a.id));
        break;
      case 'pinned':
        // Show only user-pinned items (including archived if pinned)
        result = result.filter(a => pinnedIds.has(a.id));
        break;
      case 'archived':
        // Show only archived items
        result = result.filter(a => archivedIds.has(a.id));
        break;
    }

    // Sort: pinned items first (except when viewing pinned or archived filter)
    if (filterMode !== 'pinned' && filterMode !== 'archived') {
      result = [...result].sort((a, b) => {
        const aPinned = pinnedIds.has(a.id) || a.is_pinned;
        const bPinned = pinnedIds.has(b.id) || b.is_pinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        // Then by date (newest first)
        return new Date(b.published_at || b.created_at).getTime() -
               new Date(a.published_at || a.created_at).getTime();
      });
    }

    return result;
  }, [announcements, filterMode, filterUnread, selectedChild, pinnedIds, archivedIds]);

  const onRefresh = async () => {
    await refetch();
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Novedades" />
      <FilterBar
        unreadCount={unreadCounts.novedades}
        pinnedCount={pinnedCount}
        archivedCount={archivedCount}
        showPinnedFilter={true}
        showArchivedFilter={true}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading || statesLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredAnnouncements}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
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
              <Text style={styles.emptyText}>No hay novedades</Text>
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginHorizontal: SPACING.screenPadding,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
});
