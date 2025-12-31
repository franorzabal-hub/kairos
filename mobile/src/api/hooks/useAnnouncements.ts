import { useQuery } from '@tanstack/react-query';
import { readItems, readItem } from '@directus/sdk';
import { directus, Announcement, AnnouncementAttachment } from '../directus';
import { useAppContext } from '../../context/AppContext';
import { queryKeys } from './queryKeys';

// Fetch announcements
export function useAnnouncements() {
  const { children, selectedChildId, filterMode } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.announcements, selectedChildId, filterMode],
    queryFn: async () => {
      const filter: any = {
        status: { _eq: 'published' },
      };

      // If child selected, filter by section or grade
      // For MVP, we fetch all published announcements

      const items = await directus.request(
        readItems('announcements', {
          filter,
          sort: ['-created_at'],
          limit: 50,
        })
      );

      return items as Announcement[];
    },
  });
}

// Fetch single announcement
export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: queryKeys.announcement(id),
    queryFn: async () => {
      if (!id) return null;
      const item = await directus.request(
        readItem('announcements', id)
      );
      return item as Announcement;
    },
    enabled: !!id,
  });
}

// Fetch announcement attachments
export function useAnnouncementAttachments(announcementId: string) {
  return useQuery({
    queryKey: queryKeys.announcementAttachments(announcementId),
    queryFn: async () => {
      if (!announcementId) return [];
      const items = await directus.request(
        readItems('announcement_attachments', {
          filter: { announcement_id: { _eq: announcementId } },
          sort: ['sort'],
          // Include file metadata from directus_files (NestedFields for relational queries)
          fields: ['*', { file: ['*'] }] as any,
        })
      );
      return items as unknown as AnnouncementAttachment[];
    },
    enabled: !!announcementId,
  });
}
