/**
 * WebAnnouncementCard - Announcement card for web without swipe gestures
 *
 * Features:
 * - Hover-revealed action buttons (pin, archive, mark read)
 * - Fixed height for grid consistency
 * - Uses Pressable for hover states
 * - Works well in 2-3 column grids
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Image, PressableStateCallbackType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DirectusImage from '../../DirectusImage';
import { Announcement } from '../../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, BADGE_STYLES, UNREAD_STYLES } from '../../../theme';
import { stripHtml } from '../../../utils';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

interface WebAnnouncementCardProps {
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

export function WebAnnouncementCard({
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
}: WebAnnouncementCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).toUpperCase().replace('.', '');
  };

  const handlePress = () => {
    if (isUnread) {
      onMarkAsRead();
    }
    router.push({ pathname: '/novedades/[id]', params: { id: item.id } });
  };

  const handleActionClick = (e: React.SyntheticEvent, action: () => void) => {
    e.stopPropagation();
    action();
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

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Toca para ver la novedad"
      style={(state) => ({
        backgroundColor: COLORS.white,
        borderRadius: BORDERS.radius.lg,
        overflow: 'hidden',
        ...(Platform.OS === 'web' ? {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          transform: (state as WebPressableState).hovered ? 'translateY(-2px)' : 'none',
          cursor: 'pointer',
        } as any : {}),
        ...(isUnread && UNREAD_STYLES.borderLeft),
      })}
    >
      {/* Image Section */}
      <View style={{ position: 'relative' }}>
        <DirectusImage
          fileId={item.image}
          style={{ height: 160, width: '100%' }}
          resizeMode="cover"
          fallback={
            <View
              style={{
                height: 160,
                backgroundColor: COLORS.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="school-outline" size={48} color={COLORS.primary} />
              <Text style={{ fontSize: 24, color: COLORS.primary }}>Colegio</Text>
            </View>
          }
        />

        {/* Priority Badge */}
        {item.priority === 'urgent' && (
          <View style={{ position: 'absolute', top: SPACING.md, left: SPACING.md, ...BADGE_STYLES.new }}>
            <Text style={{ color: COLORS.white, ...TYPOGRAPHY.badgeSmall }}>URGENTE</Text>
          </View>
        )}
        {item.priority === 'important' && (
          <View
            style={{
              position: 'absolute',
              top: SPACING.md,
              left: SPACING.md,
              ...BADGE_STYLES.new,
              backgroundColor: COLORS.warning,
            }}
          >
            <Text style={{ color: COLORS.white, ...TYPOGRAPHY.badgeSmall }}>IMPORTANTE</Text>
          </View>
        )}

        {/* Hover Actions Overlay */}
        {Platform.OS === 'web' && isHovered && (
          <View
            style={{
              position: 'absolute',
              top: SPACING.sm,
              right: SPACING.sm,
              flexDirection: 'row',
              gap: SPACING.xs,
            }}
          >
            {/* Pin button */}
            <Pressable
              onPress={(e) => handleActionClick(e as any, onTogglePin)}
              style={(state) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isPinned ? COLORS.primary : 'rgba(0,0,0,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (state as WebPressableState).hovered ? 0.8 : 1,
              })}
            >
              <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={16} color={COLORS.white} />
            </Pressable>

            {/* Mark as read (only if unread) */}
            {isUnread && (
              <Pressable
                onPress={(e) => handleActionClick(e as any, onMarkAsRead)}
                style={(state) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(76, 175, 80, 0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (state as WebPressableState).hovered ? 0.8 : 1,
                })}
              >
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              </Pressable>
            )}

            {/* Archive/Unarchive */}
            <Pressable
              onPress={(e) => handleActionClick(e as any, isArchived ? onUnarchive : onArchive)}
              style={(state) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 152, 0, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (state as WebPressableState).hovered ? 0.8 : 1,
              })}
            >
              <Ionicons name={isArchived ? 'archive' : 'archive-outline'} size={16} color={COLORS.white} />
            </Pressable>
          </View>
        )}

        {/* Static indicators (shown when not hovered) */}
        {!isHovered && (
          <View
            style={{
              position: 'absolute',
              top: SPACING.md,
              right: SPACING.md,
              flexDirection: 'row',
              gap: SPACING.xs,
            }}
          >
            {item.requires_acknowledgment && !isAcknowledged && (
              <View
                style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: BORDERS.radius.full,
                  padding: 4,
                }}
              >
                <Ionicons name="alert-circle" size={14} color="#F59E0B" />
              </View>
            )}
            {isPinned && (
              <View
                style={{
                  backgroundColor: COLORS.primaryLight,
                  borderRadius: BORDERS.radius.full,
                  padding: 4,
                }}
              >
                <Ionicons name="pin" size={14} color={COLORS.primary} />
              </View>
            )}
          </View>
        )}

        {/* Category Badge */}
        <View
          style={{
            position: 'absolute',
            bottom: SPACING.sm,
            left: SPACING.md,
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 10,
            paddingVertical: SPACING.xs,
            borderRadius: BORDERS.radius.sm,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="megaphone-outline" size={12} color={COLORS.white} style={{ marginRight: SPACING.xs }} />
          <Text style={{ color: COLORS.white, ...TYPOGRAPHY.caption }}>
            {formatDate(item.published_at || item.created_at)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: SPACING.cardPadding }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {isUnread && <View style={UNREAD_STYLES.dotSmall} />}
          <Text
            style={{
              ...TYPOGRAPHY.cardTitle,
              flex: 1,
              fontWeight: isUnread ? '700' : '600',
            }}
          >
            {item.title}
          </Text>
        </View>

        <Text
          style={{ ...TYPOGRAPHY.body, color: COLORS.gray, marginTop: SPACING.xs }}
          numberOfLines={2}
        >
          {stripHtml(item.content)}
        </Text>

        {/* Child indicator */}
        {childName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.xs }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: childColor || COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.white }}>
                {childName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray }}>{childName}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default React.memo(WebAnnouncementCard);
