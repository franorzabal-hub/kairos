/**
 * ChatBubble - WhatsApp-style chat message bubble
 *
 * Unified component for mobile and web platforms.
 * Displays a single message with sender info, timestamp, and read receipts.
 *
 * Features:
 * - WhatsApp-style bubble design
 * - Sender name display for other participants
 * - Urgent message indicator
 * - Read receipts for own messages
 * - Platform-specific styling (hover effects on web)
 * - Accessibility support
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationMessage, FrappeUser } from '../../api/frappe';
import { COLORS, BORDERS, TYPOGRAPHY, SPACING, FONT_SIZES } from '../../theme';

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
    <View
      style={[styles.messageRow, isMyMessage && styles.messageRowMine]}
      accessibilityRole="text"
      accessibilityLabel={`${isMyMessage ? 'Tu mensaje' : `Mensaje de ${senderName}`}: ${message.content}. ${formatTime(message.date_created)}${message.is_urgent ? '. Urgente' : ''}`}
    >
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
          <View style={styles.urgentBadge} accessibilityLabel="Mensaje urgente">
            <Ionicons name="alert-circle" size={14} color={COLORS.chatBubbleUrgent} />
            <Text style={styles.urgentText}>Urgente</Text>
          </View>
        )}
        <Text style={styles.messageText} selectable={Platform.OS === 'web'}>
          {message.content}
        </Text>
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
              accessibilityLabel="Mensaje leído"
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
    ...Platform.select({
      web: {
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'default',
      } as unknown as ViewStyle,
    }),
  },
  myBubble: {
    backgroundColor: COLORS.chatBubbleOwn,
    borderBottomRightRadius: BORDERS.radius.sm,
  },
  theirBubble: {
    backgroundColor: COLORS.chatBubbleOther,
    borderBottomLeftRadius: BORDERS.radius.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      } as ViewStyle,
    }),
  },
  urgentBubble: {
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.chatBubbleUrgent,
  },
  senderName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  } as TextStyle,
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  urgentText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.chatBubbleUrgent,
    marginLeft: SPACING.xs,
  } as TextStyle,
  messageText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.black,
    lineHeight: 20,
    ...Platform.select({
      web: {
        userSelect: 'text',
        wordBreak: 'break-word',
      } as TextStyle,
    }),
  },
  messageTime: {
    ...TYPOGRAPHY.badge,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  } as TextStyle,
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
