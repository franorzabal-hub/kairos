/**
 * Safe Frappe Request Wrapper
 *
 * Wraps Frappe API requests to handle errors gracefully.
 * Instead of crashing, returns a structured response with error info.
 *
 * @example
 * ```typescript
 * const { data, error, errorType } = await safeRequest(
 *   () => getDocList<Report>('Report', { filters: [['student', '=', studentId]] }),
 *   'Report',
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
 * Check if an error is a Frappe API error
 * Frappe errors typically have an exc_type or _server_messages field
 */
function isFrappeError(err: unknown): err is {
  httpStatus?: number;
  httpStatusText?: string;
  message?: string;
  exception?: string;
  exc_type?: string;
  _server_messages?: string;
} {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('httpStatus' in err || 'exception' in err || 'exc_type' in err || '_server_messages' in err)
  );
}

/**
 * Extract error details from Frappe error response
 */
function extractFrappeErrorDetails(err: unknown): {
  status: number | string | null;
  message: string;
} {
  if (isFrappeError(err)) {
    // Try to parse _server_messages for detailed error
    let message = err.message || err.exception || 'Unknown error';
    if (err._server_messages) {
      try {
        const serverMessages = JSON.parse(err._server_messages);
        if (Array.isArray(serverMessages) && serverMessages.length > 0) {
          const firstMessage = JSON.parse(serverMessages[0]);
          message = firstMessage.message || message;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    return {
      status: err.httpStatus || null,
      message,
    };
  }

  if (err instanceof Error) {
    return {
      status: null,
      message: err.message,
    };
  }

  return {
    status: null,
    message: String(err),
  };
}

/**
 * Execute a Frappe request safely, handling errors without crashing.
 *
 * @param requestFn - Function that returns a Frappe API promise
 * @param doctype - DocType name (for logging)
 * @param action - Action being performed (for logging)
 * @returns Structured result with data or error info
 */
export async function safeRequest<T>(
  requestFn: () => Promise<T>,
  doctype: string,
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
    const { status, message } = extractFrappeErrorDetails(err);

    // Check for exc_type in Frappe errors
    const excType = isFrappeError(err) ? err.exc_type : undefined;

    // Handle 403 Forbidden / PermissionError
    if (
      status === 403 ||
      excType === 'PermissionError' ||
      message?.includes('PermissionError') ||
      message?.includes('Not permitted') ||
      message?.includes('insufficient_permission')
    ) {
      logger.warn('safeRequest', `Permission denied: ${action} on ${doctype}`, { message });
      permissionDebugger.log403(doctype, action, message);

      return {
        data: null,
        error: err instanceof Error ? err : new Error(message),
        errorType: 'NO_PERMISSION',
        errorMessage: message,
      };
    }

    // Handle 404 Not Found / DoesNotExistError
    if (
      status === 404 ||
      excType === 'DoesNotExistError' ||
      message?.includes('DoesNotExistError') ||
      message?.includes('does not exist') ||
      message?.includes('Not Found')
    ) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(message),
        errorType: 'NOT_FOUND',
        errorMessage: message,
      };
    }

    // Handle network errors
    if (
      message?.includes('Network') ||
      message?.includes('fetch') ||
      message?.includes('Failed to fetch') ||
      message?.includes('NetworkError')
    ) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(message),
        errorType: 'NETWORK',
        errorMessage: 'Error de conexion',
      };
    }

    // Unknown errors - still don't crash, but log
    logger.error('safeRequest', `Unexpected error on ${action} ${doctype}`, err);

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
// typed Frappe API calls:
//
// const { data, errorType } = await safeRequest<News[]>(
//   () => getDocList<News>('News', { filters: [['status', '=', 'Published']] }),
//   'News',
//   'read'
// );
