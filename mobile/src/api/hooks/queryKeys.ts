/**
 * Centralized Query Keys for TanStack Query Cache Management
 *
 * This module defines all query keys used throughout the app for consistent
 * cache management and type-safe invalidation.
 *
 * ## KEY DESIGN PRINCIPLES
 *
 * ### 1. Global vs User-Scoped Data
 * - **Global data** (shared across all users): Simple keys like `['announcements']`
 * - **User-scoped data** (personalized): Include userId in key for cache isolation
 *
 * ### 2. Key Structure Patterns
 * - **Simple**: `['resource']` - For fetching all items of a type
 * - **By ID**: `['resource', id]` - For fetching a single item
 * - **Nested**: `{ all, user, filtered }` - For resources with multiple access patterns
 *
 * ### 3. Invalidation Strategies
 * - **Exact match**: `queryKeys.conversation(id)` - Invalidate specific item
 * - **Prefix match**: `queryKeys.conversations.all` - Invalidate all conversations
 * - **User-scoped**: `queryKeys.conversations.user(userId)` - Invalidate user's data only
 *
 * ## USAGE EXAMPLES
 *
 * ### Fetching Data
 * ```typescript
 * // Global data
 * useQuery({ queryKey: queryKeys.announcements, queryFn: fetchAnnouncements });
 *
 * // User-scoped data
 * useQuery({
 *   queryKey: queryKeys.conversations.user(userId),
 *   queryFn: fetchUserConversations
 * });
 *
 * // Single item
 * useQuery({
 *   queryKey: queryKeys.conversation(conversationId),
 *   queryFn: () => fetchConversation(conversationId)
 * });
 * ```
 *
 * ### Invalidating Cache (in mutations)
 * ```typescript
 * // Invalidate user's conversations after sending a message
 * onSuccess: () => {
 *   queryClient.invalidateQueries({ queryKey: queryKeys.conversations.user(userId) });
 * }
 *
 * // Invalidate specific conversation and messages
 * onSuccess: () => {
 *   queryClient.invalidateQueries({ queryKey: queryKeys.conversation(id) });
 *   queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(id) });
 * }
 * ```
 *
 * ## WHY USER-SCOPED KEYS?
 *
 * User-scoped keys (`['conversations', userId]`) ensure:
 * 1. **Cache isolation**: User A's data doesn't leak to User B on shared devices
 * 2. **Targeted invalidation**: Only refresh the current user's cache after mutations
 * 3. **Memory efficiency**: Old user's cache is naturally evicted on logout/login
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */
export const queryKeys = {
  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL DATA (shared across all users, no userId needed)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Organization details by ID */
  organization: (id: string) => ['organization', id] as const,

  /** All announcements - global, viewable by all authenticated users */
  announcements: ['announcements'] as const,
  /** Single announcement by ID */
  announcement: (id: string) => ['announcement', id] as const,
  /** Attachments for a specific announcement */
  announcementAttachments: (id: string) => ['announcementAttachments', id] as const,

  /** All events - global calendar events */
  events: ['events'] as const,
  /** Single event by ID */
  event: (id: string) => ['event', id] as const,

  /** Field trips requiring authorization */
  fieldTrips: {
    all: ['fieldTrips'] as const,
    pending: (userId: string) => ['fieldTrips', 'pending', userId] as const,
  },
  /** Single field trip by ID */
  fieldTrip: (id: string) => ['fieldTrip', id] as const,
  /** Field trip student record by ID */
  fieldTripStudent: (id: string) => ['fieldTripStudent', id] as const,
  /** Field trip students for a guardian's children */
  fieldTripStudents: (userId: string, childId?: string) =>
    ['fieldTripStudents', userId, childId] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // USER-SCOPED DATA (include userId for cache isolation)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Message recipients - user's inbox
   * - `.all`: Base key for prefix invalidation (use sparingly)
   * - `.user(userId)`: User's message inbox
   * - `.filtered(userId, childId, filterMode)`: Filtered view
   */
  messageRecipients: {
    all: ['messageRecipients'] as const,
    user: (userId: string) => ['messageRecipients', userId] as const,
    filtered: (userId: string, childId?: string, filterMode?: string) =>
      ['messageRecipients', userId, childId, filterMode] as const,
  },

  /**
   * Conversations - WhatsApp-style chat threads
   * - `.all`: Base key for prefix invalidation
   * - `.user(userId)`: User's conversation list
   */
  conversations: {
    all: ['conversations'] as const,
    user: (userId: string) => ['conversations', userId] as const,
  },
  /** Single conversation metadata by ID */
  conversation: (id: string) => ['conversation', id] as const,
  /** Messages within a specific conversation */
  conversationMessages: (id: string) => ['conversationMessages', id] as const,

  /**
   * Pickup requests - early dismissal requests
   * - `.all`: Base key
   * - `.user(userId)`: User's pickup requests
   * - `.filtered(userId, childId)`: Filtered by child
   */
  pickupRequests: {
    all: ['pickupRequests'] as const,
    user: (userId: string) => ['pickupRequests', userId] as const,
    filtered: (userId: string, childId?: string) =>
      ['pickupRequests', userId, childId] as const,
  },

  /**
   * Reports - report cards and documents
   * - `.all`: Base key
   * - `.user(userId)`: User's children's reports
   */
  reports: {
    all: ['reports'] as const,
    user: (userId: string) => ['reports', userId] as const,
  },

  /**
   * Children - linked students for the current user
   * - `.all`: Base key
   * - `.user(userId)`: User's linked children
   */
  children: {
    all: ['children'] as const,
    user: (userId: string) => ['children', userId] as const,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USER ACTIONS & STATE (always user-scoped)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Read status tracking by content type
   * @param type - Content type ('announcements', 'messages', etc.)
   * @param userId - User ID for cache isolation
   */
  readIds: (type: string, userId: string) => ['readIds', type, userId] as const,

  /** User's pinned announcements */
  pinnedAnnouncements: (userId: string) => ['pinnedAnnouncements', userId] as const,
  /** User's archived announcements */
  archivedAnnouncements: (userId: string) => ['archivedAnnouncements', userId] as const,
  /** User's acknowledged announcements */
  acknowledgedAnnouncements: (userId: string) => ['acknowledgedAnnouncements', userId] as const,
  /**
   * Combined announcement states (pinned, archived, acknowledged)
   * Use this for efficient single-query state fetching
   */
  announcementStates: (userId: string) => ['announcementStates', userId] as const,
};
