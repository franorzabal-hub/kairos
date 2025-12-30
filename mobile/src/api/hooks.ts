import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readItems, createItem, updateItem, readItem } from '@directus/sdk';
import {
  directus,
  Announcement,
  Event,
  Message,
  MessageRecipient,
  PickupRequest,
  Report,
  Student,
  StudentGuardian,
  Conversation,
  ConversationParticipant,
  ConversationMessage,
  DirectusUser,
} from './directus';
import { useAppContext } from '../context/AppContext';
import {
  getReadIds as getReadIdsService,
  markAsRead as markAsReadService,
  markAsUnread as markAsUnreadService,
  ContentType,
} from '../services/readStatusService';

// Query keys
export const queryKeys = {
  announcements: ['announcements'] as const,
  announcement: (id: string) => ['announcement', id] as const,
  events: ['events'] as const,
  event: (id: string) => ['event', id] as const,
  messages: ['messages'] as const,
  messageRecipients: ['messageRecipients'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  conversationMessages: (id: string) => ['conversationMessages', id] as const,
  pickupRequests: ['pickupRequests'] as const,
  reports: ['reports'] as const,
  children: ['children'] as const,
  readIds: (type: string, userId: string) => ['readIds', type, userId] as const,
};

// Fetch children for the current user
export function useChildren() {
  const { user, setChildren } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.children, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get student_guardians for this user
      const guardians = await directus.request(
        readItems('student_guardians', {
          filter: { user_id: { _eq: user.id } },
        })
      );

      if (!guardians.length) return [];

      // Get students for these guardians
      const studentIds = guardians.map(g => g.student_id);
      const students = await directus.request(
        readItems('students', {
          filter: { id: { _in: studentIds }, status: { _eq: 'active' } },
        })
      );

      setChildren(students as Student[]);
      return students as Student[];
    },
    enabled: !!user?.id,
  });
}

// Fetch announcements
export function useAnnouncements() {
  const { children, selectedChildId, filterMode } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.announcements, selectedChildId, filterMode],
    queryFn: async () => {
      const filter: any = {
        status: { _eq: 'published' },
      };

      // If child selected, filter by section or grade
      // For MVP, we fetch all published announcements

      const items = await directus.request(
        readItems('announcements', {
          filter,
          sort: ['-created_at'],
          limit: 50,
        })
      );

      return items as Announcement[];
    },
  });
}

// Fetch single announcement
export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: queryKeys.announcement(id),
    queryFn: async () => {
      if (!id) return null;
      const item = await directus.request(
        readItem('announcements', id)
      );
      return item as Announcement;
    },
    enabled: !!id,
  });
}

// Fetch events
export function useEvents() {
  const { selectedChildId, filterMode } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.events, selectedChildId, filterMode],
    queryFn: async () => {
      const filter: any = {
        status: { _eq: 'published' },
      };

      const items = await directus.request(
        readItems('events', {
          filter,
          sort: ['start_date'],
          limit: 50,
        })
      );

      return items as Event[];
    },
  });
}

// Fetch single event
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => {
      if (!id) return null;
      const item = await directus.request(
        readItem('events', id, {
          fields: ['*', { location_id: ['*'] }] as any,
        })
      );
      return item as unknown as Event;
    },
    enabled: !!id,
  });
}

// Fetch messages via message_recipients junction
export function useMessages() {
  const { user, selectedChildId, filterMode } = useAppContext();

  // message_recipients.user_id references directus_users, not app_users
  const directusUserId = user?.directus_user_id;

  return useQuery({
    queryKey: [...queryKeys.messageRecipients, directusUserId, selectedChildId, filterMode],
    queryFn: async () => {
      if (!directusUserId) return [];

      // Fetch message_recipients for current user with message details
      const items = await directus.request(
        readItems('message_recipients', {
          filter: {
            user_id: { _eq: directusUserId },
          },
          // Use type assertion for nested field syntax
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

// Extended message type with recipient info
export interface MessageWithReadStatus extends Message {
  recipientId: string;
  read_at?: string;
  delivered_at?: string;
}

// Fetch pickup requests
export function usePickupRequests() {
  const { user, children, selectedChildId } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.pickupRequests, user?.id, selectedChildId],
    queryFn: async () => {
      if (!user?.id || !children.length) return [];

      const studentIds = selectedChildId
        ? [selectedChildId]
        : children.map(c => c.id);

      const items = await directus.request(
        readItems('pickup_requests', {
          filter: {
            student_id: { _in: studentIds },
            requested_by: { _eq: user.id },
          },
          sort: ['-created_at'],
          limit: 50,
        })
      );

      return items as PickupRequest[];
    },
    enabled: !!user?.id && children.length > 0,
  });
}

// Create pickup request
export function useCreatePickupRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PickupRequest, 'id' | 'created_at' | 'status'>) => {
      const result = await directus.request(
        createItem('pickup_requests', {
          ...data,
          status: 'pending',
        })
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupRequests });
    },
  });
}

