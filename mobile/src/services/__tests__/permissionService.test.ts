/**
 * Tests for PermissionService
 *
 * Tests the permission syncing and checking functionality.
 */

import { permissionService } from '../permissionService';

// Mock the frappe module
jest.mock('../../api/frappe', () => ({
  auth: jest.fn(() => ({
    getLoggedInUser: jest.fn().mockResolvedValue('john@example.com'),
  })),
  getDocList: jest.fn(),
  getToken: jest.fn().mockResolvedValue('mock-token'),
}));

// Import mocked modules
import { auth, getDocList, getToken } from '../../api/frappe';
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetDocList = getDocList as jest.MockedFunction<typeof getDocList>;
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('PermissionService', () => {
  beforeEach(() => {
    // Reset service state before each test
    permissionService.reset();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should not be initialized before init() is called', () => {
      expect(permissionService.isInitialized()).toBe(false);
    });

    it('should initialize with empty permissions when user has no role', async () => {
      // Mock user with no role
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: null });

      await permissionService.init();

      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('students', 'read')).toBe(false);
    });

    it('should initialize with permissions from Directus', async () => {
      // Mock user with role
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });

      // Mock access table response (to get policy ID)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'access-1', role: 'role-123', policy: 'policy-456' }],
        }),
      });

      // Mock permissions response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: '1', role: null, collection: 'students', action: 'read', fields: null, permissions: null },
            { id: '2', role: null, collection: 'students', action: 'update', fields: ['name', 'email'], permissions: null },
            { id: '3', role: null, collection: 'announcements', action: 'read', fields: null, permissions: null },
          ],
        }),
      });

      await permissionService.init();

      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('students', 'read')).toBe(true);
      expect(permissionService.can('students', 'update')).toBe(true);
      expect(permissionService.can('students', 'delete')).toBe(false);
      expect(permissionService.can('announcements', 'read')).toBe(true);
      expect(permissionService.can('reports', 'read')).toBe(false);
    });

    it('should initialize with empty permissions when no policy is found', async () => {
      // Mock user with role
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });

      // Mock access table with no policy
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await permissionService.init();

      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('students', 'read')).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock user with role
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });

      // Mock failed fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await permissionService.init();

      // Should still be initialized (with empty permissions)
      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('students', 'read')).toBe(false);
    });

    it('should handle missing access token', async () => {
      // Mock user with role
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });

      // Mock no access token
      (getTokens as jest.Mock).mockResolvedValueOnce({ accessToken: null });

      await permissionService.init();

      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('students', 'read')).toBe(false);
    });
  });

  describe('can()', () => {
    beforeEach(async () => {
      // Set up initialized service with test permissions
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 'access-1', role: 'role-123', policy: 'policy-456' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { id: '1', collection: 'students', action: 'read', fields: null, permissions: null },
              { id: '2', collection: 'students', action: 'update', fields: ['name'], permissions: null },
              { id: '3', collection: 'announcements', action: 'read', fields: ['*'], permissions: null },
            ],
          }),
        });
      await permissionService.init();
    });

    it('should return true for permitted actions', () => {
      expect(permissionService.can('students', 'read')).toBe(true);
      expect(permissionService.can('students', 'update')).toBe(true);
      expect(permissionService.can('announcements', 'read')).toBe(true);
    });

    it('should return false for unpermitted actions', () => {
      expect(permissionService.can('students', 'delete')).toBe(false);
      expect(permissionService.can('students', 'create')).toBe(false);
      expect(permissionService.can('reports', 'read')).toBe(false);
    });

    it('should default to read action', () => {
      expect(permissionService.can('students')).toBe(true);
      expect(permissionService.can('reports')).toBe(false);
    });
  });

  describe('canField()', () => {
    beforeEach(async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 'access-1', role: 'role-123', policy: 'policy-456' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { id: '1', collection: 'students', action: 'read', fields: null, permissions: null }, // null = all fields
              { id: '2', collection: 'reports', action: 'read', fields: ['title', 'date'], permissions: null }, // specific fields
              { id: '3', collection: 'events', action: 'read', fields: ['*'], permissions: null }, // wildcard
            ],
          }),
        });
      await permissionService.init();
    });

    it('should return true for any field when fields is null (all fields)', () => {
      expect(permissionService.canField('students', 'name')).toBe(true);
      expect(permissionService.canField('students', 'email')).toBe(true);
      expect(permissionService.canField('students', 'any_field')).toBe(true);
    });

    it('should return true only for specified fields when explicit list', () => {
      expect(permissionService.canField('reports', 'title')).toBe(true);
      expect(permissionService.canField('reports', 'date')).toBe(true);
      expect(permissionService.canField('reports', 'content')).toBe(false);
    });

    it('should return true for any field when wildcard (*) is used', () => {
      expect(permissionService.canField('events', 'title')).toBe(true);
      expect(permissionService.canField('events', 'anything')).toBe(true);
    });

    it('should return false for collections without read permission', () => {
      expect(permissionService.canField('messages', 'content')).toBe(false);
    });
  });

  describe('getAccessibleCollections()', () => {
    it('should return empty array when not initialized', () => {
      expect(permissionService.getAccessibleCollections()).toEqual([]);
    });

    it('should return list of accessible collections', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 'access-1', role: 'role-123', policy: 'policy-456' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { id: '1', collection: 'students', action: 'read', fields: null, permissions: null },
              { id: '2', collection: 'announcements', action: 'read', fields: null, permissions: null },
              { id: '3', collection: 'events', action: 'create', fields: null, permissions: null },
            ],
          }),
        });
      await permissionService.init();

      const collections = permissionService.getAccessibleCollections();
      expect(collections).toContain('students');
      expect(collections).toContain('announcements');
      expect(collections).toContain('events');
      expect(collections).toHaveLength(3);
    });
  });

  describe('getConditions()', () => {
    it('should return row-level conditions for a collection', async () => {
      const rowFilter = { student_id: { _eq: '$CURRENT_USER' } };

      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 'access-1', role: 'role-123', policy: 'policy-456' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { id: '1', collection: 'grades', action: 'read', fields: null, permissions: rowFilter },
            ],
          }),
        });
      await permissionService.init();

      expect(permissionService.getConditions('grades', 'read')).toEqual(rowFilter);
      expect(permissionService.getConditions('grades', 'update')).toBeNull();
    });
  });

  describe('reset()', () => {
    it('should reset service state', async () => {
      (directus.request as jest.Mock).mockResolvedValueOnce({ role: 'role-123' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 'access-1', role: 'role-123', policy: 'policy-456' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { id: '1', collection: 'students', action: 'read', fields: null, permissions: null },
            ],
          }),
        });
      await permissionService.init();

      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('students', 'read')).toBe(true);

      permissionService.reset();

      expect(permissionService.isInitialized()).toBe(false);
      expect(permissionService.can('students', 'read')).toBe(false);
    });
  });

  describe('getMissingInfo()', () => {
    it('should return structured info about missing permissions', () => {
      const info = permissionService.getMissingInfo('reports', 'read');
      expect(info.collection).toBe('reports');
      expect(info.action).toBe('read');
      expect(info.message).toContain("Missing 'read' permission on 'reports'");
      expect(info.timestamp).toBeDefined();
    });

    it('should include field info when provided', () => {
      const info = permissionService.getMissingInfo('students', 'read', 'legajo_medico');
      expect(info.field).toBe('legajo_medico');
      expect(info.message).toContain("Missing field 'legajo_medico' read access on 'students'");
    });
  });
});
