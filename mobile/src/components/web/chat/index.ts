/**
 * Web-optimized chat components
 *
 * These components are designed for web with:
 * - Hover effects instead of touch feedback
 * - Dropdown menus instead of Alert.alert
 * - Keyboard shortcuts (Enter to send)
 * - Optimized for master-detail layouts
 */

// ConversationCard is now unified - re-export from conversation module for backwards compatibility
export { ConversationCard as WebConversationCard } from '../../conversation';

// MessageInput is now unified and exported from the main chat components
// Re-export for backwards compatibility
export { default as MessageInput } from '../../chat/MessageInput';
