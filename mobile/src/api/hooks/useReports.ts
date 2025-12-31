import { useQuery } from '@tanstack/react-query';
import { readItems } from '@directus/sdk';
import { directus, Report } from '../directus';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../context/ChildrenContext';
import { queryKeys } from './queryKeys';

// Fetch reports/boletines
export function useReports() {
  const { user } = useAuth();
  const { children, selectedChildId } = useChildren();
  const userId = user?.id ?? '';

  return useQuery({
    // Include userId in key to scope cache per user
    queryKey: [...queryKeys.reports.user(userId), selectedChildId],
    queryFn: async () => {
      if (!children.length) return [];

      const studentIds = selectedChildId
        ? [selectedChildId]
        : children.map(c => c.id);

      const items = await directus.request(
        readItems('reports', {
          filter: {
            student_id: { _in: studentIds },
            visible_to_parents: { _eq: true },
            published_at: { _nnull: true },
          },
          sort: ['-published_at'],
          limit: 50,
        })
      );

      return items as Report[];
    },
    enabled: children.length > 0,
  });
}
