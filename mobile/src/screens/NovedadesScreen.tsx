import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import DirectusImage from '../components/DirectusImage';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useAnnouncements, useChildren, useContentReadStatus } from '../api/hooks';
import { Announcement } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS, BADGE_STYLES } from '../theme';
import { stripHtml } from '../utils';

export default function NovedadesScreen() {
  const router = useRouter();
  const { filterMode, selectedChildId, children } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useContentReadStatus('announcements');

  // Fetch children on mount
  useChildren();

  // Fetch announcements
  const { data: announcements = [], isLoading, refetch, isRefetching } = useAnnouncements();

  // Get selected child's section for filtering
  const selectedChild = selectedChildId
    ? children.find(c => c.id === selectedChildId)
    : null;

  // Apply filters
  const filteredAnnouncements = useMemo(() => {
    let result = announcements;

    // Filter by read status
    if (filterMode === 'unread') {
      result = filterUnread(result);
    }

    // Filter by selected child (if one is selected)
    if (selectedChild) {
      result = result.filter(announcement => {
        // Show announcements for all
        if (announcement.target_type === 'all') return true;

        // Show section-specific announcements that match child's section
        if (announcement.target_type === 'section') {
          return announcement.target_id === selectedChild.section_id;
        }

        // Grade-specific announcements: show all for now
        // TODO: Need to fetch grade_id from section to filter properly
        if (announcement.target_type === 'grade') {
          return true;
        }

        return true;
      });
    }

    return result;
  }, [announcements, filterMode, filterUnread, selectedChild]);

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
            return (
            <TouchableOpacity
              style={[styles.card, itemIsUnread && styles.cardUnread]}
              onPress={() => {
                if (itemIsUnread) {
                  markAsRead(item.id);
                }
                router.push({ pathname: '/novedades/[id]', params: { id: item.id } });
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
