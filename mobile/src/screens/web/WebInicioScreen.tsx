/**
 * WebInicioScreen - Web-optimized Home screen
 *
 * Features:
 * - WebLayout with sidebar navigation
 * - CSS Grid for announcements (ResponsiveCardGrid)
 * - WebAnnouncementCard with hover actions
 * - Grid layout for upcoming events
 * - SegmentedControl for filtering
 */
import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ScreenHeader';
import QuickAccess from '../../components/QuickAccess';
import SegmentedControl from '../../components/SegmentedControl';
import ChildSelector from '../../components/ChildSelector';
import { WebLayout, WebAnnouncementCard, ResponsiveCardGrid, WebEventCard, EventStatus } from '../../components/web';
import { useFilters, useUnreadCounts } from '../../context/AppContext';
import {
  useAnnouncements,
  useContentReadStatus,
  useAnnouncementStates,
  useAnnouncementPin,
  useAnnouncementArchive,
  useEvents
} from '../../api/hooks';
import { useSession } from '../../hooks';
import { Announcement, Event } from '../../api/directus';
import { COLORS, CHILD_COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';
import { logger } from '../../utils';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export default function WebInicioScreen() {
  const router = useRouter();
  const { user, children, selectedChildId, getChildById } = useSession();
  const { filterMode, setFilterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useContentReadStatus('announcements');

  // Fetch data
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useAnnouncements();
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { data: announcementStates, isLoading: statesLoading } = useAnnouncementStates();

  // Process states
  const { pinnedIds, archivedIds, acknowledgedIds } = useMemo(() => ({
    pinnedIds: announcementStates?.pinnedIds instanceof Set ? announcementStates.pinnedIds : new Set<string>(),
    archivedIds: announcementStates?.archivedIds instanceof Set ? announcementStates.archivedIds : new Set<string>(),
    acknowledgedIds: announcementStates?.acknowledgedIds instanceof Set ? announcementStates.acknowledgedIds : new Set<string>(),
  }), [announcementStates]);

  const { togglePin } = useAnnouncementPin();
  const { toggleArchive } = useAnnouncementArchive();

  const selectedChild = selectedChildId ? getChildById(selectedChildId) || null : null;

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
      .slice(0, 6); // Show more events on web
  }, [events]);

  // Get child info for announcement
  const getChildInfo = (announcement: Announcement): { name?: string; color?: string } => {
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
      return {};
    }
    return {};
  };

  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    let result = announcements;

    // Filter by selected child
    if (selectedChild) {
      result = result.filter(announcement => {
        if (announcement.target_type === 'all') return true;
        if (announcement.target_type === 'section') {
          return announcement.target_id === selectedChild.section_id;
        }
        if (announcement.target_type === 'grade') {
          return true;
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

    // Sort: pinned first
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

  // Navigation handlers
  const handleReportAbsence = useCallback(() => {
    logger.debug('Report absence');
  }, []);

  const handlePickupChange = useCallback(() => {
    router.push('/mishijos');
  }, [router]);

  const handleContactSchool = useCallback(() => {
    router.push('/mensajes');
  }, [router]);

  const handleEventPress = useCallback((eventId: string) => {
    router.push({ pathname: '/agenda/[id]', params: { id: eventId } });
  }, [router]);

  const handleSeeAllEvents = useCallback(() => {
    router.push('/agenda');
  }, [router]);

  const handleAnnouncementPress = useCallback((id: string) => {
    router.push({ pathname: '/inicio/[id]', params: { id } });
  }, [router]);

  // Get event status for WebEventCard
  // Maps our date logic to WebEventCard's EventStatus type
  const getEventStatus = (event: Event): EventStatus => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : startDate;

    if (now > endDate) return 'past';
    // For events happening today or ongoing, show as 'info' (neutral state)
    // WebEventCard uses 'pending'/'confirmed'/'declined' for RSVP states
    return 'info';
  };

  return (
    <WebLayout title="Inicio" breadcrumbs={[{ label: 'Inicio', href: '/' }]}>
      <View className="flex-1 w-full max-w-[1600px] mx-auto">
        {/* Dashboard Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-1">
            Hola, {user?.first_name || 'Usuario'} 👋
          </Text>
          <Text className="text-base text-gray-500">
            Aquí tienes un resumen de la actividad escolar reciente.
          </Text>
        </View>

        {/* Quick Access - Horizontal Grid */}
        <View className="mb-8">
           <QuickAccess
             onReportAbsence={handleReportAbsence}
             onPickupChange={handlePickupChange}
             onContactSchool={handleContactSchool}
           />
        </View>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Próximos Eventos
              </Text>
              <Pressable
                onPress={handleSeeAllEvents}
                className="opacity-100 hover:opacity-70 transition-opacity"
              >
                <Text className="text-sm font-semibold text-primary">
                  Ver agenda completa →
                </Text>
              </Pressable>
            </View>

            {/* Events Grid - 3 columns on web */}
            <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <View key={event.id} className="w-full">
                  <WebEventCard
                    event={event}
                    status={getEventStatus(event)}
                    onPress={() => handleEventPress(event.id)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Announcements Section */}
        <View>
          {/* Header with filter */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center gap-4">
              <Text className="text-xl font-bold text-gray-800">
                Novedades
              </Text>
              <ChildSelector compact />
            </View>

            {/* Filter tabs - moved to right */}
            <View className="w-64">
              <SegmentedControl
                segments={[
                  { key: 'unread', label: 'No leídas', count: unreadCounts.inicio },
                  { key: 'all', label: 'Todas' },
                ]}
                selectedKey={filterMode === 'unread' ? 'unread' : 'all'}
                onSelect={(key) => setFilterMode(key as 'unread' | 'all')}
              />
            </View>
          </View>

          {/* Announcements Grid */}
          {isLoading ? (
            <View className="p-12 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredAnnouncements.length === 0 ? (
            <View className="p-16 items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Ionicons name="newspaper-outline" size={48} color={COLORS.gray300} />
              <Text className="mt-4 text-gray-500 text-center font-medium">
                {filterMode === 'unread'
                  ? '¡Estás al día! No hay novedades sin leer.'
                  : 'No hay novedades para mostrar.'}
              </Text>
            </View>
          ) : (
            <ResponsiveCardGrid minColumnWidth={320} gap={24}>
              {filteredAnnouncements.map((announcement) => {
                const itemIsUnread = !isRead(announcement.id);
                const itemIsPinned = pinnedIds.has(announcement.id) || Boolean(announcement.is_pinned);
                const itemIsArchived = archivedIds.has(announcement.id);
                const childInfo = getChildInfo(announcement);

                return (
                  <WebAnnouncementCard
                    key={announcement.id}
                    item={announcement}
                    isUnread={itemIsUnread}
                    isPinned={itemIsPinned}
                    isArchived={itemIsArchived}
                    childName={childInfo.name}
                    childColor={childInfo.color}
                    onMarkAsRead={() => markAsRead(announcement.id)}
                    onTogglePin={() => togglePin(announcement.id, itemIsPinned)}
                    onArchive={() => toggleArchive(announcement.id, false)}
                    onUnarchive={() => toggleArchive(announcement.id, true)}
                  />
                );
              })}
            </ResponsiveCardGrid>
          )}
        </View>
      </View>
    </WebLayout>
  );
}
