import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readItems, updateItem } from '@directus/sdk';
import { directus, Message, MessageRecipient } from '../directus';
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

// Fetch messages via message_recipients junction
export function useMessages() {
  const { user } = useAuth();
  const { selectedChildId } = useChildren();
  const { filterMode } = useUI();

  // message_recipients.user_id references directus_users, not app_users
  const directusUserId = user?.directus_user_id ?? '';

  return useQuery({
    queryKey: queryKeys.messageRecipients.filtered(directusUserId, selectedChildId ?? undefined, filterMode),
    queryFn: async () => {
      if (!directusUserId) return [];

      // Fetch message_recipients for current user with message details
      const items = await directus.request(
        readItems('message_recipients', {
          filter: {
            user_id: { _eq: directusUserId },
          },
          // Nested relational fields - SDK type limitation requires 'as any'
          fields: ['*', { message_id: ['*'] }] as any,
          sort: ['-date_created'],
          limit: 50,
        })
      );

      // Transform to include read status with message data
      return (items as unknown as MessageRecipient[]).map(recipient => ({
        ...(recipient.message_id as Message),
        recipientId: recipient.id,
        read_at: recipient.read_at,
        delivered_at: recipient.delivered_at,
      }));
    },
    enabled: !!directusUserId,
  });
}

// Mark message as read by updating message_recipient
export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (recipientId: string) => {
      // Update the message_recipient record with read_at timestamp
      const result = await directus.request(
        updateItem('message_recipients', recipientId, {
          read_at: new Date().toISOString(),
        })
      );
      return result;
    },
    onSuccess: () => {
      // Scope invalidation to current user's messages
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messageRecipients.user(directusUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to mark message as read', { error });
    },
  });
}
