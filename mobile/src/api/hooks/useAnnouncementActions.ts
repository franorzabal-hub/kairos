import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';
import {
  useAnnouncementStateMutation,
  type AnnouncementStatesCache,
} from './createAnnouncementStateMutation';
import {
  pinAnnouncement,
  unpinAnnouncement,
  archiveAnnouncement,
  unarchiveAnnouncement,
  acknowledgeAnnouncement,
  getAllUserAnnouncementStates,
} from '../../services/announcementActionsService';

/**
 * Fetch all user announcement states (pinned, archived, acknowledged) in one call.
 * Use this for the main feed to determine item states.
 */
export function useAnnouncementStates() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.announcementStates(userId ?? ''),
    queryFn: async () => {
      if (!userId) {
        return {
          pinnedIds: new Set<string>(),
          archivedIds: new Set<string>(),
          acknowledgedIds: new Set<string>(),
        };
      }
      return getAllUserAnnouncementStates(userId);
    },
    enabled: !!userId,
    staleTime: 0,
  });
}

/**
 * Hook for pinning/unpinning announcements.
 * Uses the mutation factory to reduce boilerplate.
 */
export function useAnnouncementPin() {
  const pinMutation = useAnnouncementStateMutation({
    serviceFn: pinAnnouncement,
    stateField: 'pinnedIds',
    operation: 'add',
  });

  const unpinMutation = useAnnouncementStateMutation({
    serviceFn: unpinAnnouncement,
    stateField: 'pinnedIds',
    operation: 'delete',
  });

  const isPinned = useCallback(
    (announcementId: string, pinnedIds: Set<string>): boolean => {
      return pinnedIds.has(announcementId);
    },
    []
  );

  const togglePin = useCallback(
    async (announcementId: string, currentlyPinned: boolean) => {
      if (currentlyPinned) {
        await unpinMutation.mutateAsync(announcementId);
      } else {
        await pinMutation.mutateAsync(announcementId);
      }
    },
    [pinMutation, unpinMutation]
  );

  return {
    pin: pinMutation.mutateAsync,
    unpin: unpinMutation.mutateAsync,
    togglePin,
    isPinned,
    isPinning: pinMutation.isPending,
    isUnpinning: unpinMutation.isPending,
  };
}

/**
 * Hook for archiving/unarchiving announcements.
 * Uses the mutation factory to reduce boilerplate.
 */
export function useAnnouncementArchive() {
  const archiveMutation = useAnnouncementStateMutation({
    serviceFn: archiveAnnouncement,
    stateField: 'archivedIds',
    operation: 'add',
  });

  const unarchiveMutation = useAnnouncementStateMutation({
    serviceFn: unarchiveAnnouncement,
    stateField: 'archivedIds',
    operation: 'delete',
  });

  const isArchived = useCallback(
    (announcementId: string, archivedIds: Set<string>): boolean => {
      return archivedIds.has(announcementId);
    },
    []
  );

  const toggleArchive = useCallback(
    async (announcementId: string, currentlyArchived: boolean) => {
      if (currentlyArchived) {
        await unarchiveMutation.mutateAsync(announcementId);
      } else {
        await archiveMutation.mutateAsync(announcementId);
      }
    },
    [archiveMutation, unarchiveMutation]
  );

  return {
    archive: archiveMutation.mutateAsync,
    unarchive: unarchiveMutation.mutateAsync,
    toggleArchive,
    isArchived,
    isArchiving: archiveMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending,
  };
}

/**
 * Hook for acknowledging announcements.
 * Uses the mutation factory to reduce boilerplate.
 */
export function useAnnouncementAcknowledge() {
  const acknowledgeMutation = useAnnouncementStateMutation({
    serviceFn: acknowledgeAnnouncement,
    stateField: 'acknowledgedIds',
    operation: 'add',
  });

  const isAcknowledged = useCallback(
    (announcementId: string, acknowledgedIds: Set<string>): boolean => {
      return acknowledgedIds.has(announcementId);
    },
    []
  );

  return {
    acknowledge: acknowledgeMutation.mutateAsync,
    isAcknowledged,
    isAcknowledging: acknowledgeMutation.isPending,
  };
}
