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

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default),
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}));

// Mock @directus/sdk
jest.mock('@directus/sdk', () => ({
  createDirectus: jest.fn(() => ({
    with: jest.fn().mockReturnThis(),
    request: jest.fn(),
    login: jest.fn(),
    setToken: jest.fn(),
  })),
  rest: jest.fn(),
  authentication: jest.fn(),
  readItems: jest.fn(),
  readItem: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  readMe: jest.fn(),
}));

// Mock storage utilities
jest.mock('./src/utils/storage', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock the directus client
jest.mock('./src/api/directus', () => ({
  directus: {
    request: jest.fn(),
    login: jest.fn(),
    setToken: jest.fn(),
  },
  DIRECTUS_URL: 'https://test.directus.app',
  saveTokens: jest.fn().mockResolvedValue(undefined),
  getTokens: jest.fn().mockResolvedValue({ accessToken: null, refreshToken: null }),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  isBiometricEnabled: jest.fn().mockResolvedValue(false),
  setBiometricEnabled: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock('./src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
