import { directus } from '../api/directus';
import { readItems, createItem, deleteItems } from '@directus/sdk';
import { logger } from '../utils/logger';

// Types for the new collections
export interface UserPinnedAnnouncement {
  id: string;
  user_id: string;
  announcement_id: string;
  created_at: string;  // Directus uses created_at for this collection
}

export interface UserArchivedAnnouncement {
  id: string;
  user_id: string;
  announcement_id: string;
  created_at: string;  // Directus uses created_at for this collection
}

export interface AnnouncementAcknowledgment {
  id: string;
  user_id: string;
  announcement_id: string;
  acknowledged_at: string;
}

// ==========================================
// PINNING
// ==========================================

/**
 * Get all pinned announcement IDs for a user
 * Limited to 500 to prevent unbounded queries
 */
export async function getPinnedIds(userId: string): Promise<Set<string>> {
  try {
    const pinned = await directus.request(
      readItems('user_pinned_announcements', {
        filter: {
          user_id: { _eq: userId },
        },
        fields: ['announcement_id'],
        limit: 500,
        sort: ['-created_at'],
      })
    );
    return new Set(pinned.map((p: { announcement_id: string }) => p.announcement_id));
  } catch (error) {
    logger.warn('Failed to fetch pinned announcements, returning empty fallback', error);
    // Return empty fallback - UI will show no pinned items
    return new Set();
  }
}

/**
 * Pin an announcement for the user
 */
export async function pinAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Check if already pinned
    const existing = await directus.request(
      readItems('user_pinned_announcements', {
        filter: {
          user_id: { _eq: userId },
          announcement_id: { _eq: announcementId },
        },
        limit: 1,
      })
    );

    if (existing.length === 0) {
      await directus.request(
        createItem('user_pinned_announcements', {
          user_id: userId,
          announcement_id: announcementId,
        })
      );
    }
  } catch (error) {
    logger.error('Failed to pin announcement', error);
    throw error;
  }
}

/**
 * Unpin an announcement for the user
 */
export async function unpinAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    await directus.request(
      deleteItems('user_pinned_announcements', {
        filter: {
          user_id: { _eq: userId },
          announcement_id: { _eq: announcementId },
        },
      })
    );
  } catch (error) {
    logger.error('Failed to unpin announcement', error);
    throw error;
  }
}

// ==========================================
// ARCHIVING
// ==========================================

/**
 * Get all archived announcement IDs for a user
 * Limited to 500 to prevent unbounded queries
 */
export async function getArchivedIds(userId: string): Promise<Set<string>> {
  try {
    const archived = await directus.request(
      readItems('user_archived_announcements', {
        filter: {
          user_id: { _eq: userId },
        },
        fields: ['announcement_id'],
        limit: 500,
        sort: ['-created_at'],
      })
    );
    return new Set(archived.map((a: { announcement_id: string }) => a.announcement_id));
  } catch (error) {
    logger.warn('Failed to fetch archived announcements, returning empty fallback', error);
    // Return empty fallback - UI will show no archived items
    return new Set();
  }
}

/**
 * Archive an announcement for the user
 */
export async function archiveAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Check if already archived
    const existing = await directus.request(
      readItems('user_archived_announcements', {
        filter: {
          user_id: { _eq: userId },
          announcement_id: { _eq: announcementId },
        },
        limit: 1,
      })
    );

    if (existing.length === 0) {
      await directus.request(
        createItem('user_archived_announcements', {
          user_id: userId,
          announcement_id: announcementId,
        })
      );
    }
  } catch (error) {
    logger.error('Failed to archive announcement', error);
    throw error;
  }
}

/**
 * Unarchive an announcement for the user
 */
export async function unarchiveAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    await directus.request(
      deleteItems('user_archived_announcements', {
        filter: {
          user_id: { _eq: userId },
          announcement_id: { _eq: announcementId },
        },
      })
    );
  } catch (error) {
    logger.error('Failed to unarchive announcement', error);
    throw error;
  }
}

// ==========================================
// ACKNOWLEDGMENTS
// ==========================================

/**
 * Get all acknowledged announcement IDs for a user
 * Limited to 500 to prevent unbounded queries
 */
export async function getAcknowledgedIds(userId: string): Promise<Set<string>> {
  try {
    const acknowledged = await directus.request(
      readItems('announcement_acknowledgments', {
        filter: {
          user_id: { _eq: userId },
        },
        fields: ['announcement_id'],
        limit: 500,
        sort: ['-acknowledged_at'],
      })
    );
    return new Set(acknowledged.map((a: { announcement_id: string }) => a.announcement_id));
  } catch (error) {
    logger.warn('Failed to fetch acknowledgments, returning empty fallback', error);
    // Return empty fallback - UI will show no acknowledged items
    return new Set();
  }
}

/**
 * Acknowledge an announcement
 */
export async function acknowledgeAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Check if already acknowledged
    const existing = await directus.request(
      readItems('announcement_acknowledgments', {
        filter: {
          user_id: { _eq: userId },
          announcement_id: { _eq: announcementId },
        },
        limit: 1,
      })
    );

    if (existing.length === 0) {
      await directus.request(
        createItem('announcement_acknowledgments', {
          user_id: userId,
          announcement_id: announcementId,
        })
      );
    }
  } catch (error) {
    logger.error('Failed to acknowledge announcement', error);
    throw error;
  }
}

// ==========================================
// COMBINED DATA FETCH
// ==========================================

/**
 * Get all user action states (pinned, archived, acknowledged) in one call.
 * Each query is limited to 500 items to prevent unbounded queries.
 */
export async function getAllUserAnnouncementStates(userId: string): Promise<{
  pinnedIds: Set<string>;
  archivedIds: Set<string>;
  acknowledgedIds: Set<string>;
}> {
  try {
    const [pinned, archived, acknowledged] = await Promise.all([
      getPinnedIds(userId),
      getArchivedIds(userId),
      getAcknowledgedIds(userId),
    ]);

    return {
      pinnedIds: pinned,
      archivedIds: archived,
      acknowledgedIds: acknowledged,
    };
  } catch (error) {
    logger.warn('Failed to fetch user announcement states, returning empty fallback', error);
    // Return empty fallback - UI will show default states
    return {
      pinnedIds: new Set(),
      archivedIds: new Set(),
      acknowledgedIds: new Set(),
    };
  }
}
