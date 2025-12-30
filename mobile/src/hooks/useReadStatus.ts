import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getReadIds, markAsRead as markAsReadService, markAsUnread as markAsUnreadService, ContentType } from '../services/readStatusService';
import { useAuth } from '../context/AppContext';

// Re-export ContentType for convenience
export type { ContentType } from '../services/readStatusService';

/**
 * @deprecated Use `useContentReadStatus` from '../api/hooks' instead.
 * This hook uses local state while useContentReadStatus uses React Query,
 * providing better caching and shared state across components.
 *
 * Hook to track read status for a content type.
 * Returns the set of read IDs and functions to check/mark items as read.
 * Automatically refreshes when the screen comes back into focus.
 * Read status is persisted to the database (syncs across devices).
 */
export function useReadStatus(type: ContentType) {
  const { user } = useAuth();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const loadReadIds = useCallback(async () => {
    if (!user?.id) {
      setIsLoaded(true);
      return;
    }
    const ids = await getReadIds(type, user.id);
    setReadIds(ids);
    setIsLoaded(true);
  }, [type, user?.id]);

  // Load read IDs on mount
  useEffect(() => {
    loadReadIds();
  }, [loadReadIds]);

  // Reload read IDs when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadReadIds();
    }, [loadReadIds])
  );

  // Check if an item is read
  const isRead = useCallback((id: string): boolean => {
    return readIds.has(id);
  }, [readIds]);

  // Mark an item as read (updates local state immediately)
  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return;
    // Optimistic update
    setReadIds(prev => new Set([...prev, id]));
    // Persist to database
    await markAsReadService(type, id, user.id);
  }, [type, user?.id]);

  // Mark an item as unread (updates local state immediately)
  const markAsUnread = useCallback(async (id: string) => {
    if (!user?.id) return;
    // Optimistic update
    setReadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    // Persist to database
    await markAsUnreadService(type, id, user.id);
  }, [type, user?.id]);

  // Filter items to only unread ones
  const filterUnread = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    return items.filter(item => !readIds.has(item.id));
  }, [readIds]);

  // Count unread items
  const countUnread = useCallback(<T extends { id: string }>(items: T[]): number => {
    return items.filter(item => !readIds.has(item.id)).length;
  }, [readIds]);

  // Refresh read status from database
  const refresh = useCallback(() => {
    loadReadIds();
  }, [loadReadIds]);

  return {
    readIds,
    isLoaded,
    isRead,
    markAsRead,
    markAsUnread,
    filterUnread,
    countUnread,
    refresh,
  };
}
