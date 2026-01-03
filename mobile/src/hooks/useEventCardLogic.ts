/**
 * useEventCardLogic - Shared logic for the unified EventCard component
 *
 * Provides date formatting, color calculations, and accessibility
 * labels for the cross-platform EventCard.tsx
 */
import { useMemo } from 'react';
import { Event } from '../api/frappe';
import { COLORS } from '../theme';
import {
  getPastelColor,
  formatEventMonth,
  formatEventDay,
  formatTime,
  formatFullDate,
} from '../utils';
import { EventStatus, CTAConfig, EVENT_CTA_CONFIG } from '../types/events';

export interface UseEventCardLogicProps {
  event: Event;
  childColor?: string;
  status: EventStatus;
  isUnread?: boolean;
  childName?: string;
}

export interface UseEventCardLogicReturn {
  formatMonth: typeof formatEventMonth;
  formatDay: typeof formatEventDay;
  formatTime: typeof formatTime;
  formatFullDate: typeof formatFullDate;
  dateBlockBgColor: string;
  dateBlockTextColor: string;
  accessibilityLabel: string;
  isPast: boolean;
  isCancelled: boolean;
  isPending: boolean;
  ctaConfig: CTAConfig | undefined;
}

/**
 * Calculate date block colors based on child color
 * Uses soft pastel background with strong text for visual consistency
 */
function getDateBlockColors(childColor?: string): {
  bgColor: string;
  textColor: string;
} {
  return {
    bgColor: childColor ? getPastelColor(childColor, 0.2) : COLORS.primaryLight,
    textColor: childColor || COLORS.primary,
  };
}

/**
 * Build accessibility label for screen readers
 */
function buildAccessibilityLabel(
  event: Event,
  childName?: string,
  isPending?: boolean,
  isCancelled?: boolean,
  isUnread?: boolean
): string {
  return [
    event.title,
    formatFullDate(event.start_date),
    formatTime(event.start_date),
    event.location_external ? `en ${event.location_external}` : null,
    childName ? `para ${childName}` : null,
    isPending ? 'pendiente de respuesta' : null,
    isCancelled ? 'cancelado' : null,
    isUnread ? 'no leido' : null,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Hook that provides shared logic for EventCard components
 *
 * @param props - Event card properties
 * @returns Formatted values, colors, and derived state for rendering
 */
export function useEventCardLogic({
  event,
  childColor,
  status,
  isUnread = false,
  childName,
}: UseEventCardLogicProps): UseEventCardLogicReturn {
  // Derive status flags
  const isPast = status === 'past';
  const isCancelled = status === 'cancelled';
  const isPending = status === 'pending';

  // Get CTA configuration for this status
  const ctaConfig = EVENT_CTA_CONFIG[status];

  // Calculate date block colors (memoized)
  const { bgColor: dateBlockBgColor, textColor: dateBlockTextColor } = useMemo(
    () => getDateBlockColors(childColor),
    [childColor]
  );

  // Build accessibility label (memoized)
  const accessibilityLabel = useMemo(
    () => buildAccessibilityLabel(event, childName, isPending, isCancelled, isUnread),
    [event, childName, isPending, isCancelled, isUnread]
  );

  return {
    formatMonth: formatEventMonth,
    formatDay: formatEventDay,
    formatTime,
    formatFullDate,
    dateBlockBgColor,
    dateBlockTextColor,
    accessibilityLabel,
    isPast,
    isCancelled,
    isPending,
    ctaConfig,
  };
}
