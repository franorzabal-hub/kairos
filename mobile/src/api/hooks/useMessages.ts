import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocList,
  updateDoc,
  Message,
  MessageRecipient,
} from '../frappe';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../context/ChildrenContext';
import { useUI } from '../../context/UIContext';
import { queryKeys } from './queryKeys';
import { logger } from '../../utils/logger';

// Extended message type with recipient info
export interface MessageWithReadStatus extends Message {
  recipientId: string;
  read_at?: string;
  delivered_at?: string;
}

// Fetch messages via Message Recipient junction
export function useMessages() {
  const { user } = useAuth();
  const { selectedChildId } = useChildren();
  const { filterMode } = useUI();

  // In Frappe, we use the user's name (email) as the user identifier
  const frappeUserId = user?.frappe_user_id ?? '';

  return useQuery({
    queryKey: queryKeys.messageRecipients.filtered(frappeUserId, selectedChildId ?? undefined, filterMode),
    queryFn: async () => {
      if (!frappeUserId) return [];

      // Fetch Message Recipient records for current user
      const recipients = await getDocList<MessageRecipient>('Message Recipient', {
        filters: [
          ['guardian', '=', frappeUserId],
        ],
        fields: ['name', 'message', 'guardian', 'student', 'delivered_at', 'read_at', 'creation'],
        orderBy: { field: 'creation', order: 'desc' },
        limit: 50,
      });

      // Fetch all related messages in a batch
      const messageNames = recipients.map(r => r.message).filter(Boolean);
      if (messageNames.length === 0) return [];

      const messages = await getDocList<Message>('Message', {
        filters: [
          ['name', 'in', messageNames],
        ],
        fields: ['name', 'institution', 'subject', 'content', 'message_type', 'priority', 'status', 'owner', 'creation'],
      });

      // Create a map for quick message lookup
      const messageMap = new Map<string, Message>();
      for (const msg of messages) {
        messageMap.set(msg.name, msg);
      }

      // Transform to include read status with message data
      return recipients
        .map(recipient => {
          const message = messageMap.get(recipient.message);
          if (!message) return null;

          return {
            ...message,
            recipientId: recipient.name,
            read_at: recipient.read_at,
            delivered_at: recipient.delivered_at,
          };
        })
        .filter((item): item is MessageWithReadStatus => item !== null);
    },
    enabled: !!frappeUserId,
  });
}

// Mark message as read by updating Message Recipient
export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.frappe_user_id;

  return useMutation({
    mutationFn: async (recipientId: string) => {
      // Update the Message Recipient record with read_at timestamp
      const result = await updateDoc<MessageRecipient>(
        'Message Recipient',
        recipientId,
        {
          read_at: new Date().toISOString(),
        }
      );
      return result;
    },
    onSuccess: () => {
      // Scope invalidation to current user's messages
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messageRecipients.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to mark message as read', { error });
    },
  });
}
