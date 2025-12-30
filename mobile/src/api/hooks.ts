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

// Query keys
export const queryKeys = {
  announcements: ['announcements'] as const,
  events: ['events'] as const,
  messages: ['messages'] as const,
  messageRecipients: ['messageRecipients'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  conversationMessages: (id: string) => ['conversationMessages', id] as const,
  pickupRequests: ['pickupRequests'] as const,
  reports: ['reports'] as const,
  children: ['children'] as const,
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

// ========== Announcements with Advanced Filters ==========

export type ReadFilter = 'all' | 'unread' | 'read';

export interface UseAnnouncementsOptions {
  readFilter?: ReadFilter;
  showArchived?: boolean;
  showPinnedOnly?: boolean;
}

// Fetch announcements with advanced filtering
export function useAnnouncements(options: UseAnnouncementsOptions = {}) {
  const { user, children, selectedChildId, filterMode } = useAppContext();

  const {
    readFilter = filterMode === 'unread' ? 'unread' : 'all',
    showArchived = false,
    showPinnedOnly = false,
  } = options;

  return useQuery({
    queryKey: [
      ...queryKeys.announcements,
      selectedChildId,
      readFilter,
      showArchived,
      showPinnedOnly,
      user?.id,
    ],
    queryFn: async () => {
      const filter: any = {
        status: { _eq: 'published' },
      };

      // Fetch announcements with attachments
      const items = await directus.request(
        readItems('announcements', {
          filter,
          sort: ['-pinned', '-pinned_at', '-published_at', '-created_at'] as any,
          limit: 100,
          fields: [
            '*',
            // Include attachments if they exist
          ],
        })
      );

      let announcements = items as Announcement[];

      // If we have a user, fetch their read/status info
      if (user?.id) {
        try {
          // Fetch user read records
          const readRecords = await directus.request(
            readItems('content_reads', {
              filter: {
                content_type: { _eq: 'announcement' },
                user_id: { _eq: user.id },
              },
            })
          );
          const readMap = new Map(
            (readRecords as any[]).map(r => [r.content_id, r])
          );

          // Fetch user status records (archived/pinned)
          const statusRecords = await directus.request(
            readItems('content_user_status', {
              filter: {
                content_type: { _eq: 'announcement' },
                user_id: { _eq: user.id },
              },
            })
          );
          const statusMap = new Map(
            (statusRecords as any[]).map(s => [s.content_id, s])
          );

          // Merge into announcements
          announcements = announcements.map(a => ({
            ...a,
            user_read: readMap.get(a.id),
            user_status: statusMap.get(a.id),
          }));
        } catch (error) {
          console.warn('Could not fetch user read/status:', error);
        }
      }

      // Apply client-side filters
      let filtered = announcements;

      // Filter by read status
      if (readFilter === 'unread') {
        filtered = filtered.filter(a => !a.user_read);
      } else if (readFilter === 'read') {
        filtered = filtered.filter(a => !!a.user_read);
      }

      // Filter archived
      if (showArchived) {
        // Show ONLY archived
        filtered = filtered.filter(a => a.user_status?.is_archived);
      } else {
        // Hide archived
        filtered = filtered.filter(a => !a.user_status?.is_archived);
      }

      // Filter pinned only
      if (showPinnedOnly) {
        filtered = filtered.filter(a =>
          a.pinned || a.user_status?.is_pinned
        );
      }

      // Sort: global pinned first, then user pinned, then by date
      filtered.sort((a, b) => {
        // Global pinned first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Then user pinned
        if (a.user_status?.is_pinned && !b.user_status?.is_pinned) return -1;
        if (!a.user_status?.is_pinned && b.user_status?.is_pinned) return 1;

        // Then by date
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return dateB - dateA;
      });

      return filtered;
    },
  });
}

// Legacy hook for backwards compatibility
export function useAnnouncementsLegacy() {
  const { children, selectedChildId, filterMode } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.announcements, selectedChildId, filterMode, 'legacy'],
    queryFn: async () => {
      const filter: any = {
        status: { _eq: 'published' },
      };

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

  // Debug logging - add timestamp to track re-renders
  const timestamp = Date.now();
  const isEnabled = !!directusUserId;
  const queryKey = [...queryKeys.conversations, directusUserId];
  console.log(`[useConversations:${timestamp}] HOOK CALLED`);
  console.log(`[useConversations:${timestamp}] user:`, user ? `${user.first_name} (${user.email})` : 'null');
  console.log(`[useConversations:${timestamp}] directusUserId:`, directusUserId);
  console.log(`[useConversations:${timestamp}] enabled:`, isEnabled);
  console.log(`[useConversations:${timestamp}] queryKey:`, JSON.stringify(queryKey));

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ConversationWithMeta[]> => {
      console.log('[useConversations] ===== QUERY FN CALLED =====');
      console.log('[useConversations] directusUserId in queryFn:', directusUserId);

      if (!directusUserId) {
        console.log('[useConversations] No directusUserId - returning empty array');
        console.log('[useConversations] user.id:', user?.id);
        console.log('[useConversations] Possible issue: app_user.directus_user_id not set');
        return [];
      }

      // Fetch conversation_participants for this user with conversation and last message
      console.log('[useConversations] Fetching participations for user:', directusUserId);
      let participations;
      try {
        participations = await directus.request(
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
        console.log('[useConversations] Participations found:', participations?.length ?? 0);
        console.log('[useConversations] Raw participations:', JSON.stringify(participations, null, 2));
      } catch (error) {
        console.error('[useConversations] Error fetching participations:', error);
        throw error;
      }

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

          const result = {
            ...conversation,
            participantId: participation.id,
            unreadCount,
            lastMessage: (messages as unknown as ConversationMessage[])[0],
            otherParticipants,
            canReply: participation.can_reply,
            isBlocked: participation.is_blocked,
          };
          console.log('[useConversations] Built ConversationWithMeta:', {
            id: result.id,
            subject: result.subject,
            canReply: result.canReply,
            'participation.can_reply': participation.can_reply,
          });
          return result;
        })
      );

      return conversationsWithMeta;
    },
    enabled: isEnabled,
    staleTime: 0, // DEBUG: Force fresh fetch every time
    gcTime: 0, // DEBUG: Don't cache
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
