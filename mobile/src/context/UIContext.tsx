/**
 * UIContext - Focused context for UI state
 *
 * Handles:
 * - Filter mode for lists (unread, all, pinned, archived)
 * - Unread counts for tabs/badges
 */
import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';

// Extended filter mode for Novedades (announcements)
// 'all' = show everything except archived
// 'unread' = show only unread (non-archived)
// 'pinned' = show only user-pinned items
// 'archived' = show only archived items
export type FilterMode = 'unread' | 'all' | 'pinned' | 'archived';

interface UnreadCounts {
  inicio: number;      // Combined novedades + upcoming events
  agenda: number;      // All events
  mensajes: number;
  mishijos: number;    // Reports + attendance
  // Legacy keys for backwards compatibility
  novedades: number;
  eventos: number;
  cambios: number;
  boletines: number;
}

interface UIContextType {
  // Filter state
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;

  // Unread counts per tab (new 4-tab structure)
  unreadCounts: UnreadCounts;
  setUnreadCounts: (counts: Partial<UnreadCounts>) => void;
  resetUnreadCounts: () => void;
}

const defaultUnreadCounts: UnreadCounts = {
  inicio: 0,
  agenda: 0,
  mensajes: 0,
  mishijos: 0,
  // Legacy keys
  novedades: 0,
  eventos: 0,
  cambios: 0,
  boletines: 0,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [filterMode, setFilterMode] = useState<FilterMode>('unread');
  const [unreadCounts, setUnreadCountsState] = useState<UnreadCounts>(defaultUnreadCounts);

  const setUnreadCounts = useCallback((counts: Partial<UnreadCounts>) => {
    setUnreadCountsState(prev => ({ ...prev, ...counts }));
  }, []);

  const resetUnreadCounts = useCallback(() => {
    setUnreadCountsState(defaultUnreadCounts);
  }, []);

  const contextValue = useMemo<UIContextType>(() => ({
    filterMode,
    setFilterMode,
    unreadCounts,
    setUnreadCounts,
    resetUnreadCounts,
  }), [filterMode, unreadCounts, setUnreadCounts, resetUnreadCounts]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

// Convenience hooks
export function useFilters() {
  const { filterMode, setFilterMode } = useUI();
  return { filterMode, setFilterMode };
}

export function useUnreadCounts() {
  const { unreadCounts, setUnreadCounts, resetUnreadCounts } = useUI();
  return { unreadCounts, setUnreadCounts, resetUnreadCounts };
}

export { UIContext };
