/**
 * Content Status Service
 *
 * Handles CRUD operations for cross-functional tables:
 * - content_reads: Track reading and acknowledgments
 * - content_user_status: Track user-specific archived/pinned status
 */

import { createItem, updateItem, readItems, deleteItem } from '@directus/sdk';
import directus, { ContentRead, ContentUserStatus } from '../api/directus';

export type ContentType = 'announcement' | 'event' | 'message';

// ========== Content User Status (Archive/Pin) ==========

/**
 * Find existing user status for a content item
 */
async function findUserStatus(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<ContentUserStatus | null> {
  try {
    const results = await directus.request(
      readItems('content_user_status', {
        filter: {
          content_type: { _eq: contentType },
          content_id: { _eq: contentId },
          user_id: { _eq: userId },
        },
        limit: 1,
      })
    );
    return (results[0] as ContentUserStatus) || null;
  } catch (error) {
    console.error('Error finding user status:', error);
    return null;
  }
}

/**
 * Toggle archived status for a content item
 */
export async function toggleArchived(
  contentType: ContentType,
  contentId: string,
  userId: string,
  organizationId: string,
  archived: boolean
): Promise<void> {
  const existing = await findUserStatus(contentType, contentId, userId);

  if (existing) {
    await directus.request(
      updateItem('content_user_status', existing.id, {
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
      })
    );
  } else {
    await directus.request(
      createItem('content_user_status', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        organization_id: organizationId,
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
        is_pinned: false,
      })
    );
  }
}

/**
 * Toggle personal pinned status for a content item
 */
export async function togglePinned(
  contentType: ContentType,
  contentId: string,
  userId: string,
  organizationId: string,
  pinned: boolean
): Promise<void> {
  const existing = await findUserStatus(contentType, contentId, userId);

  if (existing) {
    await directus.request(
      updateItem('content_user_status', existing.id, {
        is_pinned: pinned,
        pinned_at: pinned ? new Date().toISOString() : null,
      })
    );
  } else {
    await directus.request(
      createItem('content_user_status', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        organization_id: organizationId,
        is_pinned: pinned,
        pinned_at: pinned ? new Date().toISOString() : null,
        is_archived: false,
      })
    );
  }
}

/**
 * Get user status for a content item
 */
export async function getUserStatus(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<ContentUserStatus | null> {
  return findUserStatus(contentType, contentId, userId);
}

/**
 * Get all user statuses for a content type
 */
export async function getAllUserStatuses(
  contentType: ContentType,
  userId: string
): Promise<ContentUserStatus[]> {
  try {
    const results = await directus.request(
      readItems('content_user_status', {
        filter: {
          content_type: { _eq: contentType },
          user_id: { _eq: userId },
        },
      })
    );
    return results as ContentUserStatus[];
  } catch (error) {
    console.error('Error getting user statuses:', error);
    return [];
  }
}

// ========== Content Reads (Read/Acknowledge) ==========

/**
 * Find existing read record for a content item
 */
async function findContentRead(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<ContentRead | null> {
  try {
    const results = await directus.request(
      readItems('content_reads', {
        filter: {
          content_type: { _eq: contentType },
          content_id: { _eq: contentId },
          user_id: { _eq: userId },
        },
        limit: 1,
      })
    );
    return (results[0] as ContentRead) || null;
  } catch (error) {
    console.error('Error finding content read:', error);
    return null;
  }
}

/**
 * Mark content as read (creates a read record on the server)
 */
export async function markAsRead(
  contentType: ContentType,
  contentId: string,
  userId: string,
  organizationId: string
): Promise<void> {
  try {
    // Check if already exists
    const existing = await findContentRead(contentType, contentId, userId);
    if (existing) {
      return; // Already marked as read
    }

    await directus.request(
      createItem('content_reads', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        organization_id: organizationId,
        acknowledged: false,
      })
    );
  } catch (error: any) {
    // Ignore unique constraint errors
    if (!error.message?.includes('unique') && !error.message?.includes('duplicate')) {
      throw error;
    }
  }
}

/**
 * Mark content as unread (deletes the read record)
 */
export async function markAsUnread(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<void> {
  const existing = await findContentRead(contentType, contentId, userId);
  if (existing) {
    await directus.request(deleteItem('content_reads', existing.id));
  }
}

/**
 * Toggle read status
 */
export async function toggleRead(
  contentType: ContentType,
  contentId: string,
  userId: string,
  organizationId: string,
  markRead: boolean
): Promise<void> {
  if (markRead) {
    await markAsRead(contentType, contentId, userId, organizationId);
  } else {
    await markAsUnread(contentType, contentId, userId);
  }
}

/**
 * Acknowledge content (explicit confirmation)
 */
export async function acknowledge(
  contentType: ContentType,
  contentId: string,
  userId: string,
  organizationId: string
): Promise<void> {
  const existing = await findContentRead(contentType, contentId, userId);

  if (existing) {
    await directus.request(
      updateItem('content_reads', existing.id, {
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    );
  } else {
    await directus.request(
      createItem('content_reads', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        organization_id: organizationId,
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    );
  }
}

/**
 * Get read status for a content item
 */
export async function getReadStatus(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<ContentRead | null> {
  return findContentRead(contentType, contentId, userId);
}

/**
 * Get all read records for a content type
 */
export async function getAllReadRecords(
  contentType: ContentType,
  userId: string
): Promise<ContentRead[]> {
  try {
    const results = await directus.request(
      readItems('content_reads', {
        filter: {
          content_type: { _eq: contentType },
          user_id: { _eq: userId },
        },
      })
    );
    return results as ContentRead[];
  } catch (error) {
    console.error('Error getting read records:', error);
    return [];
  }
}

/**
 * Check if content is read
 */
export async function isRead(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<boolean> {
  const record = await findContentRead(contentType, contentId, userId);
  return record !== null;
}

/**
 * Check if content is acknowledged
 */
export async function isAcknowledged(
  contentType: ContentType,
  contentId: string,
  userId: string
): Promise<boolean> {
  const record = await findContentRead(contentType, contentId, userId);
  return record?.acknowledged ?? false;
}
