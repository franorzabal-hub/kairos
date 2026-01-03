import { useQuery } from '@tanstack/react-query';
import {
  getDocList,
  getDoc,
  SchoolEvent,
  FrappeFilter,
} from '../frappe';
import { useChildren } from '../../context/ChildrenContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';

// Fetch events (School Event in Frappe)
export function useEvents() {
  const { user } = useAuth();
  const { selectedChildId } = useChildren();
  const { filterMode } = useUI();

  return useQuery({
    queryKey: [...queryKeys.events, selectedChildId, filterMode, user?.organization_id],
    queryFn: async () => {
      const filters: FrappeFilter[] = [
        ['status', '=', 'Published'],
      ];

      // Multi-tenant isolation: filter by institution
      if (user?.organization_id) {
        filters.push(['institution', '=', user.organization_id]);
      }

      const items = await getDocList<SchoolEvent>('School Event', {
        fields: ['*'],
        filters,
        orderBy: { field: 'start_datetime', order: 'asc' },
        limit: 50,
      });

      return items;
    },
    enabled: !!user?.organization_id,
  });
}

// Fetch single event (School Event in Frappe)
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => {
      if (!id) return null;
      const item = await getDoc<SchoolEvent>('School Event', id);
      return item;
    },
    enabled: !!id,
  });
}
