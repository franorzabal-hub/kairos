/**
 * FirstMessageCard - Email-style first message display
 *
 * Unified component for mobile and web platforms.
 * Shows the initial message in a conversation with full sender details.
 *
 * Features:
 * - Email-style card design
 * - Sender avatar and details
 * - Urgent message indicator
 * - Platform-specific styling (shadow on web)
 * - Accessibility support
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationMessage, DirectusUser } from '../../api/frappe';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, SIZES } from '../../theme';

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
    <View
      style={[styles.card, message.is_urgent && styles.cardUrgent]}
      accessibilityRole="text"
      accessibilityLabel={`Mensaje inicial de ${senderName}: ${message.content}. ${formatDate(message.date_created)} a las ${formatTime(message.date_created)}${message.is_urgent ? '. Urgente' : ''}`}
    >
      {/* Sender info */}
      <View style={styles.header}>
        <View style={styles.avatar} accessibilityLabel={`Avatar de ${senderName}`}>
          <Text style={styles.avatarText}>
            {sender?.first_name?.charAt(0) ?? '?'}{sender?.last_name?.charAt(0) ?? ''}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.senderName}>{senderName}</Text>
          <Text style={styles.date}>
            {formatDate(message.date_created)} {'\u2022'} {formatTime(message.date_created)}
          </Text>
        </View>
      </View>

      {/* Urgent badge */}
      {message.is_urgent && (
        <View style={styles.urgentBadge} accessibilityLabel="Mensaje urgente">
          <Ionicons name="alert-circle" size={16} color={COLORS.white} />
          <Text style={styles.urgentText}>URGENTE</Text>
        </View>
      )}

      {/* Message content */}
      <Text style={styles.content} selectable={Platform.OS === 'web'}>
        {message.content}
      </Text>
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.15s ease',
      } as ViewStyle,
    }),
  },
  cardUrgent: {
    borderLeftWidth: BORDERS.width.thick,
    borderLeftColor: COLORS.chatBubbleUrgent,
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
    backgroundColor: COLORS.chatBubbleUrgent,
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
    ...Platform.select({
      web: {
        userSelect: 'text',
        wordBreak: 'break-word',
      } as TextStyle,
    }),
  },
});

export default React.memo(FirstMessageCard);
