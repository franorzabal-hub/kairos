/**
 * Tests for AnnouncementActionsService
 *
 * Tests pinning, archiving, and acknowledgment functionality.
 */

import {
  getPinnedIds,
  pinAnnouncement,
  unpinAnnouncement,
  getArchivedIds,
  archiveAnnouncement,
  unarchiveAnnouncement,
  getAcknowledgedIds,
  acknowledgeAnnouncement,
  getAllUserAnnouncementStates,
} from '../announcementActionsService';

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

describe('AnnouncementActionsService', () => {
  const mockUserId = 'user-123';
  const mockAnnouncementId = 'ann-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // PINNING TESTS
  // ==========================================

  describe('getPinnedIds', () => {
    it('should return a Set of pinned announcement IDs', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { announcement_id: 'ann-1' },
        { announcement_id: 'ann-2' },
        { announcement_id: 'ann-3' },
      ]);

      const result = await getPinnedIds(mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('ann-1')).toBe(true);
      expect(result.has('ann-2')).toBe(true);
      expect(result.has('ann-3')).toBe(true);
    });

    it('should return empty Set when no pinned announcements', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([]);

      const result = await getPinnedIds(mockUserId);

      expect(result.size).toBe(0);
    });

    it('should return empty Set on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getPinnedIds(mockUserId);

      expect(result.size).toBe(0);
    });
  });

  describe('pinAnnouncement', () => {
    it('should create pin record if not already pinned', async () => {
      (directus.request as jest.Mock)
        .mockResolvedValueOnce([]) // Not already pinned
        .mockResolvedValueOnce({ id: 'new-pin' }); // Created

      await pinAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(2);
    });

    it('should not create duplicate pin', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([{ id: 'existing-pin' }]);

      await pinAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(pinAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('DB error');
    });
  });

  describe('unpinAnnouncement', () => {
    it('should delete pin record', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ deleted: 1 });

      await unpinAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

      await expect(unpinAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('Delete failed');
    });
  });

  // ==========================================
  // ARCHIVING TESTS
  // ==========================================

  describe('getArchivedIds', () => {
    it('should return a Set of archived announcement IDs', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { announcement_id: 'ann-1' },
        { announcement_id: 'ann-2' },
      ]);

      const result = await getArchivedIds(mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has('ann-1')).toBe(true);
      expect(result.has('ann-2')).toBe(true);
    });

    it('should return empty Set on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      const result = await getArchivedIds(mockUserId);

      expect(result.size).toBe(0);
    });
  });

  describe('archiveAnnouncement', () => {
    it('should create archive record if not already archived', async () => {
      (directus.request as jest.Mock)
        .mockResolvedValueOnce([]) // Not archived
        .mockResolvedValueOnce({ id: 'new-archive' }); // Created

      await archiveAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(2);
    });

    it('should not create duplicate archive', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([{ id: 'existing-archive' }]);

      await archiveAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(archiveAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('DB error');
    });
  });

  describe('unarchiveAnnouncement', () => {
    it('should delete archive record', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ deleted: 1 });

      await unarchiveAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

      await expect(unarchiveAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('Delete failed');
    });
  });

  // ==========================================
  // ACKNOWLEDGMENT TESTS
  // ==========================================

  describe('getAcknowledgedIds', () => {
    it('should return a Set of acknowledged announcement IDs', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([
        { announcement_id: 'ann-1' },
        { announcement_id: 'ann-2' },
        { announcement_id: 'ann-3' },
      ]);

      const result = await getAcknowledgedIds(mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
    });

    it('should return empty Set on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      const result = await getAcknowledgedIds(mockUserId);

      expect(result.size).toBe(0);
    });
  });

  describe('acknowledgeAnnouncement', () => {
    it('should create acknowledgment record if not already acknowledged', async () => {
      (directus.request as jest.Mock)
        .mockResolvedValueOnce([]) // Not acknowledged
        .mockResolvedValueOnce({ id: 'new-ack' }); // Created

      await acknowledgeAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(2);
    });

    it('should not create duplicate acknowledgment', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce([{ id: 'existing-ack' }]);

      await acknowledgeAnnouncement(mockAnnouncementId, mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      (directus.request as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(acknowledgeAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('DB error');
    });
  });

  // ==========================================
  // COMBINED STATES TESTS
  // ==========================================

  describe('getAllUserAnnouncementStates', () => {
    it('should fetch all states in parallel', async () => {
      // Mock three parallel requests
      (directus.request as jest.Mock)
        .mockResolvedValueOnce([{ announcement_id: 'pinned-1' }])
        .mockResolvedValueOnce([{ announcement_id: 'archived-1' }, { announcement_id: 'archived-2' }])
        .mockResolvedValueOnce([{ announcement_id: 'acked-1' }]);

      const result = await getAllUserAnnouncementStates(mockUserId);

      expect(result.pinnedIds.size).toBe(1);
      expect(result.pinnedIds.has('pinned-1')).toBe(true);

      expect(result.archivedIds.size).toBe(2);
      expect(result.archivedIds.has('archived-1')).toBe(true);
      expect(result.archivedIds.has('archived-2')).toBe(true);

      expect(result.acknowledgedIds.size).toBe(1);
      expect(result.acknowledgedIds.has('acked-1')).toBe(true);
    });

    it('should return empty sets on error', async () => {
      (directus.request as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getAllUserAnnouncementStates(mockUserId);

      expect(result.pinnedIds.size).toBe(0);
      expect(result.archivedIds.size).toBe(0);
      expect(result.acknowledgedIds.size).toBe(0);
    });

    it('should make 3 parallel requests', async () => {
      (directus.request as jest.Mock).mockResolvedValue([]);

      await getAllUserAnnouncementStates(mockUserId);

      expect(directus.request).toHaveBeenCalledTimes(3);
    });
  });
});
