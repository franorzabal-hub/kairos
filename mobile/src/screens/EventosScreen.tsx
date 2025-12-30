import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import DirectusImage from '../components/DirectusImage';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useEvents } from '../api/hooks';
import { useReadStatus } from '../hooks';
import { Event } from '../api/directus';
import { EventosStackParamList } from '../navigation/EventosStack';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS, BADGE_STYLES } from '../theme';
import { stripHtml } from '../utils';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type EventosNavigationProp = NativeStackNavigationProp<EventosStackParamList, 'EventosList'>;

export default function EventosScreen() {
  const navigation = useNavigation<EventosNavigationProp>();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: events = [], isLoading, refetch, isRefetching } = useEvents();
  const { isRead, filterUnread, markAsRead } = useReadStatus('events');

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by read status
    if (filterMode === 'unread') {
      result = filterUnread(result);
    }

    // TODO: Filter by selectedChildId when events have student/grade relations

    return result;
  }, [events, filterMode, filterUnread]);

  const onRefresh = async () => {
    await refetch();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = MONTHS[date.getMonth()].substring(0, 3);
    return `${day} ${month}`;
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Monday = 0
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <TouchableOpacity key={day} style={styles.calendarDay}>
          <Text style={styles.calendarDayText}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Eventos" />
      <FilterBar unreadCount={unreadCounts.eventos} />

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
        >
          <ListHeader />
          <View style={styles.calendarContainer}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              style={styles.monthNavButton}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              style={styles.monthNavButton}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(day => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

            {events.length === 0 ? (
              <View style={styles.noEventsBox}>
                <Text style={styles.noEventsText}>
                  No hay eventos agendados para este mes
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: Event }) => {
            const itemIsUnread = !isRead(item.id);
            return (
            <TouchableOpacity
              style={[styles.card, itemIsUnread && styles.cardUnread]}
              onPress={() => {
                if (itemIsUnread) {
                  markAsRead(item.id);
                }
                navigation.navigate('EventoDetail', { event: item });
              }}
            >
              {item.requires_confirmation ? (
                <View style={styles.confirmBadge}>
                  <Text style={styles.confirmBadgeText}>CONFIRMAR</Text>
                </View>
              ) : null}

              {itemIsUnread && (
                <View style={styles.unreadDot} />
              )}

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
                  <Text style={styles.cardDescription} numberOfLines={2}>{stripHtml(item.description)}</Text>
                ) : null}
                <Text style={styles.cardCta}>Ver Evento</Text>
              </View>
            </TouchableOpacity>
          );
          }}
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
  scrollContent: {
    paddingBottom: SPACING.tabBarOffset,
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
  calendarContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.screenPadding,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDERS.radius.md,
    marginBottom: SPACING.lg,
  },
  monthNavButton: {
    padding: SPACING.sm,
  },
  monthTitle: {
    color: COLORS.white,
    ...TYPOGRAPHY.cardTitle,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: COLORS.gray,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    ...TYPOGRAPHY.listItemTitle,
  },
  noEventsBox: {
    backgroundColor: COLORS.calendarHighlight,
    padding: SPACING.lg,
    borderRadius: BORDERS.radius.md,
    marginTop: SPACING.lg,
  },
  noEventsText: {
    color: COLORS.info,
    textAlign: 'center',
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
