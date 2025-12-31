/**
 * Web-optimized chat components
 *
 * These components are designed for web with:
 * - Hover effects instead of touch feedback
 * - Dropdown menus instead of Alert.alert
 * - Keyboard shortcuts (Enter to send)
 * - Optimized for master-detail layouts
 */

// Export the new web-specific conversation card
export { WebConversationCard } from './WebConversationCard';

// MessageInput is now unified and exported from the main chat components
// Re-export for backwards compatibility
export { default as MessageInput } from '../../chat/MessageInput';