// Update pickup request (for editing pending requests)
export function useUpdatePickupRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<PickupRequest, 'pickup_date' | 'pickup_time' | 'authorized_person' | 'reason' | 'notes'>>;
    }) => {
      const result = await directus.request(
        updateItem('pickup_requests', id, data)
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupRequests });
    },
  });
}

// Fetch reports/boletines
export function useReports() {
  const { children, selectedChildId } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.reports, selectedChildId],
    queryFn: async () => {
      if (!children.length) return [];

      const studentIds = selectedChildId
        ? [selectedChildId]
        : children.map(c => c.id);

      const items = await directus.request(
        readItems('reports', {
          filter: {
            student_id: { _in: studentIds },
            visible_to_parents: { _eq: true },
            published_at: { _nnull: true },
          },
          sort: ['-published_at'],
          limit: 50,
        })
      );

      return items as Report[];
    },
    enabled: children.length > 0,
  });
}

// Mark message as read by updating message_recipient
export function useMarkMessageRead() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.messageRecipients });
    },
  });
}

// ============================================
// NEW CONVERSATION-BASED MESSAGING HOOKS
// ============================================

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
export function useConversations() {
  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

  const isEnabled = !!directusUserId;
  const queryKey = [...queryKeys.conversations, directusUserId];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ConversationWithMeta[]> => {
      if (!directusUserId) {
        return [];
      }

      // Fetch conversation_participants for this user with conversation and last message
      const participations = await directus.request(
        readItems('conversation_participants', {
          filter: {
            user_id: { _eq: directusUserId },
            is_blocked: { _eq: false },
          },
          // Use type assertion for nested field syntax
          fields: [
            '*',
            { conversation_id: ['*', { participants: ['*', { user_id: ['*'] }] }] },
          ] as any,
          sort: ['-date_created'] as any, // Sort by participation date since nested sort not reliable
        })
      );

      // For each conversation, get the last message and unread count
      const conversationsWithMeta = await Promise.all(
        (participations as unknown as ConversationParticipant[]).map(async (participation) => {
          const conversation = participation.conversation_id as Conversation;

          // Get last message
          const messages = await directus.request(
            readItems('conversation_messages', {
              filter: {
                conversation_id: { _eq: conversation.id },
                deleted_at: { _null: true },
              },
              fields: ['*', { sender_id: ['*'] }] as any,
              sort: ['-date_created'],
              limit: 1,
            })
          );

          // Count unread messages (created after last_read_at)
          const unreadFilter: any = {
            conversation_id: { _eq: conversation.id },
            deleted_at: { _null: true },
            sender_id: { _neq: directusUserId },
          };
          if (participation.last_read_at) {
            unreadFilter.date_created = { _gt: participation.last_read_at };
          }

          const unreadMessages = await directus.request(
            readItems('conversation_messages', {
              filter: unreadFilter,
              aggregate: { count: ['*'] },
            })
          );

          const unreadCount = Number((unreadMessages as any)[0]?.count ?? 0);

          // Get other participants (not current user)
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
            unreadCount,
            lastMessage: (messages as unknown as ConversationMessage[])[0],
            otherParticipants,
            canReply: participation.can_reply,
            isBlocked: participation.is_blocked,
          };
        })
      );

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

      // Fetch conversation with participants
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
          sort: ['date_created'], // Oldest first for chat view
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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Mark conversation as read (update last_read_at)
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Reopen a closed conversation (teacher only)
export function useReopenConversation() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Toggle can_reply for a participant (teacher only)
export function useToggleParticipantReply() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Block/unblock a participant (teacher only)
export function useToggleParticipantBlocked() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Mute/unmute conversation notifications (for current user)
export function useMuteConversation() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Archive a conversation (teacher only)
export function useArchiveConversation() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// Unarchive a conversation (restore to open status)
export function useUnarchiveConversation() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// ============================================
// READ STATUS HOOKS (React Query based)
// ============================================

// Re-export ContentType for convenience
export type { ContentType } from '../services/readStatusService';

/**
 * Fetch read IDs for a content type using React Query.
 * This ensures shared cache across all screens.
 */
export function useReadIds(type: ContentType) {
  const { user } = useAppContext();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.readIds(type, userId ?? ''),
    queryFn: async () => {
      if (!userId) return new Set<string>();
      return getReadIdsService(type, userId);
    },
    enabled: !!userId,
    staleTime: 0, // Always refetch on focus
  });
}

