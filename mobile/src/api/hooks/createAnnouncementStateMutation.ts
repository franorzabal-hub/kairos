import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../../context/AppContext';
import { queryKeys } from './queryKeys';

// Type for the announcement states cache
export type AnnouncementStatesCache = {
  pinnedIds: Set<string>;
  archivedIds: Set<string>;
  acknowledgedIds: Set<string>;
};

// Which Set field to update
export type StateField = 'pinnedIds' | 'archivedIds' | 'acknowledgedIds';

// Operation to perform on the Set
export type StateOperation = 'add' | 'delete';

interface CreateMutationOptions {
  /** The service function to call (e.g., pinAnnouncement) */
  serviceFn: (announcementId: string, userId: string) => Promise<void>;
  /** Which Set field to update in the cache */
  stateField: StateField;
  /** Whether to add or delete from the Set */
  operation: StateOperation;
}

/**
 * Factory function for creating announcement state mutations.
 * Reduces boilerplate by encapsulating the common pattern of:
 * - Calling a service function
 * - Optimistically updating a Set in the cache
 * - Rolling back on error
 * - Invalidating queries on success
 *
 * @example
 * const pinMutation = useAnnouncementStateMutation({
 *   serviceFn: pinAnnouncement,
 *   stateField: 'pinnedIds',
 *   operation: 'add',
 * });
 */
export function useAnnouncementStateMutation({
  serviceFn,
  stateField,
  operation,
}: CreateMutationOptions) {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!userId) throw new Error('User not authenticated');
      await serviceFn(announcementId, userId);
    },

    onMutate: async (announcementId: string) => {
      if (!userId) return;

      const queryKey = queryKeys.announcementStates(userId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<AnnouncementStatesCache>(queryKey);

      queryClient.setQueryData(queryKey, (old: AnnouncementStatesCache | undefined) => {
        if (!old) return old;
        const newSet = new Set(old[stateField]);
        if (operation === 'add') {
          newSet.add(announcementId);
        } else {
          newSet.delete(announcementId);
        }
        return { ...old, [stateField]: newSet };
      });

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (!userId || !context?.previous) return;
      queryClient.setQueryData(queryKeys.announcementStates(userId), context.previous);
    },

    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.announcementStates(userId) });
    },
  });
}
