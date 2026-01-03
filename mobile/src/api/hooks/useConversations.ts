import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocList,
  getDoc,
  createDoc,
  updateDoc,
  getCount,
  Conversation,
  ConversationParticipant,
  ConversationMessage,
  FrappeUser,
} from '../frappe';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';
import { logger } from '../../utils/logger';

// Extended conversation type with computed properties
export interface ConversationWithMeta extends Conversation {
  participantId: string;
  unreadCount: number;
  lastMessage?: ConversationMessage;
  otherParticipants: FrappeUser[];
  canReply: boolean;
  isBlocked: boolean;
}

// Fetch conversations for current user
// OPTIMIZED: Replaced N+1 query pattern with batch queries
export function useConversations() {
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  const isEnabled = !!frappeUserId;
  const queryKey = queryKeys.conversations.user(frappeUserId ?? '');

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ConversationWithMeta[]> => {
      if (!frappeUserId) {
        return [];
      }

      // Step 1: Fetch all participations for current user
      const participations = await getDocList<ConversationParticipant>('Conversation Participant', {
        filters: [
          ['user', '=', frappeUserId],
          ['is_blocked', '=', false],
        ],
        fields: ['name', 'conversation', 'user', 'role', 'can_reply', 'is_blocked', 'is_muted', 'last_read_at', 'creation'],
        orderBy: { field: 'creation', order: 'desc' },
      });

      if (!participations.length) {
        return [];
      }

      const conversationNames = participations.map(p => p.conversation);

      // Step 2: Batch fetch conversations
      const conversations = await getDocList<Conversation>('Conversation', {
        filters: [
          ['name', 'in', conversationNames],
        ],
        fields: ['name', 'institution', 'conversation_type', 'subject', 'started_by', 'channel', 'status', 'closed_by', 'closed_at', 'closed_reason', 'creation', 'modified'],
      });

      // Create conversation lookup map
      const conversationMap = new Map<string, Conversation>();
      for (const conv of conversations) {
        conversationMap.set(conv.name, conv);
      }

      // Step 3: Batch fetch all participants for these conversations
      const allParticipants = await getDocList<ConversationParticipant>('Conversation Participant', {
        filters: [
          ['conversation', 'in', conversationNames],
        ],
        fields: ['name', 'conversation', 'user', 'role', 'can_reply', 'is_blocked', 'is_muted', 'last_read_at', 'creation'],
      });

      // Get unique user IDs to fetch user details
      const userIds = [...new Set(allParticipants.map(p => p.user))];
      const users = await getDocList<FrappeUser>('User', {
        filters: [
          ['name', 'in', userIds],
        ],
        fields: ['name', 'first_name', 'last_name', 'email', 'user_image', 'full_name'],
      });

      // Create user lookup map
      const userMap = new Map<string, FrappeUser>();
      for (const u of users) {
        userMap.set(u.name, u);
      }

      // Group participants by conversation
      const participantsByConversation = new Map<string, ConversationParticipant[]>();
      for (const p of allParticipants) {
        const list = participantsByConversation.get(p.conversation) || [];
        list.push(p);
        participantsByConversation.set(p.conversation, list);
      }

      // Step 4: Batch fetch last messages for ALL conversations in ONE request
      const allMessages = await getDocList<ConversationMessage>('Conversation Message', {
        filters: [
          ['conversation', 'in', conversationNames],
          ['deleted_at', 'is', 'not set'],
        ],
        fields: ['name', 'conversation', 'sender', 'content', 'content_type', 'is_urgent', 'deleted_at', 'creation'],
        orderBy: { field: 'creation', order: 'desc' },
        limit: conversationNames.length * 2,
      });

      // Group messages by conversation, keep only the latest per conversation
      const lastMessageByConversation = new Map<string, ConversationMessage>();
      for (const msg of allMessages) {
        const convId = msg.conversation;
        if (convId && !lastMessageByConversation.has(convId)) {
          lastMessageByConversation.set(convId, msg);
        }
      }

      // Step 5: Calculate unread counts
      const unreadCountsMap = new Map<string, number>();

      const participationsWithReadAt = participations.filter(p => p.last_read_at);
      const participationsWithoutReadAt = participations.filter(p => !p.last_read_at);

      // For participations without last_read_at, count all messages from others
      if (participationsWithoutReadAt.length > 0) {
        const convIdsWithoutReadAt = participationsWithoutReadAt.map(p => p.conversation);

        // Count unread messages for each conversation
        await Promise.all(
          convIdsWithoutReadAt.map(async (convId) => {
            const count = await getCount('Conversation Message', [
              ['conversation', '=', convId],
              ['deleted_at', 'is', 'not set'],
              ['sender', '!=', frappeUserId],
            ]);
            unreadCountsMap.set(convId, count);
          })
        );
      }

      // For participations with last_read_at, count messages after that date
      if (participationsWithReadAt.length > 0) {
        await Promise.all(
          participationsWithReadAt.map(async (participation) => {
            const convId = participation.conversation;
            const count = await getCount('Conversation Message', [
              ['conversation', '=', convId],
              ['deleted_at', 'is', 'not set'],
              ['sender', '!=', frappeUserId],
              ['creation', '>', participation.last_read_at!],
            ]);
            unreadCountsMap.set(convId, count);
          })
        );
      }

      // Step 6: Build final result
      const conversationsWithMeta = participations.map((participation) => {
        const conversation = conversationMap.get(participation.conversation);
        if (!conversation) return null;

        const convParticipants = participantsByConversation.get(conversation.name) || [];
        const otherParticipants = convParticipants
          .filter(p => p.user !== frappeUserId)
          .map(p => userMap.get(p.user))
          .filter((u): u is FrappeUser => u !== null && u !== undefined);

        return {
          ...conversation,
          participantId: participation.name,
          unreadCount: unreadCountsMap.get(conversation.name) || 0,
          lastMessage: lastMessageByConversation.get(conversation.name),
          otherParticipants,
          canReply: participation.can_reply,
          isBlocked: participation.is_blocked,
        };
      });

      return conversationsWithMeta.filter((c): c is ConversationWithMeta => c !== null);
    },
    enabled: isEnabled,
  });
}

