/**
 * Web-optimized card components
 *
 * These cards are designed for web grid layouts with:
 * - Hover effects instead of touch feedback
 * - CSS transitions for smooth animations
 * - Grid-friendly fixed heights
 * - Action buttons revealed on hover
 *
 * Note: EventCard is now unified (handles both mobile and web).
 * WebEventCard is re-exported for backwards compatibility.
 */

// EventCard is now unified (handles both mobile and web).
// WebEventCard is re-exported for backwards compatibility.
export { default as WebEventCard } from './WebEventCard';
export type { EventStatus } from '../../EventCard';

export { WebAnnouncementCard } from './WebAnnouncementCard';

export {
  ResponsiveCardGrid,
  ResponsiveCardList,
  TwoColumnGrid,
  ThreeColumnGrid,
  MasterDetailLayout,
} from './ResponsiveCardGrid';
