import {
  getDocList,
  createDoc,
  deleteDoc,
  UserPinnedNews,
  UserArchivedNews,
  NewsAcknowledgment,
  FrappeFilter,
} from '../api/frappe';
import { logger } from '../utils/logger';

// ==========================================
// PINNING
// ==========================================

/**
 * Get all pinned news IDs for a user
 * Limited to 500 to prevent unbounded queries
 */
export async function getPinnedIds(userId: string): Promise<Set<string>> {
  try {
    const pinned = await getDocList<UserPinnedNews>('User Pinned News', {
      filters: [['user', '=', userId]],
      fields: ['news'],
      limit: 500,
      orderBy: { field: 'creation', order: 'desc' },
    });
    return new Set(pinned.map((p) => p.news));
  } catch (error) {
    logger.warn('Failed to fetch pinned news, returning empty fallback', error);
    // Return empty fallback - UI will show no pinned items
    return new Set();
  }
}

/**
 * Pin a news item for the user
 */
export async function pinAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Check if already pinned
    const existing = await getDocList<UserPinnedNews>('User Pinned News', {
      filters: [
        ['user', '=', userId],
        ['news', '=', announcementId],
      ],
      limit: 1,
    });

    if (existing.length === 0) {
      await createDoc<UserPinnedNews>('User Pinned News', {
        user: userId,
        news: announcementId,
      });
    }
  } catch (error) {
    logger.error('Failed to pin news', error);
    throw error;
  }
}

/**
 * Unpin a news item for the user
 */
export async function unpinAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Find the record to delete
    const existing = await getDocList<UserPinnedNews>('User Pinned News', {
      filters: [
        ['user', '=', userId],
        ['news', '=', announcementId],
      ],
      fields: ['name'],
      limit: 1,
    });

    if (existing.length > 0) {
      await deleteDoc('User Pinned News', existing[0].name);
    }
  } catch (error) {
    logger.error('Failed to unpin news', error);
    throw error;
  }
}

// ==========================================
// ARCHIVING
// ==========================================

/**
 * Get all archived news IDs for a user
 * Limited to 500 to prevent unbounded queries
 */
export async function getArchivedIds(userId: string): Promise<Set<string>> {
  try {
    const archived = await getDocList<UserArchivedNews>('User Archived News', {
      filters: [['user', '=', userId]],
      fields: ['news'],
      limit: 500,
      orderBy: { field: 'creation', order: 'desc' },
    });
    return new Set(archived.map((a) => a.news));
  } catch (error) {
    logger.warn('Failed to fetch archived news, returning empty fallback', error);
    // Return empty fallback - UI will show no archived items
    return new Set();
  }
}

/**
 * Archive a news item for the user
 */
export async function archiveAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Check if already archived
    const existing = await getDocList<UserArchivedNews>('User Archived News', {
      filters: [
        ['user', '=', userId],
        ['news', '=', announcementId],
      ],
      limit: 1,
    });

    if (existing.length === 0) {
      await createDoc<UserArchivedNews>('User Archived News', {
        user: userId,
        news: announcementId,
      });
    }
  } catch (error) {
    logger.error('Failed to archive news', error);
    throw error;
  }
}

/**
 * Unarchive a news item for the user
 */
export async function unarchiveAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Find the record to delete
    const existing = await getDocList<UserArchivedNews>('User Archived News', {
      filters: [
        ['user', '=', userId],
        ['news', '=', announcementId],
      ],
      fields: ['name'],
      limit: 1,
    });

    if (existing.length > 0) {
      await deleteDoc('User Archived News', existing[0].name);
    }
  } catch (error) {
    logger.error('Failed to unarchive news', error);
    throw error;
  }
}

// ==========================================
// ACKNOWLEDGMENTS
// ==========================================

/**
 * Get all acknowledged news IDs for a user
 * Limited to 500 to prevent unbounded queries
 */
export async function getAcknowledgedIds(userId: string): Promise<Set<string>> {
  try {
    const acknowledged = await getDocList<NewsAcknowledgment>('News Acknowledgment', {
      filters: [['user', '=', userId]],
      fields: ['news'],
      limit: 500,
      orderBy: { field: 'acknowledged_at', order: 'desc' },
    });
    return new Set(acknowledged.map((a) => a.news));
  } catch (error) {
    logger.warn('Failed to fetch acknowledgments, returning empty fallback', error);
    // Return empty fallback - UI will show no acknowledged items
    return new Set();
  }
}

/**
 * Acknowledge a news item
 */
export async function acknowledgeAnnouncement(announcementId: string, userId: string): Promise<void> {
  try {
    // Check if already acknowledged
    const existing = await getDocList<NewsAcknowledgment>('News Acknowledgment', {
      filters: [
        ['user', '=', userId],
        ['news', '=', announcementId],
      ],
      limit: 1,
    });

    if (existing.length === 0) {
      await createDoc<NewsAcknowledgment>('News Acknowledgment', {
        user: userId,
        news: announcementId,
        acknowledged_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to acknowledge news', error);
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
    logger.warn('Failed to fetch user news states, returning empty fallback', error);
    // Return empty fallback - UI will show default states
    return {
      pinnedIds: new Set(),
      archivedIds: new Set(),
      acknowledgedIds: new Set(),
    };
  }
}
