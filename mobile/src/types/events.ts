/**
 * Shared event types for EventCard components (mobile and web)
 */
import { COLORS } from '../theme';

/**
 * Event status representing the current state of an event from the user's perspective
 */
export type EventStatus =
  | 'pending'      // Requires confirmation, not yet confirmed
  | 'confirmed'    // Confirmed attendance
  | 'declined'     // Declined attendance
  | 'info'         // Informational only, no action needed
  | 'cancelled'    // Event cancelled by school
  | 'past';        // Past event

/**
 * CTA button configuration for event cards
 */
export interface CTAConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

/**
 * CTA configuration mapping by event status
 * Only statuses with actionable CTAs are included
 */
export const EVENT_CTA_CONFIG: Partial<Record<EventStatus, CTAConfig>> = {
  pending: {
    label: 'Responder',
    bgColor: COLORS.warningLight,
    textColor: COLORS.warning,
  },
  confirmed: {
    label: '✓ Confirmado',
    bgColor: COLORS.successLight,
    textColor: COLORS.success,
  },
  declined: {
    label: 'Declinado',
    bgColor: COLORS.errorLight,
    textColor: COLORS.error,
  },
};
