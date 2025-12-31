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
export { WebFooter } from './WebFooter';

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
export { WebMessageInput, WebConversationCard } from './chat';
