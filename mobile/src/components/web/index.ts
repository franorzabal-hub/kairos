/**
 * Web-specific components
 *
 * These components are only rendered on web platform.
 * On mobile, they either render nothing or pass children through.
 */

// Layout components
export { WebLayout } from './WebLayout';
export { WebSidebar } from './WebSidebar';
export { WebHeader } from './WebHeader';

// Card components (web-optimized with hover effects)
export {
  WebEventCard,
  WebAnnouncementCard,
  ResponsiveCardGrid,
  ResponsiveCardList,
  TwoColumnGrid,
  ThreeColumnGrid,
  MasterDetailLayout,
} from './cards';
export type { EventStatus } from './cards';

// Chat components (web-optimized)
// Note: ConversationCard and MessageInput are now unified and handle both mobile and web
// WebConversationCard is re-exported for backwards compatibility
export { WebConversationCard } from './chat';
export { WebFooter } from './WebFooter';
