/**
 * Centralized Logging Service
 *
 * Provides structured logging with different levels and environment awareness.
 * In development: Logs to console with colors and context
 * In production: Can be extended to send to crash reporting services
 *
 * Usage:
 *   import { logger } from '../services/logger';
 *   logger.debug('Auth', 'User logged in', { userId: '123' });
 *   logger.error('API', 'Request failed', error);
 */

// React Native global for development mode detection
declare const __DEV__: boolean;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: Date;
}

// Colors for different log levels (ANSI codes for terminal)
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};
const RESET = '\x1b[0m';

class Logger {
  private isDev = __DEV__;
  private minLevel: LogLevel = 'debug';

  /**
   * Set minimum log level (useful for filtering in different environments)
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  /**
   * Check if a log level should be output based on minLevel
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Format and output a log entry
   */
  private log(level: LogLevel, context: string, message: string, data?: unknown) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      context,
      message,
      data,
      timestamp: new Date(),
    };

    // In development, output to console
    if (this.isDev) {
      const color = LEVEL_COLORS[level];
      const prefix = `${color}[${level.toUpperCase()}]${RESET} [${context}]`;

      if (data !== undefined) {
        if (data instanceof Error) {
          console[level](`${prefix} ${message}`, data.message, data.stack);
        } else {
          console[level](`${prefix} ${message}`, data);
        }
      } else {
        console[level](`${prefix} ${message}`);
      }
    }

    // In production, could send to crash reporting service
    // Example: if (!this.isDev && level === 'error') { Sentry.captureMessage(message); }
  }

  /**
   * Debug level - detailed information for debugging
   */
  debug(context: string, message: string, data?: unknown) {
    this.log('debug', context, message, data);
  }

  /**
   * Info level - general information about app flow
   */
  info(context: string, message: string, data?: unknown) {
    this.log('info', context, message, data);
  }

  /**
   * Warn level - potential issues that don't break functionality
   */
  warn(context: string, message: string, data?: unknown) {
    this.log('warn', context, message, data);
  }

  /**
   * Error level - errors that need attention
   */
  error(context: string, message: string, data?: unknown) {
    this.log('error', context, message, data);
  }

  /**
   * Log API request (convenience method)
   */
  api(method: string, endpoint: string, status?: number, error?: Error) {
    if (error) {
      this.error('API', `${method} ${endpoint} failed`, error);
    } else if (status && status >= 400) {
      this.warn('API', `${method} ${endpoint} returned ${status}`);
    } else {
      this.debug('API', `${method} ${endpoint}${status ? ` (${status})` : ''}`);
    }
  }

  /**
   * Log navigation event
   */
  navigation(action: 'push' | 'pop' | 'navigate' | 'reset', screen: string) {
    this.debug('Navigation', `${action} -> ${screen}`);
  }

  /**
   * Log user action (for analytics/debugging)
   */
  userAction(action: string, details?: Record<string, unknown>) {
    this.info('UserAction', action, details);
  }

  /**
   * Log performance metric
   */
  performance(operation: string, durationMs: number) {
    const level = durationMs > 1000 ? 'warn' : 'debug';
    this.log(level, 'Performance', `${operation} took ${durationMs}ms`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for testing
export type { LogLevel, LogEntry };
