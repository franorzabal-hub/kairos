import { getDocList, createDoc, deleteDoc, ContentRead } from '../api/frappe';
import { CONTENT_TYPES, ContentTypeValue } from '../constants';
import { logger } from '../utils/logger';

// ContentType derives from CONTENT_TYPES constant values
export type ContentType = ContentTypeValue;
type DbContentType = 'News' | 'School Event' | 'Message' | 'Report';

const contentTypeMap: Record<ContentType, DbContentType> = {
  [CONTENT_TYPES.ANNOUNCEMENTS]: 'News',
  [CONTENT_TYPES.EVENTS]: 'School Event',
  [CONTENT_TYPES.CAMBIOS]: 'Message', // pickup requests tracked as messages
  [CONTENT_TYPES.BOLETINES]: 'Report',
};

/**
 * Get the set of read item IDs for a content type
 */
export async function getReadIds(type: ContentType, userId: string): Promise<Set<string>> {
  try {
    const dbType = contentTypeMap[type];
    const reads = await getDocList<ContentRead>('Content Read', {
      filters: [
        ['user', '=', userId],
        ['content_type', '=', dbType],
      ],
      fields: ['content_id'],
    });
    return new Set(reads.map((r) => r.content_id));
  } catch (error) {
    logger.warn(`Failed to fetch ${type} read status, returning empty fallback`, error);
    // Return empty fallback - UI will treat items as unread
    return new Set();
  }
}

/**
 * Mark a single item as read
 */
export async function markAsRead(type: ContentType, id: string, userId: string): Promise<void> {
  try {
    const dbType = contentTypeMap[type];

    // Check if already marked as read
    const existing = await getDocList<ContentRead>('Content Read', {
      filters: [
        ['user', '=', userId],
        ['content_type', '=', dbType],
        ['content_id', '=', id],
      ],
      limit: 1,
    });

    if (existing.length === 0) {
      await createDoc<ContentRead>('Content Read', {
        user: userId,
        content_type: dbType,
        content_id: id,
        read_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Log but don't throw - marking as read is non-critical and shouldn't block UI
    logger.warn(`Failed to mark ${type} as read`, error);
  }
}

/**
 * Mark multiple items as read (batch operation)
 */
export async function markMultipleAsRead(type: ContentType, ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return;

  const dbType = contentTypeMap[type];

  try {
    // First, get existing reads to avoid duplicates
    const existing = await getDocList<ContentRead>('Content Read', {
      filters: [
        ['user', '=', userId],
        ['content_type', '=', dbType],
        ['content_id', 'in', ids],
      ],
      fields: ['content_id'],
    });

    const existingIds = new Set(existing.map((r) => r.content_id));
    const newIds = ids.filter(id => !existingIds.has(id));

    // Batch create new read records
    if (newIds.length > 0) {
      // Create all at once using Promise.all for better performance
      await Promise.all(newIds.map(id =>
        createDoc<ContentRead>('Content Read', {
          user: userId,
          content_type: dbType,
          content_id: id,
          read_at: new Date().toISOString(),
        })
      ));
    }
  } catch (error) {
    // Log but don't throw - marking as read is non-critical and shouldn't block UI
    logger.warn(`Failed to batch mark ${type} as read`, error);
  }
}

/**
 * Mark a single item as unread (delete the read record)
 */
export async function markAsUnread(type: ContentType, id: string, userId: string): Promise<void> {
  try {
    const dbType = contentTypeMap[type];

    // Find the read record to delete
    const existing = await getDocList<ContentRead>('Content Read', {
      filters: [
        ['user', '=', userId],
        ['content_type', '=', dbType],
        ['content_id', '=', id],
      ],
      fields: ['name'],
      limit: 1,
    });

    if (existing.length > 0) {
      await deleteDoc('Content Read', existing[0].name);
    }
  } catch (error) {
    // Log but don't throw - marking as unread is non-critical and shouldn't block UI
    logger.warn(`Failed to mark ${type} as unread`, error);
  }
}

/**
 * Check if an item has been read
 */
export async function isRead(type: ContentType, id: string, userId: string): Promise<boolean> {
  const readIds = await getReadIds(type, userId);
  return readIds.has(id);
}

/**
 * Count unread items from a list of IDs
 */
export async function countUnread(type: ContentType, allIds: string[], userId: string): Promise<number> {
  const readIds = await getReadIds(type, userId);
  return allIds.filter(id => !readIds.has(id)).length;
}

/**
 * Get all read IDs for all content types in one call (optimized for useUnreadSync)
 */
export async function getAllReadIds(userId: string): Promise<Record<ContentType, Set<string>>> {
  try {
    const reads = await getDocList<ContentRead>('Content Read', {
      filters: [
        ['user', '=', userId],
      ],
      fields: ['content_type', 'content_id'],
    });

    // Group by content type
    const result: Record<ContentType, Set<string>> = {
      announcements: new Set(),
      events: new Set(),
      cambios: new Set(),
      boletines: new Set(),
    };

    // Reverse map from DB types to UI types
    const reverseMap: Record<DbContentType, ContentType> = {
      'News': 'announcements',
      'School Event': 'events',
      'Message': 'cambios',
      'Report': 'boletines',
    };

    for (const read of reads) {
      const uiType = reverseMap[read.content_type as DbContentType];
      if (uiType) {
        result[uiType].add(read.content_id);
      }
    }

    return result;
  } catch (error) {
    logger.warn('Failed to fetch all read IDs, returning empty fallback', error);
    // Return empty fallback - UI will treat all items as unread
    return {
      announcements: new Set(),
      events: new Set(),
      cambios: new Set(),
      boletines: new Set(),
    };
  }
}

/**
 * Get unread IDs from a list
 */
export async function getUnreadIds(type: ContentType, allIds: string[], userId: string): Promise<string[]> {
  const readIds = await getReadIds(type, userId);
  return allIds.filter(id => !readIds.has(id));
}

/**
 * Clear all read status for a user (marks everything as unread)
 */
export async function clearAllReadStatus(userId: string): Promise<void> {
  try {
    // Get all read records for this user
    const allReads = await getDocList<ContentRead>('Content Read', {
      filters: [
        ['user', '=', userId],
      ],
      fields: ['name'],
    });

    // Delete all read records
    await Promise.all(allReads.map(read => deleteDoc('Content Read', read.name)));
  } catch (error) {
    // Log but don't throw - clearing read status is non-critical
    logger.warn('Failed to clear read status', error);
  }
}