/**
 * Mark an item as read - updates the database and invalidates the cache
 */
export function useMarkAsRead(type: ContentType) {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      await markAsReadService(type, id, userId);
    },
    onMutate: async (id: string) => {
      // Optimistic update: add to local cache immediately
      if (!userId) return;
      const queryKey = queryKeys.readIds(type, userId);
      await queryClient.cancelQueries({ queryKey });

      const previousReadIds = queryClient.getQueryData<Set<string>>(queryKey);

      queryClient.setQueryData<Set<string>>(queryKey, (old) => {
        const next = new Set(old ?? []);
        next.add(id);
        return next;
      });

      return { previousReadIds };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (!userId || !context?.previousReadIds) return;
      queryClient.setQueryData(queryKeys.readIds(type, userId), context.previousReadIds);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.readIds(type, userId) });
    },
  });
}

/**
 * Mark an item as unread - updates the database and invalidates the cache
 */
export function useMarkAsUnread(type: ContentType) {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      await markAsUnreadService(type, id, userId);
    },
    onMutate: async (id: string) => {
      // Optimistic update: remove from local cache immediately
      if (!userId) return;
      const queryKey = queryKeys.readIds(type, userId);
      await queryClient.cancelQueries({ queryKey });

      const previousReadIds = queryClient.getQueryData<Set<string>>(queryKey);

      queryClient.setQueryData<Set<string>>(queryKey, (old) => {
        const next = new Set(old ?? []);
        next.delete(id);
        return next;
      });

      return { previousReadIds };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (!userId || !context?.previousReadIds) return;
      queryClient.setQueryData(queryKeys.readIds(type, userId), context.previousReadIds);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.readIds(type, userId) });
    },
  });
}

/**
 * Combined hook for read status management.
 * Provides read IDs, check function, and mark functions.
 * All functions are memoized with useCallback to prevent infinite loops in useEffect.
 */
export function useContentReadStatus(type: ContentType) {
  const { data, isLoading } = useReadIds(type);
  // Ensure readIds is always a Set, even during initial load
  const readIds = data instanceof Set ? data : new Set<string>();
  const markAsReadMutation = useMarkAsRead(type);
  const markAsUnreadMutation = useMarkAsUnread(type);

  const isRead = useCallback((id: string): boolean => {
    return readIds.has(id);
  }, [readIds]);

  const markAsRead = useCallback(async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  }, [markAsReadMutation]);

  const markAsUnread = useCallback(async (id: string) => {
    await markAsUnreadMutation.mutateAsync(id);
  }, [markAsUnreadMutation]);

  const filterUnread = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    return items.filter(item => !readIds.has(item.id));
  }, [readIds]);

  const countUnread = useCallback(<T extends { id: string }>(items: T[]): number => {
    return items.filter(item => !readIds.has(item.id)).length;
  }, [readIds]);

  return {
    readIds,
    isLoading,
    isRead,
    markAsRead,
    markAsUnread,
    filterUnread,
    countUnread,
  };
}
