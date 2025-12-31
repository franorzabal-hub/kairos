/**
 * Tests for ReadStatusService
 *
 * Tests the content read/unread tracking functionality.
 */

import {
  getReadIds,
  markAsRead,
  markMultipleAsRead,
  markAsUnread,
  isRead,
  countUnread,
  getAllReadIds,
  getUnreadIds,
  clearAllReadStatus,
} from '../readStatusService';

// Mock the directus module
jest.mock('../../api/directus', () => ({
  directus: {
    request: jest.fn(),
  },
}));

// Mock @directus/sdk
jest.mock('@directus/sdk', () => ({
  readItems: jest.fn((collection, options) => ({ collection, options, type: 'readItems' })),
  createItem: jest.fn((collection, item) => ({ collection, item, type: 'createItem' })),
  deleteItems: jest.fn((collection, options) => ({ collection, options, type: 'deleteItems' })),
}));

import { directus } from '../../api/directus';

describe('ReadStatusService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReadIds', () => {
    it('should return a Set of read content IDs', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
        { content_id: 'item-3' },
      ]);

      const result = await getReadIds('announcements', mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('item-1')).toBe(true);
      expect(result.has('item-2')).toBe(true);
      expect(result.has('item-3')).toBe(true);
    });

    it('should return empty Set when no reads exist', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([]);

      const result = await getReadIds('events', mockUserId);

      expect(result.size).toBe(0);
    });

    it('should return empty Set on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getReadIds('announcements', mockUserId);

      expect(result.size).toBe(0);
    });

    it('should map content types correctly', async () => {
      (directus.request as jest.Mock).mockResolvedValue([]);

      // Test different content types
      await getReadIds('announcements', mockUserId);
      await getReadIds('events', mockUserId);
      await getReadIds('cambios', mockUserId);
      await getReadIds('boletines', mockUserId);

      // All should call with content_reads collection
      expect(directus.request).toHaveBeenCalledTimes(4);
    });
  });

  describe('markAsRead', () => {
    it('should create read record if not already read', async () => {
      // First call: check existing (none)
      (directus.request as jest.Mock)
        .mockResolvedValueOnce([]) // No existing read
        .mockResolvedValueOnce({ id: 'new-read' }); // Create returns new record

      await markAsRead('announcements', 'item-1', mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(2);
    });

    it('should not create duplicate read record', async () => {
      // Already exists
      (directus.request as jest.Mock).mockResolvedValueOnce([{ id: 'existing-read' }]);

      await markAsRead('announcements', 'item-1', mockUserId);

      // Should only check, not create
      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      // Should not throw
      await expect(markAsRead('events', 'item-1', mockUserId)).resolves.toBeUndefined();
    });
  });

  describe('markMultipleAsRead', () => {
    it('should batch create read records for new items', async () => {
      // First call: check existing
      (directus.request as jest.Mock)
        .mockResolvedValueOnce([{ content_id: 'item-1' }]) // item-1 already read
        .mockResolvedValueOnce({ id: 'created-1' }) // item-2 created
        .mockResolvedValueOnce({ id: 'created-2' }); // item-3 created

      await markMultipleAsRead('announcements', ['item-1', 'item-2', 'item-3'], mockUserId);

      // 1 read to check existing + 2 creates for new items
      expect(directus.request).toHaveBeenCalledTimes(3);
    });

    it('should skip if all items already read', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
      ]);

      await markMultipleAsRead('events', ['item-1', 'item-2'], mockUserId);

      // Only the check query, no creates
      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should handle empty array', async () => {
      await markMultipleAsRead('announcements', [], mockUserId);

      expect(directus.request).not.toHaveBeenCalled();
    });
  });

  describe('markAsUnread', () => {
    it('should delete read record', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ deleted: 1 });

      await markAsUnread('announcements', 'item-1', mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

      await expect(markAsUnread('events', 'item-1', mockUserId)).resolves.toBeUndefined();
    });
  });

  describe('isRead', () => {
    it('should return true if item is read', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([{ content_id: 'item-1' }]);

      const result = await isRead('announcements', 'item-1', mockUserId);

      expect(result).toBe(true);
    });

    it('should return false if item is not read', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([]);

      const result = await isRead('announcements', 'item-1', mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('countUnread', () => {
    it('should count items not in read set', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-3' },
      ]);

      const result = await countUnread('announcements', ['item-1', 'item-2', 'item-3', 'item-4'], mockUserId);

      // items 2 and 4 are unread
      expect(result).toBe(2);
    });

    it('should return total count if nothing is read', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([]);

      const result = await countUnread('events', ['item-1', 'item-2'], mockUserId);

      expect(result).toBe(2);
    });

    it('should return 0 if all items are read', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
      ]);

      const result = await countUnread('announcements', ['item-1', 'item-2'], mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('getAllReadIds', () => {
    it('should return grouped read IDs by content type', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { content_type: 'announcement', content_id: 'ann-1' },
        { content_type: 'announcement', content_id: 'ann-2' },
        { content_type: 'event', content_id: 'evt-1' },
        { content_type: 'message', content_id: 'msg-1' },
        { content_type: 'report', content_id: 'rep-1' },
      ]);

      const result = await getAllReadIds(mockUserId);

      expect(result.announcements.size).toBe(2);
      expect(result.announcements.has('ann-1')).toBe(true);
      expect(result.announcements.has('ann-2')).toBe(true);
      expect(result.events.size).toBe(1);
      expect(result.events.has('evt-1')).toBe(true);
      expect(result.cambios.size).toBe(1);
      expect(result.cambios.has('msg-1')).toBe(true);
      expect(result.boletines.size).toBe(1);
      expect(result.boletines.has('rep-1')).toBe(true);
    });

    it('should return empty sets on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await getAllReadIds(mockUserId);

      expect(result.announcements.size).toBe(0);
      expect(result.events.size).toBe(0);
      expect(result.cambios.size).toBe(0);
      expect(result.boletines.size).toBe(0);
    });
  });

  describe('getUnreadIds', () => {
    it('should return array of unread IDs', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
      ]);

      const result = await getUnreadIds('announcements', ['item-1', 'item-2', 'item-3', 'item-4'], mockUserId);

      expect(result).toEqual(['item-3', 'item-4']);
    });
  });

  describe('clearAllReadStatus', () => {
    it('should delete all read records for user', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ deleted: 100 });

      await clearAllReadStatus(mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

      await expect(clearAllReadStatus(mockUserId)).resolves.toBeUndefined();
    });
  });
});
