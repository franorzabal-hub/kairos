// Barrel file for API hooks
// Provides a single import point for all data-fetching hooks

// Query keys (for cache management)
export { queryKeys } from './queryKeys';

// Organization
export { useOrganization } from './useOrganization';

// Children
export { useChildren } from './useChildren';

// Announcements
export {
  useAnnouncements,
  useAnnouncement,
  useAnnouncementAttachments,
} from './useAnnouncements';

// Announcement actions (pin, archive, acknowledge)
export {
  useAnnouncementStates,
  useNormalizedAnnouncementStates,
  useAnnouncementPin,
  useAnnouncementArchive,
  useAnnouncementAcknowledge,
} from './useAnnouncementActions';

// Events
export { useEvents, useEvent } from './useEvents';

// Messages
export {
  useMessages,
  useMarkMessageRead,
  type MessageWithReadStatus,
} from './useMessages';

// Pickup requests
export {
  usePickupRequests,
  useCreatePickupRequest,
  useUpdatePickupRequest,
} from './usePickupRequests';

// Reports
export { useReports } from './useReports';

// Conversations
export {
  useConversations,
  useConversation,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  useCloseConversation,
  useReopenConversation,
  useToggleParticipantReply,
  useToggleParticipantBlocked,
  useMuteConversation,
  useArchiveConversation,
  useUnarchiveConversation,
  useCreateConversation,
  type ConversationWithMeta,
  type CreateConversationParams,
} from './useConversations';

// Read status
export {
  useReadIds,
  useMarkAsRead,
  useMarkAsUnread,
  useContentReadStatus,
  type ContentType,
} from './useReadStatus';

// Invitations
export {
  useInvitation,
  useAcceptInvitation,
  invitationQueryKeys,
  type InvitationDetails,
  type InvitationStudent,
  type AcceptInvitationParams,
  type AcceptInvitationResult,
} from './useInvitation';
