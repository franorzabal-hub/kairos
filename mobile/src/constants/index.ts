/**
 * Application constants
 * Centralizes magic strings and configuration values
 */

/**
 * Content type identifiers for read status tracking and notifications.
 * These match the ContentType union in readStatusService.
 */
export const CONTENT_TYPES = {
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  CAMBIOS: 'cambios',
  BOLETINES: 'boletines',
} as const;

/**
 * Frappe DocType names for API queries.
 * Matches the collection names in the Frappe schema.
 */
export const COLLECTIONS = {
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  REPORTS: 'reports',
  CONVERSATIONS: 'conversations',
  CONVERSATION_MESSAGES: 'conversation_messages',
  CONVERSATION_PARTICIPANTS: 'conversation_participants',
  MESSAGE_RECIPIENTS: 'message_recipients',
  STUDENTS: 'students',
  STUDENT_GUARDIANS: 'student_guardians',
  ORGANIZATIONS: 'organizations',
  ANNOUNCEMENT_STATES: 'announcement_states',
  PICKUP_REQUESTS: 'pickup_requests',
} as const;

/**
 * AsyncStorage keys for persistent data.
 */
export const STORAGE_KEYS = {
  READ_STATUS_PREFIX: '@kairos_read_',
  PINNED_PREFIX: '@kairos_pinned_',
  ARCHIVED_PREFIX: '@kairos_archived_',
  ACKNOWLEDGED_PREFIX: '@kairos_ack_',
} as const;

/**
 * Query stale times (in milliseconds).
 */
export const STALE_TIMES = {
  SHORT: 1000 * 60 * 1, // 1 minute
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 60, // 1 hour
} as const;

// Type helpers for the constants
export type ContentTypeValue = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
