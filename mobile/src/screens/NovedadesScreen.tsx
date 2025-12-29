import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts } from '../context/AppContext';

// Mock data - will be replaced with API calls
const mockAnnouncements = [
  {
    id: '1',
    title: 'Ciclo Lectivo 2026',
    subtitle: 'Comienzo de clases',
    priority: 'important',
    isRead: false,
    createdAt: '2025-12-22',
    category: 'Novedades',
  },
  {
    id: '2',
    title: 'Lista de materiales 1er Grado',
    subtitle: 'Materiales necesarios para el año',
    priority: 'normal',
    isRead: true,
    createdAt: '2025-12-20',
    category: 'Novedades',
  },
];

const COLORS = {
  primary: '#8B1538',
  primaryLight: '#F5E6EA',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  red: '#E53935',
};

export default function NovedadesScreen() {
  const { filterMode, selectedChildId } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const [refreshing, setRefreshing] = React.useState(false);

  // Filter announcements based on current filters
  const filteredAnnouncements = mockAnnouncements.filter(a => {
    if (filterMode === 'unread' && a.isRead) return false;
    // Child filter would be applied here with real data
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FilterBar unreadCount={unreadCounts.novedades} />

      <FlatList
        data={filteredAnnouncements}
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

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>📢 {item.category}</Text>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              <Text style={styles.cardCta}>Ver Novedad</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay novedades</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
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
  categoryBadge: {
    position: 'absolute',
    top: 130,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
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
