import { directus, ContentRead } from '../api/directus';
import { readItems, createItem, deleteItems } from '@directus/sdk';

// Map UI content types to database content types
export type ContentType = 'announcements' | 'events' | 'cambios' | 'boletines';
type DbContentType = 'announcement' | 'event' | 'message' | 'report';

const contentTypeMap: Record<ContentType, DbContentType> = {
  announcements: 'announcement',
  events: 'event',
  cambios: 'message', // pickup requests tracked as messages
  boletines: 'report',
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
 * Mark multiple items as read
 */
export async function markMultipleAsRead(type: ContentType, ids: string[], userId: string): Promise<void> {
  // Mark each item as read - could be optimized with batch creation
  for (const id of ids) {
    await markAsRead(type, id, userId);
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
