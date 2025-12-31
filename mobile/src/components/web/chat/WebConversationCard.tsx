/**
 * WebConversationCard - Conversation list item for web
 *
 * Features:
 * - Hover effects with subtle elevation
 * - Selected state for master-detail layout
 * - Action buttons on hover (archive, pin, delete)
 * - Optimized for sidebar conversation list
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, DirectusUser } from '../../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

interface WebConversationCardProps {
  conversation: Conversation;
  isSelected?: boolean;
  isUnread?: boolean;
  onPress: () => void;
  onArchive?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
}

export function WebConversationCard({
  conversation,
  isSelected = false,
  isUnread = false,
  onPress,
  onArchive,
  onPin,
  isPinned = false,
}: WebConversationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get last message preview
  const lastMessage = conversation.messages?.[0];
  const lastMessageText = lastMessage?.content?.substring(0, 60) || 'Sin mensajes';
  const lastMessageTime = lastMessage?.date_created;

  // Get participant names for display
  const getParticipantNames = () => {
    if (conversation.subject) return conversation.subject;

    const participants = conversation.participants;
    if (!participants || participants.length === 0) return 'Conversación';

    // Extract user info from participants
    const names = participants
      .slice(0, 3)
      .map((p: any) => {
        const user = typeof p.user_id === 'object' ? p.user_id : null;
        if (!user) return null;
        return user.first_name || user.email?.split('@')[0] || 'Usuario';
      })
      .filter(Boolean);

    if (names.length === 0) return 'Conversación';
    if (participants.length > 3) {
      return `${names.join(', ')} +${participants.length - 3}`;
    }
    return names.join(', ');
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const handleActionClick = (e: any, action?: () => void) => {
    e.stopPropagation();
    action?.();
  };

  const getConversationIcon = () => {
    switch (conversation.type) {
      case 'group':
        return 'people';
      case 'private':
      default:
        return 'chatbubble';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={(state) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: isSelected
          ? COLORS.primaryLight
          : (state as WebPressableState).hovered
          ? '#F5F5F5'
          : COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SPACING.md,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        } as any),
        ...(isUnread && {
          borderLeftWidth: 3,
          borderLeftColor: COLORS.primary,
        }),
      })}
    >
      {/* Avatar/Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: BORDERS.radius.full,
          backgroundColor: isSelected ? COLORS.primary : COLORS.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={getConversationIcon()}
          size={24}
          color={isSelected ? COLORS.white : COLORS.primary}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          {isPinned && (
            <Ionicons name="pin" size={12} color={COLORS.primary} />
          )}
          <Text
            style={{
              ...TYPOGRAPHY.listItemTitle,
              fontWeight: isUnread ? '700' : '600',
              color: COLORS.darkGray,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {getParticipantNames()}
          </Text>
        </View>

        <Text
          style={{
            ...TYPOGRAPHY.caption,
            color: isUnread ? COLORS.darkGray : COLORS.gray,
            fontWeight: isUnread ? '500' : '400',
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {lastMessageText}
        </Text>
      </View>

      {/* Right side: time and actions */}
      <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
        {/* Time */}
        <Text
          style={{
            ...TYPOGRAPHY.badge,
            color: isUnread ? COLORS.primary : COLORS.gray,
          }}
        >
          {formatTime(lastMessageTime)}
        </Text>

        {/* Hover actions or unread badge */}
        {isHovered && Platform.OS === 'web' ? (
          <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
            {onPin && (
              <Pressable
                onPress={(e) => handleActionClick(e, onPin)}
                style={(state) => ({
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isPinned ? COLORS.primaryLight : COLORS.lightGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (state as WebPressableState).hovered ? 0.7 : 1,
                })}
              >
                <Ionicons
                  name={isPinned ? 'pin' : 'pin-outline'}
                  size={12}
                  color={isPinned ? COLORS.primary : COLORS.gray}
                />
              </Pressable>
            )}
            {onArchive && (
              <Pressable
                onPress={(e) => handleActionClick(e, onArchive)}
                style={(state) => ({
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: COLORS.lightGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (state as WebPressableState).hovered ? 0.7 : 1,
                })}
              >
                <Ionicons name="archive-outline" size={12} color={COLORS.gray} />
              </Pressable>
            )}
          </View>
        ) : isUnread ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.primary,
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export default React.memo(WebConversationCard);