// Fetch single conversation with messages
export function useConversation(conversationId: string) {
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: async () => {
      if (!frappeUserId || !conversationId) return null;

      // Fetch the conversation
      const conversation = await getDoc<Conversation>('Conversation', conversationId);

      // Fetch participants with user details
      const participants = await getDocList<ConversationParticipant>('Conversation Participant', {
        filters: [
          ['conversation', '=', conversationId],
        ],
        fields: ['name', 'conversation', 'user', 'role', 'can_reply', 'is_blocked', 'is_muted', 'last_read_at', 'creation'],
      });

      // Fetch user details for all participants
      const userIds = participants.map(p => p.user);
      const users = await getDocList<FrappeUser>('User', {
        filters: [
          ['name', 'in', userIds],
        ],
        fields: ['name', 'first_name', 'last_name', 'email', 'user_image', 'full_name'],
      });

      const userMap = new Map<string, FrappeUser>();
      for (const u of users) {
        userMap.set(u.name, u);
      }

      // Attach user details to participants
      const participantsWithDetails = participants.map(p => ({
        ...p,
        user_details: userMap.get(p.user),
      }));

      return {
        ...conversation,
        participants: participantsWithDetails,
      } as Conversation;
    },
    enabled: !!frappeUserId && !!conversationId,
  });
}

// Fetch messages for a conversation
export function useConversationMessages(conversationId: string) {
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useQuery({
    queryKey: queryKeys.conversationMessages(conversationId),
    queryFn: async () => {
      if (!frappeUserId || !conversationId) return [];

      const messages = await getDocList<ConversationMessage>('Conversation Message', {
        filters: [
          ['conversation', '=', conversationId],
          ['deleted_at', 'is', 'not set'],
        ],
        fields: ['name', 'conversation', 'sender', 'content', 'content_type', 'is_urgent', 'deleted_at', 'creation'],
        orderBy: { field: 'creation', order: 'asc' },
        limit: 100,
      });

      // Fetch sender details
      const senderIds = [...new Set(messages.map(m => m.sender))];
      const senders = await getDocList<FrappeUser>('User', {
        filters: [
          ['name', 'in', senderIds],
        ],
        fields: ['name', 'first_name', 'last_name', 'email', 'user_image', 'full_name'],
      });

      const senderMap = new Map<string, FrappeUser>();
      for (const s of senders) {
        senderMap.set(s.name, s);
      }

      // Attach sender details to messages
      return messages.map(msg => ({
        ...msg,
        sender_details: senderMap.get(msg.sender),
      })) as ConversationMessage[];
    },
    enabled: !!frappeUserId && !!conversationId,
  });
}

// Send a message to a conversation
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

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
      if (!frappeUserId) throw new Error('User not authenticated');

      const result = await createDoc<ConversationMessage>('Conversation Message', {
        conversation: conversationId,
        sender: frappeUserId,
        content,
        content_type: 'Text',
        is_urgent: isUrgent,
      });
      return result;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(conversationId) });
      // Scope invalidation to current user's conversations
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to send message', { error });
    },
  });
}

