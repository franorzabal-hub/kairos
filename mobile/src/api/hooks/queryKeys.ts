// Centralized query keys for React Query cache management
// All keys are typed tuples for type-safe invalidation
//
// KEY DESIGN PRINCIPLES:
// 1. Global data (shared across users): Use simple keys like ['announcements']
// 2. User-scoped data: Include userId in the key for proper cache isolation
// 3. Invalidation: Use exact keys when possible, base keys for prefix matching

export const queryKeys = {
  // Organization (shared data)
  organization: (id: string) => ['organization', id] as const,

  // Announcements (shared content, user can view all)
  announcements: ['announcements'] as const,
  announcement: (id: string) => ['announcement', id] as const,
  announcementAttachments: (id: string) => ['announcementAttachments', id] as const,

  // Events (shared content)
  events: ['events'] as const,
  event: (id: string) => ['event', id] as const,

  // Messages - user-scoped (each user sees their own inbox)
  messageRecipients: {
    all: ['messageRecipients'] as const,
    user: (userId: string) => ['messageRecipients', userId] as const,
    filtered: (userId: string, childId?: string, filterMode?: string) =>
      ['messageRecipients', userId, childId, filterMode] as const,
  },

  // Conversations - user-scoped
  conversations: {
    all: ['conversations'] as const,
    user: (userId: string) => ['conversations', userId] as const,
  },
  conversation: (id: string) => ['conversation', id] as const,
  conversationMessages: (id: string) => ['conversationMessages', id] as const,

  // Pickup requests - user-scoped
  pickupRequests: {
    all: ['pickupRequests'] as const,
    user: (userId: string) => ['pickupRequests', userId] as const,
    filtered: (userId: string, childId?: string) =>
      ['pickupRequests', userId, childId] as const,
  },

  // Reports - user-scoped (parents see their children's reports)
  reports: {
    all: ['reports'] as const,
    user: (userId: string) => ['reports', userId] as const,
  },

  // Children - user-scoped
  children: {
    all: ['children'] as const,
    user: (userId: string) => ['children', userId] as const,
  },

  // Read status - user-scoped (already correct)
  readIds: (type: string, userId: string) => ['readIds', type, userId] as const,

  // Announcement actions - user-scoped (already correct)
  pinnedAnnouncements: (userId: string) => ['pinnedAnnouncements', userId] as const,
  archivedAnnouncements: (userId: string) => ['archivedAnnouncements', userId] as const,
  acknowledgedAnnouncements: (userId: string) => ['acknowledgedAnnouncements', userId] as const,
  announcementStates: (userId: string) => ['announcementStates', userId] as const,
};
