/**
 * Tests for safeDirectusRequest
 *
 * Tests the safe API wrapper that handles 403 errors gracefully.
 */

import { safeRequest, isPermissionError, isSuccess, SafeRequestResult } from '../safeDirectusRequest';

// Mock the permissionDebugger module
jest.mock('../permissionDebugger', () => ({
  permissionDebugger: {
    log403: jest.fn(),
  },
}));

describe('safeDirectusRequest', () => {
  describe('safeRequest', () => {
    it('should return data on successful request', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      const requestFn = jest.fn().mockResolvedValue(mockData);

      const result = await safeRequest(requestFn, 'students', 'read');

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(result.errorType).toBeNull();
      expect(result.errorMessage).toBeNull();
    });

    it('should handle 403 Forbidden errors', async () => {
      const error = {
        response: { status: 403 },
        errors: [{ message: 'You don\'t have permission to access this.' }],
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'reports', 'read');

      expect(result.data).toBeNull();
      // Error is wrapped in new Error() if not an Error instance
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("don't have permission");
      expect(result.errorType).toBe('NO_PERMISSION');
      expect(result.errorMessage).toContain("don't have permission");
    });

    it('should handle FORBIDDEN error code from Directus', async () => {
      const error = {
        errors: [{
          extensions: { code: 'FORBIDDEN' },
          message: 'Access denied'
        }],
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'events', 'update');

      expect(result.errorType).toBe('NO_PERMISSION');
    });

    it('should handle 404 Not Found errors', async () => {
      const error = {
        response: { status: 404 },
        message: 'Item not found',
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'students', 'read');

      expect(result.data).toBeNull();
      expect(result.errorType).toBe('NOT_FOUND');
      expect(result.errorMessage).toBe('Item not found');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network request failed');
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'announcements', 'read');

      expect(result.data).toBeNull();
      expect(result.errorType).toBe('NETWORK');
      expect(result.errorMessage).toBe('Error de conexión');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('fetch failed');
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'events', 'read');

      expect(result.errorType).toBe('NETWORK');
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Something unexpected happened');
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'conversations', 'create');

      expect(result.data).toBeNull();
      expect(result.errorType).toBe('UNKNOWN');
      expect(result.errorMessage).toBe('Something unexpected happened');
    });

    it('should use first error message from Directus errors array', async () => {
      const error = {
        response: { status: 403 },
        errors: [
          { message: 'First error message' },
          { message: 'Second error message' },
        ],
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'reports', 'delete');

      expect(result.errorMessage).toBe('First error message');
    });
  });

  describe('isPermissionError', () => {
    it('should return true for permission errors', () => {
      const result: SafeRequestResult<any> = {
        data: null,
        error: new Error('403'),
        errorType: 'NO_PERMISSION',
        errorMessage: 'Forbidden',
      };

      expect(isPermissionError(result)).toBe(true);
    });

    it('should return false for other error types', () => {
      const networkResult: SafeRequestResult<any> = {
        data: null,
        error: new Error('Network'),
        errorType: 'NETWORK',
        errorMessage: 'Network error',
      };

      const notFoundResult: SafeRequestResult<any> = {
        data: null,
        error: new Error('404'),
        errorType: 'NOT_FOUND',
        errorMessage: 'Not found',
      };

      expect(isPermissionError(networkResult)).toBe(false);
      expect(isPermissionError(notFoundResult)).toBe(false);
    });

    it('should return false for successful results', () => {
      const successResult: SafeRequestResult<any> = {
        data: { id: '1' },
        error: null,
        errorType: null,
        errorMessage: null,
      };

      expect(isPermissionError(successResult)).toBe(false);
    });
  });

  describe('isSuccess', () => {
    it('should return true for successful results with data', () => {
      const result: SafeRequestResult<{ id: string }> = {
        data: { id: '1' },
        error: null,
        errorType: null,
        errorMessage: null,
      };

      expect(isSuccess(result)).toBe(true);
    });

    it('should return false when errorType is present', () => {
      const result: SafeRequestResult<any> = {
        data: null,
        error: new Error('test'),
        errorType: 'UNKNOWN',
        errorMessage: 'error',
      };

      expect(isSuccess(result)).toBe(false);
    });

    it('should return false when data is null', () => {
      const result: SafeRequestResult<any> = {
        data: null,
        error: null,
        errorType: null,
        errorMessage: null,
      };

      expect(isSuccess(result)).toBe(false);
    });
  });
});
