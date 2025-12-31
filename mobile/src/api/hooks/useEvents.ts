import { useQuery } from '@tanstack/react-query';
import { readItems, readItem } from '@directus/sdk';
import { directus, Event } from '../directus';
import { useChildren } from '../../context/ChildrenContext';
import { useUI } from '../../context/UIContext';
import { queryKeys } from './queryKeys';

// Fetch events
export function useEvents() {
  const { selectedChildId } = useChildren();
  const { filterMode } = useUI();

  return useQuery({
    queryKey: [...queryKeys.events, selectedChildId, filterMode],
    queryFn: async () => {
      const filter: any = {
        status: { _eq: 'published' },
      };

      const items = await directus.request(
        readItems('events', {
          filter,
          sort: ['start_date'],
          limit: 50,
        })
      );

      return items as Event[];
    },
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
          fields: ['*', { location_id: ['*'] }] as any,
        })
      );
      return item as unknown as Event;
    },
    enabled: !!id,
  });
}
