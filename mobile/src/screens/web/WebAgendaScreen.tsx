/**
 * WebAgendaScreen - Web-optimized Calendar/Events screen
 *
 * Features:
 * - WebLayout with sidebar navigation
 * - Collapsible section headers (HOY, MAÑANA, etc.)
 * - CSS Grid layout for events
 * - WebEventCard with hover actions
 * - SegmentedControl for Agenda/Historial filter
 */
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import ChildSelector from '../../components/ChildSelector';
import SegmentedControl from '../../components/SegmentedControl';
import { WebLayout, WebEventCard, ResponsiveCardGrid } from '../../components/web';
import type { EventStatus } from '../../components/web';
import { useEvents, useContentReadStatus } from '../../api/hooks';
import { useSession } from '../../hooks';
import { Event } from '../../api/directus';
import { COLORS, CHILD_COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

type TimeFilter = 'upcoming' | 'past';
type SectionKey = 'today' | 'tomorrow' | 'thisWeek' | 'upcoming' | 'past';

interface EventSection {
  key: SectionKey;
  title: string;
  data: Event[];
}

// Section labels in Spanish
const SECTION_LABELS: Record<SectionKey, string> = {
  today: 'HOY',
  tomorrow: 'MAÑANA',
  thisWeek: 'ESTA SEMANA',
  upcoming: 'PRÓXIMAMENTE',
  past: 'HISTORIAL',
};

export default function WebAgendaScreen() {
  const { children, selectedChildId, setSelectedChildId, getChildById } = useSession();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionKey>>(new Set());

  const { data: events = [], isLoading, refetch, isRefetching } = useEvents();
  const { isRead, markAsRead } = useContentReadStatus('events');

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
    d.setDate(d.getDate() + (7 - d.getDay()));
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

    // Sort past by date descending
    pastEvents.sort((a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    const upcoming: EventSection[] = [];
    if (todayEvents.length > 0) {
      upcoming.push({ key: 'today', title: SECTION_LABELS.today, data: todayEvents });
    }
    if (tomorrowEvents.length > 0) {
      upcoming.push({ key: 'tomorrow', title: SECTION_LABELS.tomorrow, data: tomorrowEvents });
    }
    if (thisWeekEvents.length > 0) {
      upcoming.push({ key: 'thisWeek', title: SECTION_LABELS.thisWeek, data: thisWeekEvents });
    }
    if (laterEvents.length > 0) {
      upcoming.push({ key: 'upcoming', title: SECTION_LABELS.upcoming, data: laterEvents });
    }

    const past: EventSection | null = pastEvents.length > 0
      ? { key: 'past', title: SECTION_LABELS.past, data: pastEvents }
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

  // Counts for tabs
  const upcomingCount = useMemo(() =>
    upcomingSections.reduce((sum, section) => sum + section.data.length, 0),
    [upcomingSections]
  );
  const pastCount = pastSection?.data.length || 0;

  // Get child info for event
  const getChildInfo = useCallback((event: Event): { name?: string; color?: string } => {
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
      return {};
    }

    if (selectedChild && event.target_type === 'section') {
      const childIndex = children.findIndex(c => c.id === selectedChildId);
      return {
        color: CHILD_COLORS[childIndex % CHILD_COLORS.length],
      };
    }

    return {};
  }, [children, selectedChild, selectedChildId]);

  // Determine event status
  const getEventStatus = useCallback((event: Event): EventStatus => {
    const eventDate = new Date(event.start_date);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    if (eventDay < today) {
      return 'past';
    }

    if (event.requires_confirmation) {
      return 'pending';
    }

    return 'info';
  }, [today]);

  // Toggle section collapse
  const toggleSection = useCallback((sectionKey: SectionKey) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  }, []);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleSelectAll = () => {
    setSelectedChildId(null);
  };

  // Render a single section with header and grid
  const renderSection = (section: EventSection) => {
    const isCollapsed = collapsedSections.has(section.key);

    return (
      <View key={section.key} style={{ marginBottom: SPACING.lg }}>
        {/* Section Header - Clickable to collapse */}
        <Pressable
          onPress={() => toggleSection(section.key)}
          style={(state) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.xs,
            marginBottom: isCollapsed ? 0 : SPACING.md,
            gap: SPACING.sm,
            borderRadius: BORDERS.radius.md,
            ...(Platform.OS === 'web' && {
              cursor: 'pointer',
              backgroundColor: (state as WebPressableState).hovered ? COLORS.border + '30' : 'transparent',
              transition: 'background-color 0.2s',
            } as any),
          })}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
            size={16}
            color={COLORS.gray}
          />
          <Text style={{
            ...TYPOGRAPHY.caption,
            fontWeight: '700',
            color: COLORS.gray,
            letterSpacing: 0.5,
          }}>
            {section.title}
          </Text>
          <View style={{
            backgroundColor: COLORS.border,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: BORDERS.radius.full,
          }}>
            <Text style={{
              ...TYPOGRAPHY.badge,
              color: COLORS.gray,
            }}>
              {section.data.length}
            </Text>
          </View>
        </Pressable>

        {/* Events Grid - Hidden when collapsed */}
        {!isCollapsed && (
          <ResponsiveCardGrid minColumnWidth={340} gap={SPACING.md}>
            {section.data.map((event) => {
              const itemIsUnread = !isRead(event.id);
              const status = getEventStatus(event);
              const childInfo = getChildInfo(event);

              return (
                <WebEventCard
                  key={event.id}
                  event={event}
                  isUnread={itemIsUnread}
                  status={status}
                  childName={childInfo.name}
                  childColor={childInfo.color}
                  onPress={() => {
                    if (itemIsUnread) {
                      markAsRead(event.id);
                    }
                  }}
                />
              );
            })}
          </ResponsiveCardGrid>
        )}
      </View>
    );
  };

  return (
    <WebLayout>
      <View style={{
        flex: 1,
        padding: SPACING.lg,
        maxWidth: 1200,
        marginHorizontal: 'auto',
        width: '100%',
      }}>
        {/* Page Header */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={{
            ...TYPOGRAPHY.sectionTitle,
            fontSize: 28,
            color: COLORS.darkGray,
            marginBottom: SPACING.xs,
          }}>
            Agenda
          </Text>
          <Text style={{
            ...TYPOGRAPHY.body,
            color: COLORS.gray,
          }}>
            Eventos y actividades del colegio
          </Text>
        </View>

        {/* Filters Row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.lg,
          flexWrap: 'wrap',
          gap: SPACING.md,
        }}>
          {/* Child Selector */}
          {children.length > 0 && (
            <ChildSelector
              children={children}
              selectedChildId={selectedChildId}
              onSelectChild={handleSelectChild}
              showAllOption={children.length > 1}
              onSelectAll={handleSelectAll}
              compact
            />
          )}

          {/* Time Filter */}
          <SegmentedControl
            segments={[
              { key: 'upcoming', label: 'Agenda', count: upcomingCount },
              { key: 'past', label: 'Historial', count: pastCount },
            ]}
            selectedKey={timeFilter}
            onSelect={(key) => setTimeFilter(key as TimeFilter)}
            accentColor={selectedChildId
              ? CHILD_COLORS[children.findIndex(c => c.id === selectedChildId) % CHILD_COLORS.length]
              : undefined
            }
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={{
            padding: SPACING.xl,
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : sections.length === 0 ? (
          <View style={{
            padding: SPACING.xl,
            alignItems: 'center',
            gap: SPACING.md,
          }}>
            <Ionicons
              name={timeFilter === 'upcoming' ? 'calendar-outline' : 'time-outline'}
              size={48}
              color={COLORS.gray}
            />
            <Text style={{
              ...TYPOGRAPHY.body,
              color: COLORS.gray,
              textAlign: 'center',
            }}>
              {timeFilter === 'upcoming'
                ? 'No hay eventos próximos'
                : 'No hay eventos en el historial'}
            </Text>
          </View>
        ) : (
          <View>
            {sections.map(renderSection)}
          </View>
        )}
      </View>
    </WebLayout>
  );
}
