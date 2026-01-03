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

// Mock the frappe module
jest.mock('../../api/frappe', () => ({
  getDocList: jest.fn(),
  createDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

import { getDocList, createDoc, deleteDoc } from '../../api/frappe';

// Create mock references
const mockGetDocList = getDocList as jest.MockedFunction<typeof getDocList>;
const mockCreateDoc = createDoc as jest.MockedFunction<typeof createDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;

describe('AnnouncementActionsService', () => {
  const mockUserId = 'user-123';
  const mockAnnouncementId = 'NEWS-0001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // PINNING TESTS
  // ==========================================

  describe('getPinnedIds', () => {
    it('should return a Set of pinned announcement IDs', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { news: 'NEWS-0001' },
        { news: 'NEWS-0002' },
        { news: 'NEWS-0003' },
      ]);

      const result = await getPinnedIds(mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('NEWS-0001')).toBe(true);
      expect(result.has('NEWS-0002')).toBe(true);
      expect(result.has('NEWS-0003')).toBe(true);
    });

    it('should return empty Set when no pinned announcements', async () => {
      mockGetDocList.mockResolvedValueOnce([]);

      const result = await getPinnedIds(mockUserId);

      expect(result.size).toBe(0);
    });

    it('should return empty Set on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPinnedIds(mockUserId);

      expect(result.size).toBe(0);
    });
  });

  describe('pinAnnouncement', () => {
    it('should create pin record if not already pinned', async () => {
      mockGetDocList.mockResolvedValueOnce([]); // Not already pinned
      mockCreateDoc.mockResolvedValueOnce({ name: 'new-pin' }); // Created

      await pinAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate pin', async () => {
      mockGetDocList.mockResolvedValueOnce([{ name: 'existing-pin' }]);

      await pinAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('DB error'));

      await expect(pinAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('DB error');
    });
  });

  describe('unpinAnnouncement', () => {
    it('should delete pin record', async () => {
      mockGetDocList.mockResolvedValueOnce([{ name: 'pin-record' }]);
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await unpinAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(unpinAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('Delete failed');
    });
  });

  // ==========================================
  // ARCHIVING TESTS
  // ==========================================

  describe('getArchivedIds', () => {
    it('should return a Set of archived announcement IDs', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { news: 'NEWS-0001' },
        { news: 'NEWS-0002' },
      ]);

      const result = await getArchivedIds(mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has('NEWS-0001')).toBe(true);
      expect(result.has('NEWS-0002')).toBe(true);
    });

    it('should return empty Set on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Error'));

      const result = await getArchivedIds(mockUserId);

      expect(result.size).toBe(0);
    });
  });

  describe('archiveAnnouncement', () => {
    it('should create archive record if not already archived', async () => {
      mockGetDocList.mockResolvedValueOnce([]); // Not archived
      mockCreateDoc.mockResolvedValueOnce({ name: 'new-archive' }); // Created

      await archiveAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate archive', async () => {
      mockGetDocList.mockResolvedValueOnce([{ name: 'existing-archive' }]);

      await archiveAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('DB error'));

      await expect(archiveAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('DB error');
    });
  });

  describe('unarchiveAnnouncement', () => {
    it('should delete archive record', async () => {
      mockGetDocList.mockResolvedValueOnce([{ name: 'archive-record' }]);
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await unarchiveAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(unarchiveAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('Delete failed');
    });
  });

  // ==========================================
  // ACKNOWLEDGMENT TESTS
  // ==========================================

  describe('getAcknowledgedIds', () => {
    it('should return a Set of acknowledged announcement IDs', async () => {
      mockGetDocList.mockResolvedValueOnce([
        { news: 'NEWS-0001' },
        { news: 'NEWS-0002' },
        { news: 'NEWS-0003' },
      ]);

      const result = await getAcknowledgedIds(mockUserId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
    });

    it('should return empty Set on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('Error'));

      const result = await getAcknowledgedIds(mockUserId);

      expect(result.size).toBe(0);
    });
  });

  describe('acknowledgeAnnouncement', () => {
    it('should create acknowledgment record if not already acknowledged', async () => {
      mockGetDocList.mockResolvedValueOnce([]); // Not acknowledged
      mockCreateDoc.mockResolvedValueOnce({ name: 'new-ack' }); // Created

      await acknowledgeAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate acknowledgment', async () => {
      mockGetDocList.mockResolvedValueOnce([{ name: 'existing-ack' }]);

      await acknowledgeAnnouncement(mockAnnouncementId, mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(1);
      expect(mockCreateDoc).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      mockGetDocList.mockRejectedValueOnce(new Error('DB error'));

      await expect(acknowledgeAnnouncement(mockAnnouncementId, mockUserId)).rejects.toThrow('DB error');
    });
  });

  // ==========================================
  // COMBINED STATES TESTS
  // ==========================================

  describe('getAllUserAnnouncementStates', () => {
    it('should fetch all states in parallel', async () => {
      // Mock three parallel requests
      mockGetDocList
        .mockResolvedValueOnce([{ news: 'NEWS-0001' }])
        .mockResolvedValueOnce([{ news: 'NEWS-0002' }, { news: 'NEWS-0003' }])
        .mockResolvedValueOnce([{ news: 'NEWS-0004' }]);

      const result = await getAllUserAnnouncementStates(mockUserId);

      expect(result.pinnedIds.size).toBe(1);
      expect(result.pinnedIds.has('NEWS-0001')).toBe(true);

      expect(result.archivedIds.size).toBe(2);
      expect(result.archivedIds.has('NEWS-0002')).toBe(true);
      expect(result.archivedIds.has('NEWS-0003')).toBe(true);

      expect(result.acknowledgedIds.size).toBe(1);
      expect(result.acknowledgedIds.has('NEWS-0004')).toBe(true);
    });

    it('should return empty sets on error', async () => {
      mockGetDocList.mockRejectedValue(new Error('Network error'));

      const result = await getAllUserAnnouncementStates(mockUserId);

      expect(result.pinnedIds.size).toBe(0);
      expect(result.archivedIds.size).toBe(0);
      expect(result.acknowledgedIds.size).toBe(0);
    });

    it('should make 3 parallel requests', async () => {
      mockGetDocList.mockResolvedValue([]);

      await getAllUserAnnouncementStates(mockUserId);

      expect(mockGetDocList).toHaveBeenCalledTimes(3);
    });
  });
});
