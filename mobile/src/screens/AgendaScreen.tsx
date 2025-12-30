import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import ChildSelector from '../components/ChildSelector';
import SegmentedControl from '../components/SegmentedControl';
import EventCard, { EventStatus } from '../components/EventCard';
import { useEvents } from '../api/hooks';
import { useSession, useReadStatus } from '../hooks';
import { Event } from '../api/directus';
import { COLORS, CHILD_COLORS, SPACING, TYPOGRAPHY, BORDERS } from '../theme';

type TimeFilter = 'upcoming' | 'past';

// Section types for grouping events
type SectionKey = 'today' | 'tomorrow' | 'thisWeek' | 'upcoming' | 'past';

interface EventSection {
  key: SectionKey;
  title: string;
  data: Event[];
}

export default function AgendaScreen() {
  // Centralized session state - user, children, permissions
  const { children, selectedChildId, setSelectedChildId, getChildById } = useSession();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');

  const { data: events = [], isLoading, refetch, isRefetching } = useEvents();
  const { isRead, markAsRead } = useReadStatus('events');

  // Get selected child for filtering
  const selectedChild = selectedChildId ? getChildById(selectedChildId) : null;

  // Filter events by child
  const childFilteredEvents = useMemo(() => {
    if (!selectedChild) return events;
    return events.filter(event => {
      if (event.target_type === 'all') return true;
      if (event.target_type === 'section') {
        return event.target_id === selectedChild.section_id;
      }
      return true;
    });
  }, [events, selectedChild]);

  // Date helpers
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);
  const endOfWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + (7 - d.getDay())); // Next Sunday
    return d;
  }, [today]);

  // Group events into sections
  const { upcomingSections, pastSection } = useMemo(() => {
    const todayEvents: Event[] = [];
    const tomorrowEvents: Event[] = [];
    const thisWeekEvents: Event[] = [];
    const laterEvents: Event[] = [];
    const pastEvents: Event[] = [];

    childFilteredEvents.forEach(event => {
      const eventDate = new Date(event.start_date);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

      if (eventDay < today) {
        pastEvents.push(event);
      } else if (eventDay.getTime() === today.getTime()) {
        todayEvents.push(event);
      } else if (eventDay.getTime() === tomorrow.getTime()) {
        tomorrowEvents.push(event);
      } else if (eventDay <= endOfWeek) {
        thisWeekEvents.push(event);
      } else {
        laterEvents.push(event);
      }
    });

    // Sort upcoming by date ascending
    const sortAsc = (a: Event, b: Event) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime();

    todayEvents.sort(sortAsc);
    tomorrowEvents.sort(sortAsc);
    thisWeekEvents.sort(sortAsc);
    laterEvents.sort(sortAsc);

    // Sort past by date descending (most recent first)
    pastEvents.sort((a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    const upcoming: EventSection[] = [];
    if (todayEvents.length > 0) {
      upcoming.push({ key: 'today', title: 'HOY', data: todayEvents });
    }
    if (tomorrowEvents.length > 0) {
      upcoming.push({ key: 'tomorrow', title: 'MAÑANA', data: tomorrowEvents });
    }
    if (thisWeekEvents.length > 0) {
      upcoming.push({ key: 'thisWeek', title: 'ESTA SEMANA', data: thisWeekEvents });
    }
    if (laterEvents.length > 0) {
      upcoming.push({ key: 'upcoming', title: 'PRÓXIMAMENTE', data: laterEvents });
    }

    const past: EventSection | null = pastEvents.length > 0
      ? { key: 'past', title: 'HISTORIAL', data: pastEvents }
      : null;

    return { upcomingSections: upcoming, pastSection: past };
  }, [childFilteredEvents, today, tomorrow, endOfWeek]);

  // Get sections based on time filter
  const sections = useMemo(() => {
    if (timeFilter === 'upcoming') {
      return upcomingSections;
    } else {
      return pastSection ? [pastSection] : [];
    }
  }, [timeFilter, upcomingSections, pastSection]);

  // Count for tabs
  const upcomingCount = useMemo(() =>
    upcomingSections.reduce((sum, section) => sum + section.data.length, 0),
    [upcomingSections]
  );
  const pastCount = pastSection?.data.length || 0;

  // Get child info helper for EventCard - returns name and color
  const getChildInfo = (event: Event): { name?: string; color?: string } => {
    // If viewing all children, find which child the event targets
    if (!selectedChildId && children.length > 1) {
      if (event.target_type === 'section') {
        const childIndex = children.findIndex(c => c.section_id === event.target_id);
        if (childIndex >= 0) {
          return {
            name: children[childIndex].first_name,
            color: CHILD_COLORS[childIndex % CHILD_COLORS.length],
          };
        }
      }
      // Events for all children don't get a specific color
      return {};
    }

    // If a specific child is selected, show their color on section-targeted events
    if (selectedChild && event.target_type === 'section') {
      const childIndex = children.findIndex(c => c.id === selectedChildId);
      return {
        color: CHILD_COLORS[childIndex % CHILD_COLORS.length],
      };
    }

    return {};
  };

  // Determine the status for an event
  const getEventStatus = (event: Event): EventStatus => {
    const eventDate = new Date(event.start_date);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    // Past events
    if (eventDay < today) {
      return 'past';
    }

    // Events that require confirmation
    if (event.requires_confirmation) {
      // TODO: Check actual confirmation status from event_confirmations when implemented
      return 'pending';
    }

    // Future events without confirmation requirement
    return 'info';
  };

  const onRefresh = async () => {
    await refetch();
  };

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleSelectAll = () => {
    setSelectedChildId(null);
  };

  // Render event card
  const renderItem = ({ item }: { item: Event }) => {
    const itemIsUnread = !isRead(item.id);
    const status = getEventStatus(item);
    const childInfo = getChildInfo(item);

    return (
      <EventCard
        event={item}
        isUnread={itemIsUnread}
        status={status}
        childName={childInfo.name}
        childColor={childInfo.color}
        onPress={() => {
          if (itemIsUnread) {
            markAsRead(item.id);
          }
        }}
      />
    );
  };

  // Render section header (sticky)
  const renderSectionHeader = ({ section }: { section: EventSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
      </View>
    </View>
  );

  // Header with child selector and filter
  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Screen Header */}
      <ScreenHeader title="Agenda" />

      {/* Child Selector - always show if there are children */}
      {children.length > 0 && (
        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onSelectChild={handleSelectChild}
          showAllOption={children.length > 1}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Compact time filter */}
      <View style={styles.filterContainer}>
        <SegmentedControl
          segments={[
            { key: 'upcoming', label: 'Agenda', count: upcomingCount },
            { key: 'past', label: 'Historial', count: pastCount },
          ]}
          selectedKey={timeFilter}
          onSelect={(key) => setTimeFilter(key as TimeFilter)}
        />
      </View>
    </View>
  );

  // Empty state
  const EmptyComponent = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={timeFilter === 'upcoming' ? 'calendar-outline' : 'time-outline'}
        size={48}
        color={COLORS.gray}
      />
      <Text style={styles.emptyText}>
        {timeFilter === 'upcoming'
          ? 'No hay eventos próximos'
          : 'No hay eventos en el historial'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={true}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
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
  },
  filterContainer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  // Section headers (sticky)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  sectionBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDERS.radius.full,
  },
  sectionBadgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.gray,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: SPACING.md,
    marginHorizontal: SPACING.screenPadding,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
