/**
 * FirstMessageCard - Email-style first message display
 *
 * Shows the initial message in a conversation with full sender details.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationMessage, DirectusUser } from '../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, SIZES } from '../../theme';

const CHAT_COLORS = {
  urgent: '#D32F2F',
};

interface FirstMessageCardProps {
  message: ConversationMessage;
}

function FirstMessageCard({ message }: FirstMessageCardProps) {
  const sender = typeof message.sender_id === 'object' ? message.sender_id : null;
  const senderName = sender
    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ')
    : 'Usuario';

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  return (
    <View style={[styles.card, message.is_urgent && styles.cardUrgent]}>
      {/* Sender info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {sender?.first_name?.charAt(0) ?? '?'}{sender?.last_name?.charAt(0) ?? ''}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.senderName}>{senderName}</Text>
          <Text style={styles.date}>
            {formatDate(message.date_created)} • {formatTime(message.date_created)}
          </Text>
        </View>
      </View>

      {/* Urgent badge */}
      {message.is_urgent && (
        <View style={styles.urgentBadge}>
          <Ionicons name="alert-circle" size={16} color={COLORS.white} />
          <Text style={styles.urgentText}>URGENTE</Text>
        </View>
      )}

      {/* Message content */}
      <Text style={styles.content}>{message.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardUrgent: {
    borderLeftWidth: BORDERS.width.thick,
    borderLeftColor: CHAT_COLORS.urgent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: SIZES.avatarMd,
    height: SIZES.avatarMd,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  meta: {
    flex: 1,
  },
  senderName: {
    ...TYPOGRAPHY.listItemTitleBold,
    color: COLORS.black,
  },
  date: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xxs,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CHAT_COLORS.urgent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDERS.radius.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  urgentText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  content: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    lineHeight: 22,
  },
});

export default React.memo(FirstMessageCard);
