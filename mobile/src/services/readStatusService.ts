import { directus, ContentRead } from '../api/directus';
import { readItems, createItem, deleteItems } from '@directus/sdk';
import { CONTENT_TYPES, ContentTypeValue } from '../constants';

// ContentType derives from CONTENT_TYPES constant values
export type ContentType = ContentTypeValue;
type DbContentType = 'announcement' | 'event' | 'message' | 'report';

const contentTypeMap: Record<ContentType, DbContentType> = {
  [CONTENT_TYPES.ANNOUNCEMENTS]: 'announcement',
  [CONTENT_TYPES.EVENTS]: 'event',
  [CONTENT_TYPES.CAMBIOS]: 'message', // pickup requests tracked as messages
  [CONTENT_TYPES.BOLETINES]: 'report',
};

/**
 * Get the set of read item IDs for a content type
 */
export async function getReadIds(type: ContentType, userId: string): Promise<Set<string>> {
  try {
    const dbType = contentTypeMap[type];
    const reads = await directus.request(
      readItems('content_reads', {
        filter: {
          user_id: { _eq: userId },
          content_type: { _eq: dbType },
        },
        fields: ['content_id'],
      })
    );
    return new Set(reads.map((r: Pick<ContentRead, 'content_id'>) => r.content_id));
  } catch (error) {
    console.error(`Error reading ${type} read status:`, error);
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
    const existing = await directus.request(
      readItems('content_reads', {
        filter: {
          user_id: { _eq: userId },
          content_type: { _eq: dbType },
          content_id: { _eq: id },
        },
        limit: 1,
      })
    );

    if (existing.length === 0) {
      await directus.request(
        createItem('content_reads', {
          user_id: userId,
          content_type: dbType,
          content_id: id,
        })
      );
    }
  } catch (error) {
    console.error(`Error marking ${type} as read:`, error);
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
    const existing = await directus.request(
      readItems('content_reads', {
        filter: {
          user_id: { _eq: userId },
          content_type: { _eq: dbType },
          content_id: { _in: ids },
        },
        fields: ['content_id'],
      })
    );

    const existingIds = new Set(existing.map((r: Pick<ContentRead, 'content_id'>) => r.content_id));
    const newIds = ids.filter(id => !existingIds.has(id));

    // Batch create new read records
    if (newIds.length > 0) {
      const records = newIds.map(id => ({
        user_id: userId,
        content_type: dbType,
        content_id: id,
      }));

      // Create all at once using Promise.all for better performance
      await Promise.all(records.map(record =>
        directus.request(createItem('content_reads', record))
      ));
    }
  } catch (error) {
    console.error(`Error batch marking ${type} as read:`, error);
  }
}

/**
 * Mark a single item as unread (delete the read record)
 */
export async function markAsUnread(type: ContentType, id: string, userId: string): Promise<void> {
  try {
    const dbType = contentTypeMap[type];

    await directus.request(
      deleteItems('content_reads', {
        filter: {
          user_id: { _eq: userId },
          content_type: { _eq: dbType },
          content_id: { _eq: id },
        },
      })
    );
  } catch (error) {
    console.error(`Error marking ${type} as unread:`, error);
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
    const reads = await directus.request(
      readItems('content_reads', {
        filter: {
          user_id: { _eq: userId },
        },
        fields: ['content_type', 'content_id'],
      })
    );

    // Group by content type
    const result: Record<ContentType, Set<string>> = {
      announcements: new Set(),
      events: new Set(),
      cambios: new Set(),
      boletines: new Set(),
    };

    // Reverse map from DB types to UI types
    const reverseMap: Record<DbContentType, ContentType> = {
      announcement: 'announcements',
      event: 'events',
      message: 'cambios',
      report: 'boletines',
    };

    for (const read of reads as { content_type: DbContentType; content_id: string }[]) {
      const uiType = reverseMap[read.content_type];
      if (uiType) {
        result[uiType].add(read.content_id);
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting all read IDs:', error);
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
    // Delete all content_reads for this user
    await directus.request(
      deleteItems('content_reads', {
        filter: {
          user_id: { _eq: userId },
        },
      })
    );
  } catch (error) {
    console.error('Error clearing read status:', error);
  }
}
