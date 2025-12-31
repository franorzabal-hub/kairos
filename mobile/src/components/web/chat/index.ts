/**
 * Web-optimized chat components
 *
 * These components are designed for web with:
 * - Hover effects instead of touch feedback
 * - Dropdown menus instead of Alert.alert
 * - Keyboard shortcuts (Enter to send)
 * - Optimized for master-detail layouts
 */

export { WebMessageInput } from './WebMessageInput';
export { WebConversationCard } from './WebConversationCard';

// Re-export mobile components that work on web
// ChatBubble, DateSeparator, and FirstMessageCard are cross-platform
