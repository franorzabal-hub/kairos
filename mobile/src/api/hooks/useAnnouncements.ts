import { useQuery } from '@tanstack/react-query';
import {
  getDocList,
  getDoc,
  News,
  NewsAttachment,
  FrappeFilter,
} from '../frappe';
import { useChildren } from '../../context/ChildrenContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';

// Fetch announcements (News in Frappe)
export function useAnnouncements() {
  const { user } = useAuth();
  const { children, selectedChildId } = useChildren();
  const { filterMode } = useUI();

  return useQuery({
    queryKey: [...queryKeys.announcements, selectedChildId, filterMode, user?.organization_id],
    queryFn: async () => {
      const filters: FrappeFilter[] = [
        ['status', '=', 'Published'],
      ];

      // Multi-tenant isolation: filter by institution
      if (user?.organization_id) {
        filters.push(['institution', '=', user.organization_id]);
      }

      // If child selected, filter by section or grade
      // For MVP, we fetch all published announcements

      const items = await getDocList<News>('News', {
        fields: ['*'],
        filters,
        orderBy: { field: 'creation', order: 'desc' },
        limit: 50,
      });

      return items;
    },
    enabled: !!user?.organization_id,
  });
}

// Fetch single announcement (News in Frappe)
export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: queryKeys.announcement(id),
    queryFn: async () => {
      if (!id) return null;
      const item = await getDoc<News>('News', id);
      return item;
    },
    enabled: !!id,
  });
}

// Fetch announcement attachments (News Attachment in Frappe)
export function useAnnouncementAttachments(announcementId: string) {
  return useQuery({
    queryKey: queryKeys.announcementAttachments(announcementId),
    queryFn: async () => {
      if (!announcementId) return [];
      const items = await getDocList<NewsAttachment>('News Attachment', {
        filters: [['news', '=', announcementId]],
        orderBy: { field: 'sort', order: 'asc' },
        fields: ['*'],
      });
      return items;
    },
    enabled: !!announcementId,
  });
}
