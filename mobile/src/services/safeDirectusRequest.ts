/**
 * Safe Directus Request Wrapper
 *
 * Wraps Directus SDK requests to handle 403 errors gracefully.
 * Instead of crashing, returns a structured response with error info.
 *
 * @example
 * ```typescript
 * const { data, error, errorType } = await safeRequest(
 *   () => directus.request(readItems('reports', { ... })),
 *   'reports',
 *   'read'
 * );
 *
 * if (errorType === 'NO_PERMISSION') {
 *   return <LockedFeature nombre="Boletines" />;
 * }
 * ```
 */

import { permissionDebugger } from './permissionDebugger';
import { logger } from '../utils/logger';
import { DirectusError, isDirectusError } from '../types/directus';

// Error types for structured handling
export type ErrorType = 'NO_PERMISSION' | 'NOT_FOUND' | 'NETWORK' | 'UNKNOWN' | null;

// Result type for safe requests
export interface SafeRequestResult<T> {
  data: T | null;
  error: Error | null;
  errorType: ErrorType;
  errorMessage: string | null;
}

/**
 * Execute a Directus request safely, handling 403 without crashing.
 *
 * @param requestFn - Function that returns a Directus SDK promise
 * @param collection - Collection name (for logging)
 * @param action - Action being performed (for logging)
 * @returns Structured result with data or error info
 */
export async function safeRequest<T>(
  requestFn: () => Promise<T>,
  collection: string,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): Promise<SafeRequestResult<T>> {
  try {
    const data = await requestFn();
    return {
      data,
      error: null,
      errorType: null,
      errorMessage: null,
    };
  } catch (err: unknown) {
    // Extract status code from Directus error
    const directusErr = isDirectusError(err) ? err : null;
    const status = directusErr?.response?.status || directusErr?.status || directusErr?.errors?.[0]?.extensions?.code;
    const message = directusErr?.errors?.[0]?.message || directusErr?.message || 'Unknown error';

    // Handle 403 Forbidden
    if (status === 403 || status === 'FORBIDDEN') {
      logger.warn('safeRequest', `Permission denied: ${action} on ${collection}`, { message });
      permissionDebugger.log403(collection, action, message);

      return {
        data: null,
        error: err instanceof Error ? err : new Error(message),
        errorType: 'NO_PERMISSION',
        errorMessage: message,
      };
    }

    // Handle 404 Not Found
    if (status === 404 || status === 'NOT_FOUND') {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(message),
        errorType: 'NOT_FOUND',
        errorMessage: message,
      };
    }

    // Handle network errors
    if (message?.includes('Network') || message?.includes('fetch')) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(message),
        errorType: 'NETWORK',
        errorMessage: 'Error de conexión',
      };
    }

    // Unknown errors - still don't crash, but log
    logger.error('safeRequest', `Unexpected error on ${action} ${collection}`, err);

    return {
      data: null,
      error: err instanceof Error ? err : new Error(message),
      errorType: 'UNKNOWN',
      errorMessage: message,
    };
  }
}

/**
 * Helper to check if result has permission error.
 */
export function isPermissionError<T>(result: SafeRequestResult<T>): boolean {
  return result.errorType === 'NO_PERMISSION';
}

/**
 * Helper to check if result is successful.
 */
export function isSuccess<T>(result: SafeRequestResult<T>): result is SafeRequestResult<T> & { data: T } {
  return result.errorType === null && result.data !== null;
}

// Note: For type-safe convenience wrappers, use safeRequest directly with your
// typed Directus SDK calls:
//
// const { data, errorType } = await safeRequest<Announcement[]>(
//   () => directus.request(readItems('announcements', { ... })),
//   'announcements',
//   'read'
// );
