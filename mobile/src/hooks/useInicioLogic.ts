/**
 * useInicioLogic - Shared logic for InicioScreen components
 *
 * This hook extracts common logic used by both mobile and web
 * InicioScreen components to reduce code duplication:
 * - Child info resolution for announcements
 * - Announcement filtering (by child, by filterMode)
 * - Announcement sorting (pinned first, then by date)
 * - Upcoming events calculation (next 7 days)
 * - Event formatting functions
 */
import { useMemo, useCallback } from 'react';
import { Announcement, Event, Student } from '../api/directus';
import { FilterMode } from '../context/UIContext';
import { CHILD_COLORS } from '../theme';

/**
 * Props for the useInicioLogic hook
 */
export interface UseInicioLogicProps {
  /** All announcements from the API */
  announcements: Announcement[];
  /** All events from the API */
  events: Event[];
  /** Current filter mode (unread, all, pinned, archived) */
  filterMode: FilterMode;
  /** Currently selected child, or null for "all children" */
  selectedChild: Student | null;
  /** Currently selected child ID (used to determine if viewing all children) */
  selectedChildId: string | null;
  /** All children of the current user */
  children: Student[];
  /** Set of pinned announcement IDs (user-specific) */
  pinnedIds: Set<string>;
  /** Set of archived announcement IDs (user-specific) */
  archivedIds: Set<string>;
  /** Function to filter items by unread status */
  filterUnread: (items: Announcement[]) => Announcement[];
  /** Maximum number of upcoming events to return (default: 3 for mobile, 6 for web) */
  maxUpcomingEvents?: number;
}

/**
 * Child info returned for announcements
 */
export interface ChildInfo {
  /** Child's first name (for display in announcement) */
  name?: string;
  /** Child's assigned color (for visual indicator) */
  color?: string;
}

/**
 * Return value of the useInicioLogic hook
 */
export interface UseInicioLogicReturn {
  /** Filtered and sorted announcements based on current filters */
  filteredAnnouncements: Announcement[];
  /** Events occurring in the next 7 days */
  upcomingEvents: Event[];
  /** Get child name/color for an announcement (for multi-child display) */
  getChildInfo: (announcement: Announcement) => ChildInfo;
  /** Format event date to day number (e.g., "05", "31") */
  formatEventDay: (dateStr: string) => string;
  /** Format event date to month abbreviation (e.g., "ENE", "DIC") */
  formatEventMonth: (dateStr: string) => string;
}

/**
 * Custom hook that extracts shared logic from InicioScreen components.
 *
 * This hook handles:
 * 1. Getting child info for announcements (shows which child it targets)
 * 2. Filtering announcements by selected child and filter mode
 * 3. Sorting announcements (pinned first, then by date)
 * 4. Calculating upcoming events (next 7 days)
 * 5. Formatting event dates for display
 *
 * @example
 * ```tsx
 * const {
 *   filteredAnnouncements,
 *   upcomingEvents,
 *   getChildInfo,
 *   formatEventDay,
 *   formatEventMonth
 * } = useInicioLogic({
 *   announcements,
 *   events,
 *   filterMode,
 *   selectedChild,
 *   selectedChildId,
 *   children,
 *   pinnedIds,
 *   archivedIds,
 *   filterUnread,
 * });
 * ```
 */
export function useInicioLogic({
  announcements,
  events,
  filterMode,
  selectedChild,
  selectedChildId,
  children,
  pinnedIds,
  archivedIds,
  filterUnread,
  maxUpcomingEvents = 3,
}: UseInicioLogicProps): UseInicioLogicReturn {
  /**
   * Get child info for an announcement - shows which child it targets when viewing "Todos"
   *
   * Only returns child info when:
   * 1. Viewing all children (no specific child selected)
   * 2. User has multiple children
   * 3. Announcement targets a specific section
   */
  const getChildInfo = useCallback(
    (announcement: Announcement): ChildInfo => {
      // Only show child indicator when viewing all children and there are multiple
      if (!selectedChildId && children.length > 1) {
        if (announcement.target_type === 'section') {
          const childIndex = children.findIndex(
            (c) => c.section_id === announcement.target_id
          );
          if (childIndex >= 0) {
            return {
              name: children[childIndex].first_name,
              color: CHILD_COLORS[childIndex % CHILD_COLORS.length],
            };
          }
        }
        // Announcements for all children don't get a specific indicator
        return {};
      }
      return {};
    },
    [selectedChildId, children]
  );

  /**
   * Get upcoming events (next 7 days)
   */
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return events
      .filter((event) => {
        const startDate = new Date(event.start_date);
        return startDate >= now && startDate <= weekFromNow;
      })
      .slice(0, maxUpcomingEvents);
  }, [events, maxUpcomingEvents]);

  /**
   * Apply filters and sorting to announcements
   *
   * Filtering order:
   * 1. Filter by selected child (if any)
   * 2. Apply filter mode (unread, all, pinned, archived)
   *
   * Sorting (for non-pinned/archived modes):
   * - Pinned items first
   * - Then by date (most recent first)
   */
  const filteredAnnouncements = useMemo(() => {
    let result = announcements;

    // Filter by selected child first (always applies)
    if (selectedChild) {
      result = result.filter((announcement) => {
        if (announcement.target_type === 'all') return true;
        if (announcement.target_type === 'section') {
          return announcement.target_id === selectedChild.section_id;
        }
        if (announcement.target_type === 'grade') {
          // Check if child's section belongs to the targeted grade
          return selectedChild.section?.grade_id === announcement.target_id;
        }
        return true;
      });
    }

    // Apply filter mode
    switch (filterMode) {
      case 'unread':
        result = filterUnread(result).filter((a) => !archivedIds.has(a.id));
        break;
      case 'all':
        result = result.filter((a) => !archivedIds.has(a.id));
        break;
      case 'pinned':
        result = result.filter((a) => pinnedIds.has(a.id));
        break;
      case 'archived':
        result = result.filter((a) => archivedIds.has(a.id));
        break;
    }

    // Sort: pinned items first (not for pinned/archived filter modes)
    if (filterMode !== 'pinned' && filterMode !== 'archived') {
      result = [...result].sort((a, b) => {
        const aPinned = pinnedIds.has(a.id) || a.is_pinned;
        const bPinned = pinnedIds.has(b.id) || b.is_pinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return (
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime()
        );
      });
    }

    return result;
  }, [announcements, filterMode, filterUnread, selectedChild, pinnedIds, archivedIds]);

  /**
   * Format event day for display (e.g., "05", "31")
   */
  const formatEventDay = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  }, []);

  /**
   * Format event month for display (e.g., "ENE", "DIC")
   * Uses Spanish locale with uppercase formatting
   */
  const formatEventMonth = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    return date
      .toLocaleDateString('es-AR', { month: 'short' })
      .toUpperCase()
      .replace('.', '');
  }, []);

  return {
    filteredAnnouncements,
    upcomingEvents,
    getChildInfo,
    formatEventDay,
    formatEventMonth,
  };
}
