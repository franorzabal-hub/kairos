import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readItems, readItem, createItem, updateItem } from '@directus/sdk';
import { getAggregateCount } from '../../types/directus';
import {
  directus,
  Conversation,
  ConversationParticipant,
  ConversationMessage,
  DirectusUser,
} from '../directus';
import { useAppContext } from '../../context/AppContext';
import { queryKeys } from './queryKeys';

// Extended conversation type with computed properties
export interface ConversationWithMeta extends Conversation {
  participantId: string;
  unreadCount: number;
  lastMessage?: ConversationMessage;
  otherParticipants: DirectusUser[];
  canReply: boolean;
  isBlocked: boolean;
}

// Fetch conversations for current user
// OPTIMIZED: Replaced N+1 query pattern with batch queries
export function useConversations() {
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  const isEnabled = !!directusUserId;
  const queryKey = queryKeys.conversations.user(directusUserId ?? '');

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ConversationWithMeta[]> => {
      if (!directusUserId) {
        return [];
      }

      // Step 1: Fetch all participations with conversation data
      const participations = await directus.request(
        readItems('conversation_participants', {
          filter: {
            user_id: { _eq: directusUserId },
            is_blocked: { _eq: false },
          },
          fields: [
            '*',
            { conversation_id: ['*', { participants: ['*', { user_id: ['*'] }] }] },
          ] as any,
          sort: ['-date_created'],
        })
      );

      if (!participations.length) {
        return [];
      }

      const typedParticipations = participations as unknown as ConversationParticipant[];
      const conversationIds = typedParticipations.map(
        p => (p.conversation_id as Conversation).id
      );

      // Step 2: Batch fetch last messages for ALL conversations in ONE request
      const allMessages = await directus.request(
        readItems('conversation_messages', {
          filter: {
            conversation_id: { _in: conversationIds },
            deleted_at: { _null: true },
          },
          fields: ['*', { sender_id: ['*'] }] as any,
          sort: ['-date_created'],
          limit: conversationIds.length * 2,
        })
      );

      // Group messages by conversation_id, keep only the latest per conversation
      const lastMessageByConversation = new Map<string, ConversationMessage>();
      for (const msg of allMessages as unknown as ConversationMessage[]) {
        const convId = typeof msg.conversation_id === 'string'
          ? msg.conversation_id
          : (msg.conversation_id as Conversation)?.id;
        if (convId && !lastMessageByConversation.has(convId)) {
          lastMessageByConversation.set(convId, msg);
        }
      }

      // Step 3: Batch fetch unread counts
      const unreadCountsMap = new Map<string, number>();

      const participationsWithReadAt = typedParticipations.filter(p => p.last_read_at);
      const participationsWithoutReadAt = typedParticipations.filter(p => !p.last_read_at);

      // For participations without last_read_at, count all messages from others
      if (participationsWithoutReadAt.length > 0) {
        const convIdsWithoutReadAt = participationsWithoutReadAt.map(
          p => (p.conversation_id as Conversation).id
        );

        const unreadAll = await directus.request(
          readItems('conversation_messages', {
            filter: {
              conversation_id: { _in: convIdsWithoutReadAt },
              deleted_at: { _null: true },
              sender_id: { _neq: directusUserId },
            },
            aggregate: { countDistinct: ['id'] },
            groupBy: ['conversation_id'],
          })
        );

        for (const item of unreadAll as any[]) {
          const convId = item.conversation_id;
          const count = parseInt(item.countDistinct?.id || '0', 10);
          unreadCountsMap.set(convId, count);
        }
      }

      // For participations with last_read_at, batch with Promise.all
      if (participationsWithReadAt.length > 0) {
        const unreadCounts = await Promise.all(
          participationsWithReadAt.map(async (participation) => {
            const conversation = participation.conversation_id as Conversation;
            const unreadMessages = await directus.request(
              readItems('conversation_messages', {
                filter: {
                  conversation_id: { _eq: conversation.id },
                  deleted_at: { _null: true },
                  sender_id: { _neq: directusUserId },
                  date_created: { _gt: participation.last_read_at },
                } as any, // Directus SDK type limitation for date comparison operators
                aggregate: { count: ['*'] },
              })
            );
            return {
              conversationId: conversation.id,
              count: getAggregateCount(unreadMessages),
            };
          })
        );

        for (const { conversationId, count } of unreadCounts) {
          unreadCountsMap.set(conversationId, count);
        }
      }

      // Step 4: Build final result
      const conversationsWithMeta = typedParticipations.map((participation) => {
        const conversation = participation.conversation_id as Conversation;

        const otherParticipants = (conversation.participants ?? [])
          .filter(p => {
            const userId = typeof p.user_id === 'string' ? p.user_id : (p.user_id as DirectusUser)?.id;
            return userId !== directusUserId;
          })
          .map(p => (typeof p.user_id === 'object' ? p.user_id : null) as DirectusUser | null)
          .filter((u): u is DirectusUser => u !== null);

        return {
          ...conversation,
          participantId: participation.id,
          unreadCount: unreadCountsMap.get(conversation.id) || 0,
          lastMessage: lastMessageByConversation.get(conversation.id),
          otherParticipants,
          canReply: participation.can_reply,
          isBlocked: participation.is_blocked,
        };
      });

      return conversationsWithMeta;
    },
    enabled: isEnabled,
  });
}

