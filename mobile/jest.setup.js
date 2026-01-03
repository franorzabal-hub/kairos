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

// Mock storage utilities
jest.mock('./src/utils/storage', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock the frappe client
jest.mock('./src/api/frappe', () => ({
  frappe: {
    db: jest.fn(),
    auth: jest.fn(),
    getDocList: jest.fn(),
    getDoc: jest.fn(),
    createDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getCount: jest.fn(),
  },
  // Convenience functions
  db: jest.fn(),
  auth: jest.fn(() => ({
    getLoggedInUser: jest.fn().mockResolvedValue('test@example.com'),
    login: jest.fn(),
    logout: jest.fn(),
  })),
  getDocList: jest.fn(),
  getDoc: jest.fn(),
  createDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getCount: jest.fn(),
  getAssetUrl: jest.fn((path) => path ? `https://test.frappe.app${path}` : null),
  // URL exports
  FRAPPE_URL: 'https://test.frappe.app',
  DIRECTUS_URL: 'https://test.frappe.app', // Backward compatibility alias
  // Token functions
  saveToken: jest.fn().mockResolvedValue(undefined),
  getToken: jest.fn().mockResolvedValue(null),
  clearToken: jest.fn().mockResolvedValue(undefined),
  // Backward compatibility aliases
  saveTokens: jest.fn().mockResolvedValue(undefined),
  getTokens: jest.fn().mockResolvedValue({ accessToken: null, refreshToken: null }),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  // Biometric functions
  isBiometricEnabled: jest.fn().mockResolvedValue(false),
  setBiometricEnabled: jest.fn().mockResolvedValue(undefined),
  clearBiometricSetting: jest.fn().mockResolvedValue(undefined),
  // Client helpers
  getFrappeApp: jest.fn(),
  resetFrappeClient: jest.fn(),
  // Backward compatibility - directus export
  directus: {
    db: jest.fn(),
    auth: jest.fn(),
    getDocList: jest.fn(),
    getDoc: jest.fn(),
    createDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
  },
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
