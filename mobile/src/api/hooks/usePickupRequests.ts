import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readItems, createItem, updateItem } from '@directus/sdk';
import { directus, PickupRequest } from '../directus';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../context/ChildrenContext';
import { queryKeys } from './queryKeys';
import { logger } from '../../utils/logger';

// Fetch pickup requests
export function usePickupRequests() {
  const { user } = useAuth();
  const { children, selectedChildId } = useChildren();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.pickupRequests.filtered(userId, selectedChildId ?? undefined),
    queryFn: async () => {
      if (!user?.id || !children.length) return [];

      const studentIds = selectedChildId
        ? [selectedChildId]
        : children.map(c => c.id);

      const items = await directus.request(
        readItems('pickup_requests', {
          filter: {
            student_id: { _in: studentIds },
            requested_by: { _eq: user.id },
          },
          sort: ['-created_at'],
          limit: 50,
        })
      );

      return items as PickupRequest[];
    },
    enabled: !!user?.id && children.length > 0,
  });
}

// Create pickup request
export function useCreatePickupRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (data: Omit<PickupRequest, 'id' | 'created_at' | 'status'>) => {
      const result = await directus.request(
        createItem('pickup_requests', {
          ...data,
          status: 'pending',
        })
      );
      return result;
    },
    onSuccess: () => {
      // Scope invalidation to current user's pickup requests
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pickupRequests.user(userId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to create pickup request', { error });
    },
  });
}

// Update pickup request (for editing pending requests)
export function useUpdatePickupRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<PickupRequest, 'pickup_date' | 'pickup_time' | 'authorized_person' | 'reason' | 'notes'>>;
    }) => {
      const result = await directus.request(
        updateItem('pickup_requests', id, data)
      );
      return result;
    },
    onSuccess: () => {
      // Scope invalidation to current user's pickup requests
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pickupRequests.user(userId) });
      }
    },
    onError: (error) => {
      logger.error('Failed to update pickup request', { error });
    },
  });
}