// Fetch single conversation with messages
export function useConversation(conversationId: string) {
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: async () => {
      if (!directusUserId || !conversationId) return null;

      const conversation = await directus.request(
        readItem('conversations', conversationId, {
          fields: [
            '*',
            { participants: ['*', { user_id: ['*'] }] },
          ] as any,
        })
      );

      return conversation as unknown as Conversation;
    },
    enabled: !!directusUserId && !!conversationId,
  });
}

// Fetch messages for a conversation
export function useConversationMessages(conversationId: string) {
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useQuery({
    queryKey: queryKeys.conversationMessages(conversationId),
    queryFn: async () => {
      if (!directusUserId || !conversationId) return [];

      const messages = await directus.request(
        readItems('conversation_messages', {
          filter: {
            conversation_id: { _eq: conversationId },
            deleted_at: { _null: true },
          },
          fields: ['*', { sender_id: ['*'] }] as any,
          sort: ['date_created'],
          limit: 100,
        })
      );

      return messages as unknown as ConversationMessage[];
    },
    enabled: !!directusUserId && !!conversationId,
  });
}

// Send a message to a conversation
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      isUrgent = false,
    }: {
      conversationId: string;
      content: string;
      isUrgent?: boolean;
    }) => {
      if (!directusUserId) throw new Error('User not authenticated');

      const result = await directus.request(
        createItem('conversation_messages', {
          conversation_id: conversationId,
          sender_id: directusUserId,
          content,
          content_type: 'text',
          is_urgent: isUrgent,
        })
      );
      return result;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(conversationId) });
      // Scope invalidation to current user's conversations
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Mark conversation as read (update last_read_at)
export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (participantId: string) => {
      const result = await directus.request(
        updateItem('conversation_participants', participantId, {
          last_read_at: new Date().toISOString(),
        })
      );
      return result;
    },
    onSuccess: () => {
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// ============================================
// CONVERSATION CONTROL HOOKS (Teacher Actions)
// ============================================

// Close a conversation (teacher only)
export function useCloseConversation() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      conversationId,
      reason,
    }: {
      conversationId: string;
      reason?: string;
    }) => {
      if (!directusUserId) throw new Error('User not authenticated');

      const result = await directus.request(
        updateItem('conversations', conversationId, {
          status: 'closed',
          closed_by: directusUserId,
          closed_at: new Date().toISOString(),
          closed_reason: reason,
        })
      );
      return result;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Reopen a closed conversation (teacher only)
export function useReopenConversation() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await directus.request(
        updateItem('conversations', conversationId, {
          status: 'open',
          closed_by: null,
          closed_at: null,
          closed_reason: null,
        })
      );
      return result;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Toggle can_reply for a participant (teacher only)
export function useToggleParticipantReply() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      participantId,
      canReply,
    }: {
      participantId: string;
      canReply: boolean;
    }) => {
      const result = await directus.request(
        updateItem('conversation_participants', participantId, {
          can_reply: canReply,
        })
      );
      return result;
    },
    onSuccess: () => {
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Block/unblock a participant (teacher only)
export function useToggleParticipantBlocked() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      participantId,
      isBlocked,
    }: {
      participantId: string;
      isBlocked: boolean;
    }) => {
      const result = await directus.request(
        updateItem('conversation_participants', participantId, {
          is_blocked: isBlocked,
        })
      );
      return result;
    },
    onSuccess: () => {
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Mute/unmute conversation notifications (for current user)
export function useMuteConversation() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      participantId,
      isMuted,
    }: {
      participantId: string;
      isMuted: boolean;
    }) => {
      const result = await directus.request(
        updateItem('conversation_participants', participantId, {
          is_muted: isMuted,
        })
      );
      return result;
    },
    onSuccess: () => {
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Archive a conversation (teacher only)
export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await directus.request(
        updateItem('conversations', conversationId, {
          status: 'archived',
        })
      );
      return result;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// Unarchive a conversation (restore to open status)
export function useUnarchiveConversation() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await directus.request(
        updateItem('conversations', conversationId, {
          status: 'open',
        })
      );
      return result;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}

// ============================================
// CREATE CONVERSATION (Parent-initiated)
// ============================================

export interface CreateConversationParams {
  subject: string;
  channelId: string; // e.g., 'secretaria', 'enfermeria', etc.
  initialMessage: string;
  isUrgent?: boolean;
}

// Create a new conversation with initial message
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      subject,
      channelId,
      initialMessage,
      isUrgent = false,
    }: CreateConversationParams) => {
      if (!directusUserId) throw new Error('User not authenticated');

      // Step 1: Create the conversation
      const conversation = await directus.request(
        createItem('conversations', {
          subject,
          status: 'open',
          channel: channelId,
          started_by: directusUserId,
          organization_id: user?.organization_id,
        })
      );

      const conversationId = (conversation as any).id;

      // Step 2: Add the creator as a participant
      await directus.request(
        createItem('conversation_participants', {
          conversation_id: conversationId,
          user_id: directusUserId,
          can_reply: true,
          is_blocked: false,
          is_muted: false,
        })
      );

      // Step 3: Send the initial message
      await directus.request(
        createItem('conversation_messages', {
          conversation_id: conversationId,
          sender_id: directusUserId,
          content: initialMessage,
          content_type: 'text',
          is_urgent: isUrgent,
        })
      );

      return { conversationId };
    },
    onSuccess: () => {
      // Invalidate conversations list to show the new conversation
      if (directusUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(directusUserId) });
      }
    },
  });
}
