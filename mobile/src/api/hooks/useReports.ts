import { useQuery } from '@tanstack/react-query';
import { getDocList, Report } from '../frappe';
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

      const studentNames = selectedChildId
        ? [selectedChildId]
        : children.map(c => c.name);

      const items = await getDocList<Report>('Report', {
        filters: [
          ['student', 'in', studentNames],
          ['visible_to_parents', '=', true],
          ['published_at', 'is', 'set'],
        ],
        orderBy: { field: 'published_at', order: 'desc' },
        limit: 50,
      });

      return items;
    },
    enabled: children.length > 0,
  });
}
