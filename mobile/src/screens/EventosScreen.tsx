import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts } from '../context/AppContext';

const COLORS = {
  primary: '#8B1538',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  lightBlue: '#E3F2FD',
};

// Mock data
const mockEvents = [
  {
    id: '1',
    title: 'Acto de inicio de clases',
    date: '2025-03-03',
    time: '09:00',
    isRead: false,
    requiresConfirmation: true,
  },
  {
    id: '2',
    title: 'Reunión de padres 1er Grado A',
    date: '2025-03-10',
    time: '18:00',
    isRead: true,
    requiresConfirmation: true,
  },
];

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EventosScreen() {
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const filteredEvents = mockEvents.filter(e => {
    if (filterMode === 'unread' && e.isRead) return false;
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FilterBar unreadCount={unreadCounts.eventos} />

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>
            Calendario
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? (
        <View style={styles.calendarContainer}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <Text style={styles.monthNavArrow}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <Text style={styles.monthNavArrow}>▶</Text>
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

          {filteredEvents.length === 0 && (
            <View style={styles.noEventsBox}>
              <Text style={styles.noEventsText}>
                ℹ️ Aún no contamos con eventos agendados para este mes
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              {!item.isRead && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>SIN LEER</Text>
                </View>
              )}

              <View style={styles.cardImagePlaceholder}>
                <Text style={styles.schoolName}>🏫 Colegio</Text>
              </View>

              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>📅 {formatDate(item.date)}</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardCta}>Ver Evento</Text>
              </View>
            </TouchableOpacity>
          )}
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
  viewToggle: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: COLORS.white,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
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
    padding: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  monthNavArrow: {
    color: COLORS.white,
    fontSize: 16,
    paddingHorizontal: 8,
  },
  monthTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
    fontSize: 16,
  },
  noEventsBox: {
    backgroundColor: COLORS.lightBlue,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  noEventsText: {
    color: '#1976D2',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardImagePlaceholder: {
    height: 160,
    backgroundColor: '#E8D5D9',
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
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dateText: {
    color: COLORS.white,
    fontSize: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardCta: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
});
