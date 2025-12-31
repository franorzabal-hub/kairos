import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationWithMeta } from '../../api/hooks';
import { COLORS, CHILD_COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, UNREAD_STYLES } from '../../theme';

// Screen-specific colors for conversation list
const LIST_COLORS = {
  urgent: '#D32F2F',
  urgentLight: '#FFEBEE',
};

// Avatar colors palette
const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6',
];

// Get a consistent color based on user ID hash
function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Child {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface ConversationCardProps {
  conversation: ConversationWithMeta;
  children: Child[];
  currentUserId?: string;
  onPress: (conversation: ConversationWithMeta) => void;
}

const ConversationCard = React.memo(({
  conversation,
  children,
  currentUserId,
  onPress,
}: ConversationCardProps) => {
  const hasUnread = conversation.unreadCount > 0;
  const isUrgent = conversation.lastMessage?.is_urgent;
  const isClosed = conversation.status === 'closed';

  // Get participant info for avatar
  const getParticipantInfo = () => {
    if (conversation.otherParticipants.length === 0) {
      return { name: 'Administracion', initials: 'AD', color: AVATAR_COLORS[0], userId: '' };
    }
    const participant = conversation.otherParticipants[0];
    const firstName = participant.first_name || '';
    const lastName = participant.last_name || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || participant.email || 'Usuario';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    const oderId = participant.id || '';
    const color = getAvatarColor(oderId);

    return { name, initials, color, oderId };
  };

  // Detect related child from subject
  const getRelatedChildName = (): string | null => {
    const subject = conversation.subject.toLowerCase();
    for (const child of children) {
      const childName = child.first_name?.toLowerCase();
      if (childName && subject.includes(childName)) {
        return child.first_name || null;
      }
    }
    return null;
  };

  // Get child color
  const getChildColor = (childName: string | null): string | null => {
    if (!childName) return null;
    const index = children.findIndex(c => c.first_name?.toLowerCase() === childName.toLowerCase());
    if (index >= 0) {
      return CHILD_COLORS[index % CHILD_COLORS.length];
    }
    return null;
  };

  // Get last message preview
  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'Sin mensajes';
    const sender = typeof conversation.lastMessage.sender_id === 'object'
      ? conversation.lastMessage.sender_id
      : null;
    const senderId = typeof conversation.lastMessage.sender_id === 'string'
      ? conversation.lastMessage.sender_id
      : conversation.lastMessage.sender_id?.id;
    const senderName = sender?.first_name || 'Usuario';
    const isMe = senderId === currentUserId;
    const prefix = isMe ? 'Tu: ' : `${senderName}: `;
    return prefix + conversation.lastMessage.content;
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('es-AR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }
  };

  const participantInfo = getParticipantInfo();
  const relatedChildName = getRelatedChildName();
  const childColor = getChildColor(relatedChildName);

  return (
    <TouchableOpacity
      style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
      onPress={() => onPress(conversation)}
      disabled={conversation.isBlocked}
    >
      {/* Avatar with Initials */}
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: isUrgent ? LIST_COLORS.urgentLight : `${participantInfo.color}20` },
          ]}
        >
          <Text style={[styles.avatarText, { color: isUrgent ? LIST_COLORS.urgent : participantInfo.color }]}>
            {participantInfo.initials}
          </Text>
        </View>
        {isUrgent && <View style={styles.urgentDot} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        {/* Row 1: Sender Name + Timestamp */}
        <View style={styles.conversationHeader}>
          <Text style={[styles.participantName, hasUnread && styles.unreadText]} numberOfLines={1}>
            {participantInfo.name}
          </Text>
          <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
            {formatDate(conversation.lastMessage?.date_created || conversation.date_created)}
          </Text>
        </View>

        {/* Row 2: Subject + Closed badge */}
        <View style={styles.subjectRow}>
          <Text style={[styles.subject, hasUnread && styles.subjectUnread]} numberOfLines={1}>
            {conversation.subject}
          </Text>
          {isClosed && (
            <View style={styles.closedBadge}>
              <Ionicons name="checkmark-circle" size={10} color={COLORS.gray} />
              <Text style={styles.closedBadgeText}>Cerrado</Text>
            </View>
          )}
        </View>

        {/* Row 3: Preview + Child indicator + Unread count */}
        <View style={styles.previewRow}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>

          <View style={styles.rowIndicators}>
            {relatedChildName && children.length > 1 && (
              <View style={[styles.childIndicator, { backgroundColor: childColor || COLORS.gray }]}>
                <Text style={styles.childIndicatorText}>
                  {relatedChildName.charAt(0)}
                </Text>
              </View>
            )}

            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status indicators */}
        {(!conversation.canReply || conversation.isBlocked) && (
          <View style={styles.statusRow}>
            {!conversation.canReply && !isClosed && (
              <View style={styles.statusIndicator}>
                <Ionicons name="eye-outline" size={10} color={COLORS.gray} />
                <Text style={styles.statusText}>Solo lectura</Text>
              </View>
            )}
            {conversation.isBlocked && (
              <View style={styles.statusIndicator}>
                <Ionicons name="ban-outline" size={10} color={LIST_COLORS.urgent} />
                <Text style={[styles.statusText, { color: LIST_COLORS.urgent }]}>Bloqueado</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

ConversationCard.displayName = 'ConversationCard';

export default ConversationCard;

const styles = StyleSheet.create({
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.screenPadding,
    padding: SPACING.cardPadding,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  conversationCardUnread: {
    ...UNREAD_STYLES.borderLeft,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  urgentDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LIST_COLORS.urgent,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  participantName: {
    flex: 1,
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.black,
    marginRight: SPACING.sm,
  },
  unreadText: {
    ...TYPOGRAPHY.listItemTitleBold,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  timestampUnread: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  subject: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.gray,
  },
  subjectUnread: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
    marginLeft: SPACING.sm,
  },
  closedBadgeText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.gray,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  previewUnread: {
    color: COLORS.darkGray,
  },
  rowIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  childIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  unreadBadgeText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.white,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
});
