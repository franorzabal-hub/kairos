import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DirectusImage from './DirectusImage';
import { Announcement } from '../api/frappe';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS, BADGE_STYLES, SIZES, FONT_SIZES } from '../theme';
import { stripHtml } from '../utils';

interface SwipeableAnnouncementCardProps {
  item: Announcement;
  isUnread: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isAcknowledged?: boolean;
  childName?: string;
  childColor?: string;
  onMarkAsRead: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}

function SwipeableAnnouncementCard({
  item,
  isUnread,
  isPinned,
  isArchived,
  isAcknowledged = false,
  childName,
  childColor,
  onMarkAsRead,
  onTogglePin,
  onArchive,
  onUnarchive,
}: SwipeableAnnouncementCardProps) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Use uppercase to match event cards format (e.g., "29 DIC" instead of "29 dic")
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).toUpperCase().replace('.', '');
  };

  // Format full date for accessibility
  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Build accessibility label
  const accessibilityLabel = [
    item.title,
    formatFullDate(item.published_at || item.created_at),
    item.priority === 'urgent' ? 'urgente' : item.priority === 'important' ? 'importante' : null,
    childName ? `para ${childName}` : null,
    isUnread ? 'no leido' : null,
    isPinned ? 'fijado' : null,
    item.requires_acknowledgment && !isAcknowledged ? 'requiere confirmacion' : null,
  ].filter(Boolean).join(', ');

  const handlePress = () => {
    if (isUnread) {
      onMarkAsRead();
    }
    router.push({ pathname: '/novedades/[id]', params: { id: item.id } });
  };

  // Close swipeable after action
  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  // Render left actions (swipe right to reveal) - Pin
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-20, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.leftActionsContainer, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.pinAction, isPinned && styles.pinActionActive]}
          onPress={() => {
            onTogglePin();
            closeSwipeable();
          }}
        >
          <Ionicons
            name={isPinned ? 'pin' : 'pin-outline'}
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.actionText}>{isPinned ? 'Desfijar' : 'Fijar'}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render right actions (swipe left to reveal) - Archive & Mark read
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.rightActionsContainer, { transform: [{ translateX: trans }] }]}>
        {/* Mark as read/unread button - only show if unread */}
        {isUnread && (
          <TouchableOpacity
            style={[styles.actionButton, styles.readAction]}
            onPress={() => {
              onMarkAsRead();
              closeSwipeable();
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.white} />
            <Text style={styles.actionText}>Leído</Text>
          </TouchableOpacity>
        )}

        {/* Archive/Unarchive button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.archiveAction]}
          onPress={() => {
            if (isArchived) {
              onUnarchive();
            } else {
              onArchive();
            }
            closeSwipeable();
          }}
        >
          <Ionicons
            name={isArchived ? 'archive' : 'archive-outline'}
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.actionText}>{isArchived ? 'Restaurar' : 'Archivar'}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Toca para ver la novedad. Desliza para mas acciones"
      >
        {/* Priority Badge */}
        {item.priority === 'urgent' ? (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityBadgeText}>URGENTE</Text>
          </View>
        ) : item.priority === 'important' ? (
          <View style={[styles.priorityBadge, styles.importantBadge]}>
            <Text style={styles.priorityBadgeText}>IMPORTANTE</Text>
          </View>
        ) : null}

        {/* Acknowledgment indicator */}
        {item.requires_acknowledgment && !isAcknowledged && (
          <View style={styles.acknowledgmentIndicator}>
            <Ionicons name="alert-circle" size={14} color="#F59E0B" />
          </View>
        )}

        {/* Pin indicator */}
        {isPinned && (
          <View style={styles.pinnedIndicator}>
            <Ionicons name="pin" size={14} color={COLORS.primary} />
          </View>
        )}

        {/* Image */}
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

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name="megaphone-outline" size={12} color={COLORS.white} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>{formatDate(item.published_at || item.created_at)}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            {isUnread && <View style={styles.unreadDot} />}
            <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}>{item.title}</Text>
          </View>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{stripHtml(item.content)}</Text>
          {/* Child indicator - shown when viewing "Todos" */}
          {childName && (
            <View style={styles.childRow}>
              <View style={[styles.childAvatar, { backgroundColor: childColor || COLORS.primary }]}>
                <Text style={styles.childInitial}>
                  {childName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.childName}>{childName}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // Card styles (matching NovedadesScreen)
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  unreadDot: {
    ...UNREAD_STYLES.dotSmall,
    flexShrink: 0,
  },
  pinnedIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md + SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.full,
    padding: SPACING.xs,
    zIndex: 2,
  },
  acknowledgmentIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md + SIZES.touchTarget,
    backgroundColor: '#FEF3C7',
    borderRadius: BORDERS.radius.full,
    padding: SPACING.xs,
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
    height: SIZES.cardImageHeight,
    width: '100%',
  },
  cardImagePlaceholder: {
    height: SIZES.cardImageHeight,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: FONT_SIZES['6xl'],
    color: COLORS.primary,
  },
  categoryBadge: {
    position: 'absolute',
    top: SIZES.cardImageHeight - SPACING.xxxl + SPACING.xxs,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md - SPACING.xxs,
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
    flex: 1,
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  // Child indicator styles
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  childAvatar: {
    width: SPACING.lg + SPACING.xxs,
    height: SPACING.lg + SPACING.xxs,
    borderRadius: BORDERS.radius.md + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInitial: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  childName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },

  // Swipe action styles
  leftActionsContainer: {
    width: SIZES.avatarXxl + SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginLeft: SPACING.screenPadding,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginRight: SPACING.screenPadding,
  },
  actionButton: {
    width: SIZES.avatarXxl + SPACING.lg,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDERS.radius.md,
  },
  pinAction: {
    backgroundColor: COLORS.primary,
  },
  pinActionActive: {
    backgroundColor: '#666',
  },
  readAction: {
    backgroundColor: COLORS.success,
  },
  archiveAction: {
    backgroundColor: COLORS.warning,
  },
  actionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});

// Memoize to prevent unnecessary re-renders in lists
export default React.memo(SwipeableAnnouncementCard);
