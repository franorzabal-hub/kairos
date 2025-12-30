/**
 * Centralized theme configuration for Kairos mobile app
 * All screens should import colors, typography, and spacing from here
 */

export const COLORS = {
  // Brand colors
  primary: '#8B1538',
  primaryLight: '#F5E6EA',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale
  gray: '#666666',
  lightGray: '#F5F5F5',
  darkGray: '#333333',

  // Borders and dividers
  border: '#E0E0E0',

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Semantic colors
  unreadBackground: '#F5E6EA', // primaryLight - for unread message backgrounds
  calendarHighlight: '#E3F2FD',

  // UI element colors
  pillBackground: '#F2F2F7', // iOS-style pill background
  pillActive: '#007AFF', // iOS blue for active pills

  // iOS tab bar colors
  tabActive: '#007AFF', // iOS system blue for active tabs
  tabInactive: '#8E8E93', // iOS system gray for inactive tabs
  tabBadge: '#FF3B30', // iOS red for notification badges
} as const;

export const TYPOGRAPHY = {
  // Screen header (App Store style)
  screenTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },

  // Section headers
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },

  // Card titles
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },

  // List item titles
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  listItemTitleBold: {
    fontSize: 16,
    fontWeight: '700' as const,
  },

  // Body text
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },

  // Small/meta text
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },

  // Badge text
  badge: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  badgeSmall: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,

  // Specific spacings
  screenPadding: 16,
  cardPadding: 16,
  listItemPadding: 14,

  // Bottom padding for screens (to account for blur tab bar)
  tabBarOffset: 100,
} as const;

export const BORDERS = {
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  width: {
    thin: 1,
    medium: 2,
    thick: 4,
  },
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

// Unread indicator styles - use these consistently across screens
export const UNREAD_STYLES = {
  // Left border accent (used on cards/rows)
  borderLeft: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  // Dot indicator
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  // Small dot (inline with text)
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  // Background highlight
  background: {
    backgroundColor: COLORS.unreadBackground,
  },
} as const;

// Badge presets
export const BADGE_STYLES = {
  // "NUEVO" badge
  new: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDERS.radius.sm,
  },
  // Type/category badge
  type: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDERS.radius.sm,
  },
  // Status badges
  statusApproved: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDERS.radius.sm,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDERS.radius.sm,
  },
  statusRejected: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDERS.radius.sm,
  },
} as const;

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDERS,
  SHADOWS,
  UNREAD_STYLES,
  BADGE_STYLES,
};
