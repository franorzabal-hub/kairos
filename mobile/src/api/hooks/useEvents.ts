import { useQuery } from '@tanstack/react-query';
import { readItems, readItem } from '@directus/sdk';
import { directus, Event } from '../directus';
import { useChildren } from '../../context/ChildrenContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';
import { EventFilter } from '../../types/directus';

// Fetch events
export function useEvents() {
  const { user } = useAuth();
  const { selectedChildId } = useChildren();
  const { filterMode } = useUI();

  return useQuery({
    queryKey: [...queryKeys.events, selectedChildId, filterMode, user?.organization_id],
    queryFn: async () => {
      const filter: EventFilter = {
        status: { _eq: 'published' },
      };

      // Multi-tenant isolation: filter by organization_id
      if (user?.organization_id) {
        filter.organization_id = { _eq: user.organization_id };
      }

      const items = await directus.request(
        readItems('events', {
          filter,
          sort: ['start_date'],
          limit: 50,
        })
      );

      return items as Event[];
    },
    enabled: !!user?.organization_id,
  });
}

// Fetch single event
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => {
      if (!id) return null;
      const item = await directus.request(
        readItem('events', id, {
          // Nested relational fields - SDK type limitation requires 'as any'
          fields: ['*', { location_id: ['*'] }] as any,
        })
      );
      return item as unknown as Event;
    },
    enabled: !!id,
  });
}
