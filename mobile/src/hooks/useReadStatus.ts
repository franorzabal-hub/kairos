import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getReadIds, markAsRead as markAsReadService, ContentType } from '../services/readStatusService';

// Re-export ContentType for convenience
export type { ContentType } from '../services/readStatusService';

/**
 * Hook to track read status for a content type.
 * Returns the set of read IDs and functions to check/mark items as read.
 * Automatically refreshes when the screen comes back into focus.
 */
export function useReadStatus(type: ContentType) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const loadReadIds = useCallback(async () => {
    const ids = await getReadIds(type);
    setReadIds(ids);
    setIsLoaded(true);
  }, [type]);

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
    // Optimistic update
    setReadIds(prev => new Set([...prev, id]));
    // Persist to storage
    await markAsReadService(type, id);
  }, [type]);

  // Filter items to only unread ones
  const filterUnread = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    return items.filter(item => !readIds.has(item.id));
  }, [readIds]);

  // Count unread items
  const countUnread = useCallback(<T extends { id: string }>(items: T[]): number => {
    return items.filter(item => !readIds.has(item.id)).length;
  }, [readIds]);

  return {
    readIds,
    isLoaded,
    isRead,
    markAsRead,
    filterUnread,
    countUnread,
  };
}