// Mark conversation as read (update last_read_at)
export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (participantId: string) => {
      const result = await updateDoc<ConversationParticipant>(
        'Conversation Participant',
        participantId,
        {
          last_read_at: new Date().toISOString(),
        }
      );
      return result;
    },
    onSuccess: () => {
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to mark conversation as read', { error });
    },
  });
}

// ============================================
// CONVERSATION CONTROL HOOKS (Teacher Actions)
// ============================================

// Close a conversation (teacher only)
export function useCloseConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      conversationId,
      reason,
    }: {
      conversationId: string;
      reason?: string;
    }) => {
      if (!frappeUserId) throw new Error('User not authenticated');

      const result = await updateDoc<Conversation>('Conversation', conversationId, {
        status: 'Closed',
        closed_by: frappeUserId,
        closed_at: new Date().toISOString(),
        closed_reason: reason,
      });
      return result;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to close conversation', { error });
    },
  });
}

// Reopen a closed conversation (teacher only)
export function useReopenConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await updateDoc<Conversation>('Conversation', conversationId, {
        status: 'Open',
        closed_by: undefined,
        closed_at: undefined,
        closed_reason: undefined,
      });
      return result;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to reopen conversation', { error });
    },
  });
}

// Toggle can_reply for a participant (teacher only)
export function useToggleParticipantReply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      participantId,
      canReply,
    }: {
      participantId: string;
      canReply: boolean;
    }) => {
      const result = await updateDoc<ConversationParticipant>(
        'Conversation Participant',
        participantId,
        {
          can_reply: canReply,
        }
      );
      return result;
    },
    onSuccess: () => {
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to toggle participant reply permission', { error });
    },
  });
}

// Block/unblock a participant (teacher only)
export function useToggleParticipantBlocked() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      participantId,
      isBlocked,
    }: {
      participantId: string;
      isBlocked: boolean;
    }) => {
      const result = await updateDoc<ConversationParticipant>(
        'Conversation Participant',
        participantId,
        {
          is_blocked: isBlocked,
        }
      );
      return result;
    },
    onSuccess: () => {
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to toggle participant blocked status', { error });
    },
  });
}

// Mute/unmute conversation notifications (for current user)
export function useMuteConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      participantId,
      isMuted,
    }: {
      participantId: string;
      isMuted: boolean;
    }) => {
      const result = await updateDoc<ConversationParticipant>(
        'Conversation Participant',
        participantId,
        {
          is_muted: isMuted,
        }
      );
      return result;
    },
    onSuccess: () => {
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to toggle conversation mute status', { error });
    },
  });
}

// Archive a conversation (teacher only)
export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await updateDoc<Conversation>('Conversation', conversationId, {
        status: 'Archived',
      });
      return result;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to archive conversation', { error });
    },
  });
}

// Unarchive a conversation (restore to open status)
export function useUnarchiveConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const result = await updateDoc<Conversation>('Conversation', conversationId, {
        status: 'Open',
      });
      return result;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to unarchive conversation', { error });
    },
  });
}

// ============================================
// CREATE CONVERSATION (Parent-initiated)
// ============================================

export interface CreateConversationParams {
  subject: string;
  channelId: string; // e.g., 'Secretaria', 'Profesores', etc.
  initialMessage: string;
  isUrgent?: boolean;
}

// Create a new conversation with initial message
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const frappeUserId = user?.directus_user_id;

  return useMutation({
    mutationFn: async ({
      subject,
      channelId,
      initialMessage,
      isUrgent = false,
    }: CreateConversationParams) => {
      if (!frappeUserId) throw new Error('User not authenticated');

      // Step 1: Create the conversation
      const conversation = await createDoc<Conversation>('Conversation', {
        subject,
        status: 'Open',
        channel: channelId,
        started_by: frappeUserId,
        institution: user?.organization_id,
        conversation_type: 'Private',
      });

      const conversationId = conversation.name;

      // Step 2: Add the creator as a participant
      await createDoc<ConversationParticipant>('Conversation Participant', {
        conversation: conversationId,
        user: frappeUserId,
        role: 'Parent',
        can_reply: true,
        is_blocked: false,
        is_muted: false,
      });

      // Step 3: Send the initial message
      await createDoc<ConversationMessage>('Conversation Message', {
        conversation: conversationId,
        sender: frappeUserId,
        content: initialMessage,
        content_type: 'Text',
        is_urgent: isUrgent,
      });

      return { conversationId };
    },
    onSuccess: () => {
      // Invalidate conversations list to show the new conversation
      if (frappeUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(frappeUserId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to create conversation', { error });
    },
  });
}
