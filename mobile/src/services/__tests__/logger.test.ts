/**
 * Tests for Logger Service
 *
 * Tests the centralized logging functionality with different levels
 * and environment awareness.
 */

import { logger, LogLevel } from '../logger';

describe('Logger', () => {
  // Spy on console methods
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Reset min level to default
    logger.setMinLevel('debug');
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('basic logging', () => {
    it('should log debug messages', () => {
      logger.debug('TestContext', 'Debug message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[TestContext]');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('Debug message');
    });

    it('should log info messages', () => {
      logger.info('Auth', 'User logged in');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]');
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[Auth]');
    });

    it('should log warn messages', () => {
      logger.warn('API', 'Rate limit approaching');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
    });

    it('should log error messages', () => {
      logger.error('Database', 'Connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    });
  });

  describe('logging with data', () => {
    it('should include data object in log output', () => {
      const data = { userId: '123', action: 'login' };
      logger.info('Auth', 'User action', data);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        data
      );
    });

    it('should handle Error objects specially', () => {
      const error = new Error('Something went wrong');
      logger.error('API', 'Request failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        error.message,
        error.stack
      );
    });
  });

  describe('min level filtering', () => {
    it('should filter out debug when min level is info', () => {
      logger.setMinLevel('info');

      logger.debug('Test', 'Should not appear');
      logger.info('Test', 'Should appear');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });

    it('should filter out debug and info when min level is warn', () => {
      logger.setMinLevel('warn');

      logger.debug('Test', 'Nope');
      logger.info('Test', 'Nope');
      logger.warn('Test', 'Yes');
      logger.error('Test', 'Yes');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should only show errors when min level is error', () => {
      logger.setMinLevel('error');

      logger.debug('Test', 'Nope');
      logger.info('Test', 'Nope');
      logger.warn('Test', 'Nope');
      logger.error('Test', 'Only this');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('convenience methods', () => {
    describe('api()', () => {
      it('should log successful API calls as debug', () => {
        logger.api('GET', '/items/students', 200);

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('GET /items/students');
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('(200)');
      });

      it('should log 4xx errors as warn', () => {
        logger.api('POST', '/items/events', 403);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('returned 403');
      });

      it('should log errors with Error object', () => {
        const error = new Error('Network timeout');
        logger.api('GET', '/auth/me', undefined, error);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('failed');
      });
    });

    describe('navigation()', () => {
      it('should log navigation events', () => {
        logger.navigation('push', 'HomeScreen');

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('[Navigation]');
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('push -> HomeScreen');
      });

      it('should support different navigation actions', () => {
        logger.navigation('pop', 'DetailsScreen');
        logger.navigation('navigate', 'Settings');
        logger.navigation('reset', 'Login');

        expect(consoleDebugSpy).toHaveBeenCalledTimes(3);
      });
    });

    describe('userAction()', () => {
      it('should log user actions as info', () => {
        logger.userAction('button_press', { button: 'submit', screen: 'Login' });

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('[UserAction]');
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('button_press');
      });

      it('should work without details', () => {
        logger.userAction('logout');

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('performance()', () => {
      it('should log fast operations as debug', () => {
        logger.performance('fetchUsers', 150);

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        expect(consoleDebugSpy.mock.calls[0][0]).toContain('150ms');
      });

      it('should log slow operations (>1000ms) as warn', () => {
        logger.performance('heavyComputation', 2500);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('2500ms');
      });

      it('should log exactly 1000ms as debug (boundary)', () => {
        logger.performance('borderlineOp', 1000);

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });
  });
});
