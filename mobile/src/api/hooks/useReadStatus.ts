import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';
import {
  getReadIds as getReadIdsService,
  markAsRead as markAsReadService,
  markAsUnread as markAsUnreadService,
  ContentType,
} from '../../services/readStatusService';
import { logger } from '../../utils/logger';

// Re-export ContentType for convenience
export type { ContentType } from '../../services/readStatusService';

/**
 * Fetch read IDs for a content type using React Query.
 * This ensures shared cache across all screens.
 */
export function useReadIds(type: ContentType) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.readIds(type, userId ?? ''),
    queryFn: async () => {
      if (!userId) return new Set<string>();
      return getReadIdsService(type, userId);
    },
    enabled: !!userId,
    staleTime: 0, // Always refetch on focus
  });
}

/**
 * Mark an item as read - updates the database and invalidates the cache
 */
export function useMarkAsRead(type: ContentType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      await markAsReadService(type, id, userId);
    },
    onMutate: async (id: string) => {
      // Optimistic update: add to local cache immediately
      if (!userId) return;
      const queryKey = queryKeys.readIds(type, userId);
      await queryClient.cancelQueries({ queryKey });

      const previousReadIds = queryClient.getQueryData<Set<string>>(queryKey);

      queryClient.setQueryData<Set<string>>(queryKey, (old) => {
        const next = new Set(old ?? []);
        next.add(id);
        return next;
      });

      return { previousReadIds };
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (!userId || !context?.previousReadIds) return;
      queryClient.setQueryData(queryKeys.readIds(type, userId), context.previousReadIds);
      logger.error('Failed to mark item as read', { error, type });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.readIds(type, userId) });
    },
  });
}

/**
 * Mark an item as unread - updates the database and invalidates the cache
 */
export function useMarkAsUnread(type: ContentType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      await markAsUnreadService(type, id, userId);
    },
    onMutate: async (id: string) => {
      // Optimistic update: remove from local cache immediately
      if (!userId) return;
      const queryKey = queryKeys.readIds(type, userId);
      await queryClient.cancelQueries({ queryKey });

      const previousReadIds = queryClient.getQueryData<Set<string>>(queryKey);

      queryClient.setQueryData<Set<string>>(queryKey, (old) => {
        const next = new Set(old ?? []);
        next.delete(id);
        return next;
      });

      return { previousReadIds };
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (!userId || !context?.previousReadIds) return;
      queryClient.setQueryData(queryKeys.readIds(type, userId), context.previousReadIds);
      logger.error('Failed to mark item as unread', { error, type });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.readIds(type, userId) });
    },
  });
}

/**
 * Combined hook for read status management.
 * Provides read IDs, check function, and mark functions.
 * All functions are memoized with useCallback to prevent infinite loops in useEffect.
 */
export function useContentReadStatus(type: ContentType) {
  const { data, isLoading } = useReadIds(type);
  // Ensure readIds is always a Set, even during initial load
  const readIds = data instanceof Set ? data : new Set<string>();
  const markAsReadMutation = useMarkAsRead(type);
  const markAsUnreadMutation = useMarkAsUnread(type);

  const isRead = useCallback((id: string): boolean => {
    return readIds.has(id);
  }, [readIds]);

  const markAsRead = useCallback(async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  }, [markAsReadMutation]);

  const markAsUnread = useCallback(async (id: string) => {
    await markAsUnreadMutation.mutateAsync(id);
  }, [markAsUnreadMutation]);

  const filterUnread = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    return items.filter(item => !readIds.has(item.id));
  }, [readIds]);

  const countUnread = useCallback(<T extends { id: string }>(items: T[]): number => {
    return items.filter(item => !readIds.has(item.id)).length;
  }, [readIds]);

  return {
    readIds,
    isLoading,
    isRead,
    markAsRead,
    markAsUnread,
    filterUnread,
    countUnread,
  };
}
