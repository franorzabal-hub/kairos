/**
 * ChatBubble - WhatsApp-style chat message bubble
 *
 * Displays a single message with sender info, timestamp, and read receipts.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationMessage, DirectusUser } from '../../api/directus';
import { COLORS, BORDERS, TYPOGRAPHY, SPACING } from '../../theme';

// Chat-specific colors
const CHAT_COLORS = {
  myBubble: '#DCF8C6',
  theirBubble: '#FFFFFF',
  urgent: '#D32F2F',
};

interface ChatBubbleProps {
  message: ConversationMessage;
  isMyMessage: boolean;
}

function ChatBubble({ message, isMyMessage }: ChatBubbleProps) {
  const sender = typeof message.sender_id === 'object' ? message.sender_id : null;
  const senderName = sender
    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ')
    : 'Usuario';

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageRow, isMyMessage && styles.messageRowMine]}>
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.theirBubble,
          message.is_urgent && styles.urgentBubble,
        ]}
      >
        {!isMyMessage && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        {message.is_urgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="alert-circle" size={14} color={CHAT_COLORS.urgent} />
            <Text style={styles.urgentText}>Urgente</Text>
          </View>
        )}
        <Text style={styles.messageText}>{message.content}</Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isMyMessage && styles.messageTimeMine]}>
            {formatTime(message.date_created)}
          </Text>
          {isMyMessage && (
            <Ionicons
              name="checkmark-done"
              size={14}
              color={COLORS.primary}
              style={styles.readReceipt}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDERS.radius.xl,
  },
  myBubble: {
    backgroundColor: CHAT_COLORS.myBubble,
    borderBottomRightRadius: BORDERS.radius.sm,
  },
  theirBubble: {
    backgroundColor: CHAT_COLORS.theirBubble,
    borderBottomLeftRadius: BORDERS.radius.sm,
  },
  urgentBubble: {
    borderWidth: BORDERS.width.thin,
    borderColor: CHAT_COLORS.urgent,
  },
  senderName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  urgentText: {
    ...TYPOGRAPHY.badge,
    color: CHAT_COLORS.urgent,
    marginLeft: SPACING.xs,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 20,
  },
  messageTime: {
    ...TYPOGRAPHY.badge,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  messageTimeMine: {
    alignSelf: 'flex-end',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  readReceipt: {
    marginLeft: SPACING.xxs,
  },
});

export default React.memo(ChatBubble);
