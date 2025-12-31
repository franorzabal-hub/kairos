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
import { View, Text, Pressable, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DirectusImage from '../../DirectusImage';
import { Announcement } from '../../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES } from '../../../theme';
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

  // Determine card accent color and icon based on content heuristics
  const getCategoryInfo = () => {
    const text = (item.title + ' ' + item.content).toLowerCase();
    
    if (item.priority === 'urgent') return { color: COLORS.error, icon: 'alert-circle-outline' };
    if (item.priority === 'important') return { color: COLORS.warning, icon: 'alert-outline' };
    
    if (text.includes('deporte') || text.includes('partido') || text.includes('torneo')) {
      return { color: COLORS.success, icon: 'trophy-outline' }; // Green/Sports
    }
    if (text.includes('examen') || text.includes('prueba') || text.includes('nota')) {
      return { color: '#8B5CF6', icon: 'school-outline' }; // Violet/Academic
    }
    if (text.includes('arte') || text.includes('música') || text.includes('teatro')) {
      return { color: '#EC4899', icon: 'palette-outline' }; // Pink/Arts
    }
    
    return { color: COLORS.primary, icon: 'bullhorn-outline' }; // Default Blue
  };

  const { color: accentColor, icon: categoryIcon } = getCategoryInfo();

  // Re-declare accessibility label logic
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

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={(state) => ({
        backgroundColor: COLORS.white,
        borderRadius: BORDERS.radius.lg,
        overflow: 'hidden',
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        borderWidth: 1,
        borderTopWidth: 1, // Reset top width to 1
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? {
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          transform: (state as WebPressableState).hovered ? 'translateY(-2px)' : 'none',
          cursor: 'pointer',
        } as any : {}),
        ...(isUnread && { borderColor: COLORS.primaryLight }),
      })}
      className="h-full flex-col p-5 group hover:shadow-md"
    >
      {/* Header: Icon + Title + Date */}
      <View className="flex-row items-start gap-3 mb-3">
        {/* Category Icon */}
        <View 
          className="w-8 h-8 rounded-lg items-center justify-center bg-gray-50 mt-0.5"
        >
           <MaterialCommunityIcons 
             name={categoryIcon as any} 
             size={18} 
             color={COLORS.gray600} 
           />
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-start">
             {/* Title */}
             <Text 
               className={`text-base font-bold text-gray-900 leading-snug flex-1 mr-4 ${isUnread ? 'text-black' : 'text-gray-800'}`}
             >
               {item.title}
             </Text>
             
             {/* Date */}
             <Text className="text-xs font-medium text-gray-400 whitespace-nowrap">
               {formatDate(item.published_at || item.created_at)}
             </Text>
          </View>

          {/* Badges Row */}
          <View className="flex-row flex-wrap gap-2 mt-2">
            {item.priority === 'urgent' && (
              <View className="bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                <Text className="text-[10px] font-bold text-red-600 uppercase">Urgente</Text>
              </View>
            )}
            {item.priority === 'important' && (
              <View className="bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                <Text className="text-[10px] font-bold text-orange-600 uppercase">Importante</Text>
              </View>
            )}
            {childName && (
               <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: childColor || COLORS.primary }} />
                  <Text className="text-[10px] font-medium text-gray-500">{childName}</Text>
               </View>
            )}
            {isPinned && (
              <View className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                <Ionicons name="pin" size={10} color={COLORS.primary} />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Content Body: Text + Thumbnail */}
      <View className="flex-row gap-4 mb-4">
        <Text
          className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3"
          numberOfLines={3}
        >
          {stripHtml(item.content)}
        </Text>
        
        {/* Thumbnail Image (Restored) */}
        {item.image && (
          <DirectusImage
            fileId={item.image}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            className="bg-gray-100 border border-gray-100"
            contentFit="cover"
          />
        )}
      </View>

      {/* Footer Actions (Visible on Hover or if relevant) */}
      <View className="mt-auto pt-3 border-t border-gray-50 flex-row justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
         <View className="flex-row gap-1">
            <Pressable
              onPress={(e) => handleActionClick(e as any, onTogglePin)}
              className="p-1.5 rounded-md hover:bg-gray-100"
              accessibilityLabel="Fijar"
            >
              <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={16} color={COLORS.gray500} />
            </Pressable>
            <Pressable
              onPress={(e) => handleActionClick(e as any, isArchived ? onUnarchive : onArchive)}
              className="p-1.5 rounded-md hover:bg-gray-100"
              accessibilityLabel="Archivar"
            >
               <Ionicons name="archive-outline" size={16} color={COLORS.gray500} />
            </Pressable>
         </View>
         
         {isUnread && (
            <Pressable
               onPress={(e) => handleActionClick(e as any, onMarkAsRead)}
               className="flex-row items-center gap-1 px-2 py-1 rounded-md bg-gray-50 hover:bg-green-50 hover:text-green-600 transition-colors"
            >
               <Ionicons name="checkmark-done" size={14} color={COLORS.gray400} />
               <Text className="text-xs font-medium text-gray-500">Marcar leído</Text>
            </Pressable>
         )}
      </View>
    </Pressable>
  );
}

export default React.memo(WebAnnouncementCard);
