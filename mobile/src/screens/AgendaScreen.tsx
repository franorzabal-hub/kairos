import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import DirectusImage from '../components/DirectusImage';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useEvents } from '../api/hooks';
import { useReadStatus } from '../hooks';
import { Event } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS, BADGE_STYLES } from '../theme';
import { stripHtml } from '../utils';

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => {
  return new Date(`${dateKey}T00:00:00`);
};

const isEventOnDate = (event: Event, dateKey: string) => {
  const targetDate = parseDateKey(dateKey);
  const start = new Date(event.start_date);
  const end = event.end_date ? new Date(event.end_date) : start;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return targetDate >= startDate && targetDate <= endDate;
};

const getMarkedDates = (events: Event[], selectedDate: string) => {
  const marked: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};

  events.forEach((event) => {
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : start;
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const finalDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= finalDate) {
      const key = formatDateKey(cursor);
      marked[key] = {
        ...marked[key],
        marked: true,
        dotColor: COLORS.primary,
      };
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  if (selectedDate) {
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: COLORS.primary,
    };
  }

  return marked;
};

export default function AgendaScreen() {
  const router = useRouter();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const { data: events = [], isLoading, refetch, isRefetching } = useEvents();
  const { isRead, filterUnread, markAsRead } = useReadStatus('events');

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by read status
    if (filterMode === 'unread') {
      result = filterUnread(result);
    }

    return result;
  }, [events, filterMode, filterUnread]);

  const markedDates = useMemo(() => getMarkedDates(filteredEvents, selectedDate), [filteredEvents, selectedDate]);

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((event) => isEventOnDate(event, selectedDate));
  }, [filteredEvents, selectedDate]);

  const onRefresh = async () => {
    await refetch();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const itemIsUnread = !isRead(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, itemIsUnread && styles.cardUnread]}
        onPress={() => {
          if (itemIsUnread) {
            markAsRead(item.id);
          }
          // Navigate to agenda detail (uses eventos detail screen internally)
          router.push({ pathname: '/agenda/[id]', params: { id: item.id } });
        }}
      >
        {item.requires_confirmation ? (
          <View style={styles.confirmBadge}>
            <Text style={styles.confirmBadgeText}>CONFIRMAR</Text>
          </View>
        ) : null}

        {itemIsUnread && <View style={styles.unreadDot} />}

        <DirectusImage
          fileId={item.image}
          style={styles.cardImage}
          resizeMode="cover"
          fallback={
            <View style={styles.cardImagePlaceholder}>
              <MaterialCommunityIcons name="school-outline" size={48} color={COLORS.primary} />
              <Text style={styles.schoolName}>Colegio</Text>
            </View>
          }
        />

        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.white} style={styles.dateIcon} />
          <Text style={styles.dateText}>{formatDate(item.start_date)}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {stripHtml(item.description)}
            </Text>
          ) : null}
          <Text style={styles.cardCta}>Ver Evento</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Agenda" />
      <FilterBar unreadCount={unreadCounts.agenda} />

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={viewMode === 'list' ? [styles.toggleButton, styles.toggleActive] : styles.toggleButton}
          onPress={() => setViewMode('list')}
        >
          <Text style={viewMode === 'list' ? [styles.toggleText, styles.toggleTextActive] : styles.toggleText}>
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={viewMode === 'calendar' ? [styles.toggleButton, styles.toggleActive] : styles.toggleButton}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={viewMode === 'calendar' ? [styles.toggleText, styles.toggleTextActive] : styles.toggleText}>
            Calendario
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {viewMode === 'calendar' ? (
        <View style={styles.calendarWrapper}>
          <ListHeader />
          <CalendarProvider
            date={selectedDate || todayKey}
            onDateChanged={(date) => setSelectedDate(date)}
            showTodayButton
          >
            <ExpandableCalendar
              firstDay={1}
              markedDates={markedDates}
              initialPosition={ExpandableCalendar.positions.CLOSED}
              theme={{
                calendarBackground: COLORS.white,
                todayTextColor: COLORS.primary,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                dotColor: COLORS.primary,
                dayTextColor: COLORS.darkGray,
                monthTextColor: COLORS.darkGray,
                arrowColor: COLORS.primary,
              }}
            />
            <FlashList
              data={eventsForSelectedDate}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
              contentContainerStyle={styles.calendarListContent}
              renderItem={renderEventCard}
              ListEmptyComponent={
                isLoading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No hay eventos para esta fecha</Text>
                  </View>
                )
              }
            />
          </CalendarProvider>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={renderEventCard}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay eventos</Text>
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
  viewToggle: {
    flexDirection: 'row',
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDERS.radius.md,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.gray,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  calendarWrapper: {
    flex: 1,
  },
  calendarListContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.screenPadding,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardUnread: {
    ...UNREAD_STYLES.borderLeft,
  },
  unreadDot: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    ...UNREAD_STYLES.dot,
    zIndex: 2,
  },
  confirmBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    ...BADGE_STYLES.new,
    zIndex: 1,
  },
  confirmBadgeText: {
    color: COLORS.white,
    ...TYPOGRAPHY.badge,
  },
  cardImage: {
    height: 160,
    width: '100%',
  },
  cardImagePlaceholder: {
    height: 160,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 24,
    color: COLORS.primary,
  },
  dateBadge: {
    position: 'absolute',
    top: 130,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: SPACING.xs,
  },
  dateText: {
    color: COLORS.white,
    ...TYPOGRAPHY.caption,
  },
  cardContent: {
    padding: SPACING.cardPadding,
  },
  cardTitle: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  cardCta: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
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
