/**
 * WebAnnouncementCard - Web-optimized announcement card following mobile pattern
 *
 * Design Pattern (matching mobile SwipeableAnnouncementCard):
 * - Prominent 160px image at top with overlay badges
 * - Date badge overlay on image (bottom-left)
 * - Priority badges absolutely positioned (top-left)
 * - Clean content section with title and excerpt
 * - Hover-revealed action buttons for web
 */
import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DirectusImage from '../../DirectusImage';
import { Announcement } from '../../../api/directus';
import { COLORS } from '../../../theme';
import { stripHtml } from '../../../utils';

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
  childName,
  childColor,
  onMarkAsRead,
  onTogglePin,
  onArchive,
  onUnarchive,
}: WebAnnouncementCardProps) {
  const router = useRouter();

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().replace('.', '');
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString();
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

  // Accessibility label
  const formatDateForA11y = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const accessibilityLabel = [
    item.title,
    formatDateForA11y(item.published_at || item.created_at),
    item.priority === 'urgent' ? 'urgente' : item.priority === 'important' ? 'importante' : null,
    childName ? `para ${childName}` : null,
    isUnread ? 'no leido' : null,
    isPinned ? 'fijado' : null,
  ].filter(Boolean).join(', ');

  const dateStr = item.published_at || item.created_at;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer h-full group"
      style={Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}}
    >
      {/* Image Section - Full width at top like mobile cards */}
      {item.image ? (
        <View className="relative w-full" style={{ height: 160 }}>
          <DirectusImage
            fileId={item.image}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {/* Date Badge Overlay (matching mobile pattern) */}
          <View
            className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md flex-row items-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          >
            <Ionicons name="calendar-outline" size={12} color={COLORS.white} style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-semibold">
              {formatDay(dateStr)} {formatMonth(dateStr)}
            </Text>
          </View>
          {/* Priority Badges */}
          <View className="absolute top-2 left-2 flex-col gap-1">
            {item.priority === 'urgent' && (
              <View className="bg-red-500 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-white uppercase">URGENTE</Text>
              </View>
            )}
            {item.priority === 'important' && (
              <View className="bg-orange-500 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-white uppercase">IMPORTANTE</Text>
              </View>
            )}
          </View>
          {/* Unread Badge */}
          {isUnread && (
            <View className="absolute top-2 right-2 bg-orange-500 px-2 py-0.5 rounded">
              <Text className="text-[10px] font-bold text-white uppercase">NUEVO</Text>
            </View>
          )}
          {/* Pin indicator */}
          {isPinned && (
            <View className="absolute top-2 right-2 bg-white/90 p-1 rounded">
              <Ionicons name="pin" size={12} color={COLORS.primary} />
            </View>
          )}
        </View>
      ) : (
        /* Fallback: Date Block Style (matching mobile InicioScreen) */
        <View className="p-4 pb-2">
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mb-3"
            style={{ backgroundColor: COLORS.primaryLight }}
          >
            <Text
              className="text-xs font-semibold uppercase"
              style={{ color: COLORS.primary, letterSpacing: 0.5, marginBottom: -2 }}
            >
              {formatMonth(dateStr)}
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{ color: COLORS.primary, letterSpacing: -0.5 }}
            >
              {formatDay(dateStr)}
            </Text>
          </View>

          {/* Badges for no-image cards */}
          <View className="absolute top-2 right-2 flex-row gap-2">
            {item.priority === 'urgent' && (
              <View className="bg-red-100 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-red-600 uppercase">URGENTE</Text>
              </View>
            )}
            {item.priority === 'important' && (
              <View className="bg-orange-100 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-orange-600 uppercase">IMPORTANTE</Text>
              </View>
            )}
            {isUnread && (
              <View className="bg-orange-100 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-orange-700 uppercase">NUEVO</Text>
              </View>
            )}
            {isPinned && (
              <View className="bg-blue-100 px-2 py-0.5 rounded">
                <Ionicons name="pin" size={10} color={COLORS.primary} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Content Section */}
      <View className={`px-4 ${item.image ? 'pt-3' : 'pt-0'} pb-3 flex-1`}>
        {/* Title */}
        <Text
          className={`text-base font-bold leading-snug mb-2 ${isUnread ? 'text-gray-900' : 'text-gray-800'}`}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Content excerpt */}
        <Text
          className="text-sm text-gray-500 leading-relaxed"
          numberOfLines={2}
        >
          {stripHtml(item.content)}
        </Text>
      </View>

      {/* Footer */}
      <View className="mt-auto border-t border-gray-100 px-4 py-2.5 flex-row items-center justify-between bg-gray-50/50">
        {childName ? (
          <View className="flex-row items-center gap-2">
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{ backgroundColor: childColor || COLORS.primary }}
            >
              <Text className="text-[9px] font-bold text-white">
                {childName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">{childName}</Text>
          </View>
        ) : (
          <Text className="text-xs text-gray-400">General</Text>
        )}

        {/* Hover Actions */}
        <View className="flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pressable
            onPress={(e) => handleActionClick(e as any, onTogglePin)}
            className="p-1.5 rounded-md hover:bg-gray-100"
            accessibilityLabel="Fijar"
          >
            <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={14} color={COLORS.gray400} />
          </Pressable>
          <Pressable
            onPress={(e) => handleActionClick(e as any, isArchived ? onUnarchive : onArchive)}
            className="p-1.5 rounded-md hover:bg-gray-100"
            accessibilityLabel="Archivar"
          >
            <Ionicons name="archive-outline" size={14} color={COLORS.gray400} />
          </Pressable>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-medium text-gray-500">Ver más</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.gray400} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default React.memo(WebAnnouncementCard);
