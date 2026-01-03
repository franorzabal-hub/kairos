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

// Mock the frappe module
jest.mock('../../api/frappe', () => ({
  getDocList: jest.fn(),
  createDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getCount: jest.fn(),
}));

import { getDocList, createDoc, deleteDoc } from '../../api/frappe';

// Create mock references
const mockGetDocList = getDocList as jest.MockedFunction<typeof getDocList>;
const mockCreateDoc = createDoc as jest.MockedFunction<typeof createDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;

describe('ReadStatusService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReadIds', () => {
    it('should return a Set of read content IDs', async () => {
      mockGetDocList.mockResolvedValueOnce([
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
      mockGetDocList.mockResolvedValueOnce([]);

      const result = await getReadIds('events', mockUserId);

      expect(result.size).toBe(0);
    });

    it('should return empty Set on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Network error'));

      const result = await getReadIds('announcements', mockUserId);

      expect(result.size).toBe(0);
    });

    it('should map content types correctly', async () => {
      mockGetDocList.mockResolvedValue([]);

      // Test different content types
      await getReadIds('announcements', mockUserId);
      await getReadIds('events', mockUserId);
      await getReadIds('cambios', mockUserId);
      await getReadIds('boletines', mockUserId);

      // All should call Content Read doctype
      expect(mockGetDocList).toHaveBeenCalledTimes(4);
    });
  });

  describe('markAsRead', () => {
    it('should create read record if not already read', async () => {
      // First call: check existing (none)
      mockGetDocList.mockResolvedValueOnce([]); // No existing read
      mockCreateDoc.mockResolvedValueOnce({ name: 'new-read' }); // Create returns new record

      await markAsRead('announcements', 'item-1', mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate read record', async () => {
      // Already exists
      mockGetDocList.mockResolvedValueOnce([{ name: 'existing-read' }]);

      await markAsRead('announcements', 'item-1', mockUserId);

      // Should only check, not create
      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('DB error'));

      // Should not throw
      await expect(markAsRead('events', 'item-1', mockUserId)).resolves.toBeUndefined();
    });
  });

  describe('markMultipleAsRead', () => {
    it('should batch create read records for new items', async () => {
      // First call: check existing
      mockGetDocList.mockResolvedValueOnce([{ content_id: 'item-1' }]); // item-1 already read
      mockCreateDoc
        .mockResolvedValueOnce({ name: 'created-1' }) // item-2 created
        .mockResolvedValueOnce({ name: 'created-2' }); // item-3 created

      await markMultipleAsRead('announcements', ['item-1', 'item-2', 'item-3'], mockUserId);

      // 1 read to check existing + 2 creates for new items
      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).toHaveBeenCalledTimes(2);
    });

    it('should skip if all items already read', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
      ]);

      await markMultipleAsRead('events', ['item-1', 'item-2'], mockUserId);

      // Only the check query, no creates
      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).not.toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      await markMultipleAsRead('announcements', [], mockUserId);

      expect(mockGetDocList).not.toHaveBeenCalled();
    });
  });

  describe('markAsUnread', () => {
    it('should delete read record', async () => {
      mockGetDocList.mockResolvedValueOnce([{ name: 'read-record-1' }]);
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await markAsUnread('announcements', 'item-1', mockUserId);

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(markAsUnread('events', 'item-1', mockUserId)).resolves.toBeUndefined();
    });
  });

  describe('isRead', () => {
    it('should return true if item is read', async () => {
      mockGetDocList.mockResolvedValueOnce([{ content_id: 'item-1' }]);

      const result = await isRead('announcements', 'item-1', mockUserId);

      expect(result).toBe(true);
    });

    it('should return false if item is not read', async () => {
      mockGetDocList.mockResolvedValueOnce([]);

      const result = await isRead('announcements', 'item-1', mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('countUnread', () => {
    it('should count items not in read set', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-3' },
      ]);

      const result = await countUnread('announcements', ['item-1', 'item-2', 'item-3', 'item-4'], mockUserId);

      // items 2 and 4 are unread
      expect(result).toBe(2);
    });

    it('should return total count if nothing is read', async () => {
      mockGetDocList.mockResolvedValueOnce([]);

      const result = await countUnread('events', ['item-1', 'item-2'], mockUserId);

      expect(result).toBe(2);
    });

    it('should return 0 if all items are read', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
      ]);

      const result = await countUnread('announcements', ['item-1', 'item-2'], mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('getAllReadIds', () => {
    it('should return grouped read IDs by content type', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { content_type: 'News', content_id: 'ann-1' },
        { content_type: 'News', content_id: 'ann-2' },
        { content_type: 'School Event', content_id: 'evt-1' },
        { content_type: 'Message', content_id: 'msg-1' },
        { content_type: 'Report', content_id: 'rep-1' },
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
      mockGetDocList.mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await getAllReadIds(mockUserId);

      expect(result.announcements.size).toBe(0);
      expect(result.events.size).toBe(0);
      expect(result.cambios.size).toBe(0);
      expect(result.boletines.size).toBe(0);
    });
  });

  describe('getUnreadIds', () => {
    it('should return array of unread IDs', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { content_id: 'item-1' },
        { content_id: 'item-2' },
      ]);

      const result = await getUnreadIds('announcements', ['item-1', 'item-2', 'item-3', 'item-4'], mockUserId);

      expect(result).toEqual(['item-3', 'item-4']);
    });
  });

  describe('clearAllReadStatus', () => {
    it('should delete all read records for user', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { name: 'read-1' },
        { name: 'read-2' },
      ]);
      mockDeleteDoc.mockResolvedValue(undefined);

      await clearAllReadStatus(mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(clearAllReadStatus(mockUserId)).resolves.toBeUndefined();
    });
  });
});
