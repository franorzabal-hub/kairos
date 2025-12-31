/**
 * Logger utility for production-safe logging
 *
 * - debug/info: Only logs in development mode (__DEV__)
 * - warn/error: Always logs (production-safe)
 *
 * Usage:
 * ```typescript
 * import { logger } from '../utils/logger';
 *
 * logger.debug('Debug message', { data });  // Only in __DEV__
 * logger.info('Info message');              // Only in __DEV__
 * logger.warn('Warning message');           // Always logs
 * logger.error('Error message', error);     // Always logs
 * ```
 */

type LogArgs = unknown[];

export const logger = {
  /**
   * Debug-level logging - only in development
   */
  debug: (...args: LogArgs): void => {
    if (__DEV__) console.log('[DEBUG]', ...args);
  },

  /**
   * Info-level logging - only in development
   */
  info: (...args: LogArgs): void => {
    if (__DEV__) console.log('[INFO]', ...args);
  },

  /**
   * Warning-level logging - always logs
   */
  warn: (...args: LogArgs): void => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error-level logging - always logs
   */
  error: (...args: LogArgs): void => {
    console.error('[ERROR]', ...args);
  },
};

export default logger;
