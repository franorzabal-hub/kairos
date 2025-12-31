/**
 * Web-optimized card components
 *
 * These cards are designed for web grid layouts with:
 * - Hover effects instead of touch feedback
 * - CSS transitions for smooth animations
 * - Grid-friendly fixed heights
 * - Action buttons revealed on hover
 */

export { WebEventCard } from './WebEventCard';
export type { EventStatus } from './WebEventCard';

export { WebAnnouncementCard } from './WebAnnouncementCard';

export {
  ResponsiveCardGrid,
  ResponsiveCardList,
  TwoColumnGrid,
  ThreeColumnGrid,
  MasterDetailLayout,
} from './ResponsiveCardGrid';
