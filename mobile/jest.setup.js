/**
 * Jest setup file - runs before each test file
 *
 * Contains global mocks for service tests.
 * Uses ts-jest (no babel-preset-expo) to avoid reanimated issues.
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock __DEV__ global
global.__DEV__ = true;

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
