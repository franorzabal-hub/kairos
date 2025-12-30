import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar, { ReadFilter } from '../components/FilterBar';
import DirectusImage from '../components/DirectusImage';
import SwipeableCard from '../components/SwipeableCard';
import { useAppContext, useUnreadCounts } from '../context/AppContext';
import { useAnnouncements, useChildren, queryKeys } from '../api/hooks';
import { Announcement } from '../api/directus';
import { NovedadesStackParamList } from '../navigation/NovedadesStack';
import {
  toggleArchived,
  togglePinned,
  markAsRead,
  markAsUnread,
} from '../services/contentStatusService';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS, BADGE_STYLES } from '../theme';

// Strip HTML tags and decode entities for preview text
const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
};

type NovedadesNavigationProp = NativeStackNavigationProp<NovedadesStackParamList, 'NovedadesList'>;

export default function NovedadesScreen() {
  const navigation = useNavigation<NovedadesNavigationProp>();
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const { unreadCounts } = useUnreadCounts();

  // Filter state
  const [readFilter, setReadFilter] = useState<ReadFilter>('unread');
  const [showArchived, setShowArchived] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Fetch children on mount
  useChildren();

  // Fetch announcements with filters
  const { data: announcements = [], isLoading, refetch, isRefetching } = useAnnouncements({
    readFilter,
    showArchived,
    showPinnedOnly,
  });

  const onRefresh = async () => {
    await refetch();
  };

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
  }, [queryClient]);

  // Swipe action handlers
  const handleArchive = useCallback(async (item: Announcement) => {
    if (!user?.id || !user?.organization_id) return;
    const isArchived = item.user_status?.is_archived ?? false;
    try {
      await toggleArchived('announcement', item.id, user.id, user.organization_id, !isArchived);
      invalidateQueries();
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  }, [user, invalidateQueries]);

  const handleMarkRead = useCallback(async (item: Announcement) => {
    if (!user?.id || !user?.organization_id) return;
    const isRead = !!item.user_read;
    try {
      if (isRead) {
        await markAsUnread('announcement', item.id, user.id);
      } else {
        await markAsRead('announcement', item.id, user.id, user.organization_id);
      }
      invalidateQueries();
    } catch (error) {
      console.error('Error toggling read:', error);
    }
  }, [user, invalidateQueries]);

  const handlePin = useCallback(async (item: Announcement) => {
    if (!user?.id || !user?.organization_id) return;
    const isPinned = item.user_status?.is_pinned ?? false;
    try {
      await togglePinned('announcement', item.id, user.id, user.organization_id, !isPinned);
      invalidateQueries();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }, [user, invalidateQueries]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Novedades" />
      <FilterBar
        unreadCount={unreadCounts.novedades}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        showPinnedOnly={showPinnedOnly}
        onShowPinnedOnlyChange={setShowPinnedOnly}
      />
    </View>
  );

  const renderItem = ({ item }: { item: Announcement }) => {
    const itemIsUnread = !item.user_read;
    const isArchived = item.user_status?.is_archived ?? false;
    const isUserPinned = item.user_status?.is_pinned ?? false;
    const isGlobalPinned = item.pinned ?? false;

    return (
      <SwipeableCard
        onArchive={() => handleArchive(item)}
        onMarkRead={() => handleMarkRead(item)}
        onPin={() => handlePin(item)}
        isRead={!itemIsUnread}
        isArchived={isArchived}
        isPinned={isUserPinned}
      >
        <TouchableOpacity
          style={[
            styles.card,
            itemIsUnread && styles.cardUnread,
            isArchived && styles.cardArchived,
          ]}
          onPress={async () => {
            if (itemIsUnread && user?.id && user?.organization_id) {
              await markAsRead('announcement', item.id, user.id, user.organization_id);
              invalidateQueries();
            }
            navigation.navigate('NovedadDetail', { announcement: item });
          }}
        >
          {/* Badges */}
          <View style={styles.badgesContainer}>
            {isGlobalPinned && (
              <View style={[styles.badge, styles.pinnedBadge]}>
                <Ionicons name="pin" size={10} color="#FFF" />
                <Text style={styles.badgeText}>FIJADA</Text>
              </View>
            )}
            {isUserPinned && !isGlobalPinned && (
              <View style={[styles.badge, styles.userPinnedBadge]}>
                <Ionicons name="pin" size={12} color={COLORS.primary} />
              </View>
            )}
            {item.priority === 'urgent' && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>URGENTE</Text>
              </View>
            )}
            {item.priority === 'important' && (
              <View style={[styles.priorityBadge, styles.importantBadge]}>
                <Text style={styles.priorityBadgeText}>IMPORTANTE</Text>
              </View>
            )}
          </View>

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

          <View style={styles.categoryBadge}>
            <Ionicons name="megaphone-outline" size={12} color={COLORS.white} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{formatDate(item.published_at || item.created_at)}</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>{stripHtml(item.content)}</Text>

            {/* Footer with indicators */}
            <View style={styles.cardFooter}>
              {item.attachments && item.attachments.length > 0 && (
                <View style={styles.attachmentIndicator}>
                  <Ionicons name="attach" size={14} color={COLORS.gray} />
                  <Text style={styles.attachmentCount}>{item.attachments.length}</Text>
                </View>
              )}
              {item.requires_acknowledgment && (
                <Ionicons
                  name={item.user_read?.acknowledged ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={item.user_read?.acknowledged ? COLORS.success : COLORS.warning}
                  style={styles.ackIcon}
                />
              )}
              <Text style={styles.cardCta}>Ver Novedad</Text>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableCard>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ListHeader />
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
            }
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name={showArchived ? 'archive-outline' : 'megaphone-outline'}
                  size={48}
                  color={COLORS.gray}
                />
                <Text style={styles.emptyText}>
                  {showArchived
                    ? 'No hay novedades archivadas'
                    : showPinnedOnly
                    ? 'No hay novedades fijadas'
                    : readFilter === 'unread'
                    ? 'No hay novedades sin leer'
                    : 'No hay novedades'}
                </Text>
                {readFilter !== 'all' && !showArchived && (
                  <TouchableOpacity onPress={() => setReadFilter('all')}>
                    <Text style={styles.emptyAction}>Ver todas</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
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
  cardArchived: {
    opacity: 0.7,
  },
  badgesContainer: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.xs,
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  pinnedBadge: {
    backgroundColor: COLORS.primary,
  },
  userPinnedBadge: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    ...UNREAD_STYLES.dot,
    zIndex: 2,
  },
  priorityBadge: {
    ...BADGE_STYLES.new,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  attachmentCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginLeft: 2,
  },
  ackIcon: {
    marginRight: SPACING.sm,
  },
  cardCta: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: SPACING.screenPadding,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyAction: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
});
