/**
 * Tests for PermissionService
 *
 * Tests the permission syncing and checking functionality.
 * Note: The service has been migrated to use Frappe API.
 */

import { permissionService } from '../permissionService';

// Mock the frappe module
jest.mock('../../api/frappe', () => ({
  getFrappeApp: jest.fn(),
  getToken: jest.fn().mockResolvedValue(null),
  FRAPPE_URL: 'https://test.frappe.app',
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

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

    it('should initialize with empty permissions when no token', async () => {
      // With no token (mocked to return null), should initialize with empty permissions
      await permissionService.init();

      expect(permissionService.isInitialized()).toBe(true);
      expect(permissionService.can('Student', 'read')).toBe(false);
    });
  });

  describe('can()', () => {
    beforeEach(() => {
      // Reset to uninitialized state
      permissionService.reset();
    });

    it('should return false when not initialized', () => {
      expect(permissionService.can('Student', 'read')).toBe(false);
      expect(permissionService.can('Report', 'read')).toBe(false);
    });

    it('should default to read action when action not specified', () => {
      expect(permissionService.can('Student')).toBe(false);
    });
  });

  describe('canField()', () => {
    it('should return false when not initialized', () => {
      expect(permissionService.canField('Student', 'name')).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset service state', async () => {
      // Initialize first
      await permissionService.init();
      expect(permissionService.isInitialized()).toBe(true);

      // Reset
      permissionService.reset();
      expect(permissionService.isInitialized()).toBe(false);
    });
  });

  describe('getMissingInfo()', () => {
    it('should return structured info about missing permissions', () => {
      const info = permissionService.getMissingInfo('Report', 'read');
      expect(info.doctype).toBe('Report');
      expect(info.action).toBe('read');
      expect(info.message).toContain('Report');
      expect(info.timestamp).toBeDefined();
    });

    it('should include field info when provided', () => {
      const info = permissionService.getMissingInfo('Student', 'read', 'medical_file');
      expect(info.field).toBe('medical_file');
      expect(info.message).toContain('medical_file');
    });
  });
});
