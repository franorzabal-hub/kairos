import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import DirectusImage from '../components/DirectusImage';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useAnnouncements, useChildren } from '../api/hooks';
import { useReadStatus } from '../hooks';
import { Announcement } from '../api/directus';
import { NovedadesStackParamList } from '../navigation/NovedadesStack';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS, BADGE_STYLES } from '../theme';

// Strip HTML tags and decode entities for preview text
const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    // Decode HTML entities first
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Then strip HTML tags
    .replace(/<[^>]*>/g, '')
    .trim();
};

type NovedadesNavigationProp = NativeStackNavigationProp<NovedadesStackParamList, 'NovedadesList'>;

export default function NovedadesScreen() {
  const navigation = useNavigation<NovedadesNavigationProp>();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useReadStatus('announcements');

  // Fetch children on mount
  useChildren();

  // Fetch announcements
  const { data: announcements = [], isLoading, refetch, isRefetching } = useAnnouncements();

  // Apply filters
  const filteredAnnouncements = useMemo(() => {
    let result = announcements;

    // Filter by read status
    if (filterMode === 'unread') {
      result = filterUnread(result);
    }

    // TODO: Filter by selectedChildId when announcements have student/grade relations

    return result;
  }, [announcements, filterMode, filterUnread]);

  const onRefresh = async () => {
    await refetch();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Novedades" />
      <FilterBar unreadCount={unreadCounts.novedades} />
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
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: Announcement }) => {
            const itemIsUnread = !isRead(item.id);
            return (
            <TouchableOpacity
              style={[styles.card, itemIsUnread && styles.cardUnread]}
              onPress={() => {
                if (itemIsUnread) {
                  markAsRead(item.id);
                }
                navigation.navigate('NovedadDetail', { announcement: item });
              }}
            >
              {item.priority === 'urgent' ? (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>URGENTE</Text>
                </View>
              ) : item.priority === 'important' ? (
                <View style={[styles.priorityBadge, styles.importantBadge]}>
                  <Text style={styles.priorityBadgeText}>IMPORTANTE</Text>
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

              <View style={styles.categoryBadge}>
                <Ionicons name="megaphone-outline" size={12} color={COLORS.white} style={styles.categoryIcon} />
                <Text style={styles.categoryText}>{formatDate(item.published_at || item.created_at)}</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>{stripHtml(item.content)}</Text>
                <Text style={styles.cardCta}>Ver Novedad</Text>
              </View>
            </TouchableOpacity>
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
  priorityBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    ...BADGE_STYLES.new,
    zIndex: 1,
  },
  priorityBadgeText: {
    color: COLORS.white,
    ...TYPOGRAPHY.badgeSmall,
  },
  importantBadge: {
    backgroundColor: COLORS.warning,
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
  categoryBadge: {
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
  categoryIcon: {
    marginRight: SPACING.xs,
  },
  categoryText: {
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
  cardSubtitle: {
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
