/**
 * Tests for safeFrappeRequest
 *
 * Tests the safe API wrapper that handles Frappe errors gracefully.
 */

import { safeRequest, isPermissionError, isSuccess, SafeRequestResult } from '../safeFrappeRequest';

describe('safeFrappeRequest', () => {
  describe('safeRequest', () => {
    it('should return data on successful request', async () => {
      const mockData = [{ name: 'STU-0001', student_name: 'Test' }];
      const requestFn = jest.fn().mockResolvedValue(mockData);

      const result = await safeRequest(requestFn, 'Student', 'read');

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(result.errorType).toBeNull();
      expect(result.errorMessage).toBeNull();
    });

    it('should handle 403 Forbidden errors', async () => {
      const error = {
        httpStatus: 403,
        message: 'You do not have permission to access this resource.',
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'Report', 'read');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.errorType).toBe('NO_PERMISSION');
    });

    it('should handle PermissionError from Frappe', async () => {
      const error = {
        exc_type: 'PermissionError',
        message: 'Access denied',
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'School Event', 'update');

      expect(result.errorType).toBe('NO_PERMISSION');
    });

    it('should handle 404 Not Found errors', async () => {
      const error = {
        httpStatus: 404,
        message: 'Document not found',
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'Student', 'read');

      expect(result.data).toBeNull();
      expect(result.errorType).toBe('NOT_FOUND');
      expect(result.errorMessage).toBe('Document not found');
    });

    it('should handle DoesNotExistError from Frappe', async () => {
      const error = {
        exc_type: 'DoesNotExistError',
        message: 'Student STU-0001 not found',
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'Student', 'read');

      expect(result.errorType).toBe('NOT_FOUND');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network request failed');
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'News', 'read');

      expect(result.data).toBeNull();
      expect(result.errorType).toBe('NETWORK');
      expect(result.errorMessage).toBe('Error de conexion');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('fetch failed');
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'School Event', 'read');

      expect(result.errorType).toBe('NETWORK');
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Something unexpected happened');
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'Conversation', 'create');

      expect(result.data).toBeNull();
      expect(result.errorType).toBe('UNKNOWN');
      expect(result.errorMessage).toBe('Something unexpected happened');
    });

    it('should handle Frappe _server_messages', async () => {
      const error = {
        httpStatus: 403,
        _server_messages: '["{\\"message\\": \\"First error message\\"}"]',
      };
      const requestFn = jest.fn().mockRejectedValue(error);

      const result = await safeRequest(requestFn, 'Report', 'delete');

      expect(result.errorType).toBe('NO_PERMISSION');
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
        data: { name: 'STU-0001' },
        error: null,
        errorType: null,
        errorMessage: null,
      };

      expect(isPermissionError(successResult)).toBe(false);
    });
  });

  describe('isSuccess', () => {
    it('should return true for successful results with data', () => {
      const result: SafeRequestResult<{ name: string }> = {
        data: { name: 'STU-0001' },
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
