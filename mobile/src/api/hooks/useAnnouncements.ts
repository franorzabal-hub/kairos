import { useQuery } from '@tanstack/react-query';
import { readItems, readItem } from '@directus/sdk';
import { directus, Announcement, AnnouncementAttachment } from '../directus';
import { useChildren } from '../../context/ChildrenContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';
import { AnnouncementFilter, NestedFields } from '../../types/directus';

// Fetch announcements
export function useAnnouncements() {
  const { user } = useAuth();
  const { children, selectedChildId } = useChildren();
  const { filterMode } = useUI();

  return useQuery({
    queryKey: [...queryKeys.announcements, selectedChildId, filterMode, user?.organization_id],
    queryFn: async () => {
      const filter: AnnouncementFilter = {
        status: { _eq: 'published' },
      };

      // Multi-tenant isolation: filter by organization_id
      if (user?.organization_id) {
        filter.organization_id = { _eq: user.organization_id };
      }

      // If child selected, filter by section or grade
      // For MVP, we fetch all published announcements

      const items = await directus.request(
        readItems('announcements', {
          fields: ['*'],
          filter,
          sort: ['-created_at'],
          limit: 50,
        })
      );

      return items as Announcement[];
    },
    enabled: !!user?.organization_id,
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
      // NestedFields for relational queries - SDK type limitation workaround
      const nestedFields: NestedFields = ['*', { file: ['*'] }];
      const items = await directus.request(
        readItems('announcement_attachments', {
          filter: { announcement_id: { _eq: announcementId } },
          sort: ['sort'],
          // Include file metadata from directus_files
          fields: nestedFields as typeof nestedFields & string[],
        })
      );
      return items as unknown as AnnouncementAttachment[];
    },
    enabled: !!announcementId,
  });
}
