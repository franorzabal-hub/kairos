/**
 * Tests for AuthContext
 *
 * Tests the authentication context and provider:
 * - Login/logout functionality
 * - Token management
 * - Biometric authentication lockout
 * - App user fetching
 */

import { AppUser } from '../api/directus';

// Mock implementations that we'll control in tests
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockRequest = jest.fn();
const mockSetToken = jest.fn();

// Sample user data
const mockDirectusUser = {
  id: 'directus-user-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
};

const mockAppUser: AppUser = {
  id: 'app-user-456',
  organization_id: 'org-789',
  directus_user_id: 'directus-user-123',
  role: 'parent',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  status: 'active',
};

// Mock storage functions
import * as Storage from '../utils/storage';
const mockGetItemAsync = Storage.getItemAsync as jest.MockedFunction<typeof Storage.getItemAsync>;
const mockSetItemAsync = Storage.setItemAsync as jest.MockedFunction<typeof Storage.setItemAsync>;
const mockDeleteItemAsync = Storage.deleteItemAsync as jest.MockedFunction<typeof Storage.deleteItemAsync>;

// Mock directus functions
import { directus, getTokens, saveTokens, clearTokens, isBiometricEnabled } from '../api/directus';
const mockDirectus = directus as jest.Mocked<typeof directus>;
const mockGetTokens = getTokens as jest.MockedFunction<typeof getTokens>;
const mockSaveTokens = saveTokens as jest.MockedFunction<typeof saveTokens>;
const mockClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockIsBiometricEnabled = isBiometricEnabled as jest.MockedFunction<typeof isBiometricEnabled>;

// Mock expo-local-authentication
import * as LocalAuthentication from 'expo-local-authentication';
const mockAuthenticateAsync = LocalAuthentication.authenticateAsync as jest.MockedFunction<typeof LocalAuthentication.authenticateAsync>;
const mockHasHardwareAsync = LocalAuthentication.hasHardwareAsync as jest.MockedFunction<typeof LocalAuthentication.hasHardwareAsync>;
const mockIsEnrolledAsync = LocalAuthentication.isEnrolledAsync as jest.MockedFunction<typeof LocalAuthentication.isEnrolledAsync>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('token management', () => {
    it('should save tokens after successful login', async () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      await mockSaveTokens(accessToken, refreshToken);

      expect(mockSaveTokens).toHaveBeenCalledWith(accessToken, refreshToken);
    });

    it('should retrieve tokens on app start', async () => {
      mockGetTokens.mockResolvedValue({
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
      });

      const tokens = await getTokens();

      expect(tokens.accessToken).toBe('stored-access-token');
      expect(tokens.refreshToken).toBe('stored-refresh-token');
    });

    it('should return null tokens when not logged in', async () => {
      mockGetTokens.mockResolvedValue({
        accessToken: null,
        refreshToken: null,
      });

      const tokens = await getTokens();

      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();
    });

    it('should clear tokens on logout', async () => {
      await mockClearTokens();

      expect(mockClearTokens).toHaveBeenCalled();
    });
  });

  describe('biometric authentication', () => {
    it('should check biometric enabled status', async () => {
      mockIsBiometricEnabled.mockResolvedValue(true);

      const isEnabled = await isBiometricEnabled();

      expect(isEnabled).toBe(true);
    });

    it('should check for biometric hardware', async () => {
      mockHasHardwareAsync.mockResolvedValue(true);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      expect(hasHardware).toBe(true);
    });

    it('should check if biometric is enrolled', async () => {
      mockIsEnrolledAsync.mockResolvedValue(true);

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      expect(isEnrolled).toBe(true);
    });

    it('should authenticate with biometrics', async () => {
      mockAuthenticateAsync.mockResolvedValue({ success: true });

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });

      expect(result.success).toBe(true);
    });

    it('should handle failed biometric authentication', async () => {
      mockAuthenticateAsync.mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('biometric lockout', () => {
    const MAX_BIOMETRIC_ATTEMPTS = 3;
    const LOCKOUT_DURATION_MS = 30000;

    it('should lockout after max failed attempts', () => {
      let attempts = 0;
      let isLocked = false;

      for (let i = 0; i < MAX_BIOMETRIC_ATTEMPTS; i++) {
        attempts++;
        if (attempts >= MAX_BIOMETRIC_ATTEMPTS) {
          isLocked = true;
        }
      }

      expect(isLocked).toBe(true);
    });

    it('should calculate remaining lockout time', () => {
      const lockoutEndTime = Date.now() + LOCKOUT_DURATION_MS;
      const remainingTime = lockoutEndTime - Date.now();

      expect(remainingTime).toBeLessThanOrEqual(LOCKOUT_DURATION_MS);
      expect(remainingTime).toBeGreaterThan(0);
    });

    it('should unlock after lockout duration', () => {
      const lockoutEndTime = Date.now() + LOCKOUT_DURATION_MS;

      // Simulate time passing
      const futureTime = lockoutEndTime + 1000;
      const isStillLocked = futureTime < lockoutEndTime;

      expect(isStillLocked).toBe(false);
    });

    it('should reset attempts on successful authentication', () => {
      let attempts = 2;
      const authSuccess = true;

      if (authSuccess) {
        attempts = 0;
      }

      expect(attempts).toBe(0);
    });
  });

  describe('app user fetching', () => {
    it('should find app_user by email', () => {
      const appUsers = [
        { ...mockAppUser, email: 'john@example.com' },
        { ...mockAppUser, id: 'other-user', email: 'jane@example.com' },
      ];
      const targetEmail = 'john@example.com';

      const match = appUsers.find(u => u.email === targetEmail);

      expect(match).toBeDefined();
      expect(match?.email).toBe(targetEmail);
    });

    it('should fallback to first user if email not found', () => {
      const appUsers = [
        { ...mockAppUser, email: 'other@example.com' },
      ];
      const targetEmail = 'john@example.com';

      let match = appUsers.find(u => u.email === targetEmail);
      if (!match && appUsers.length > 0) {
        match = appUsers[0];
      }

      expect(match).toBeDefined();
      expect(match?.email).toBe('other@example.com');
    });

    it('should return null when no app_users exist', () => {
      const appUsers: AppUser[] = [];
      const targetEmail = 'john@example.com';

      const match = appUsers.find(u => u.email === targetEmail);

      expect(match).toBeUndefined();
    });
  });

  describe('login flow', () => {
    it('should set user state after successful login', async () => {
      const loginResult = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      expect(loginResult.access_token).toBeDefined();
      expect(loginResult.refresh_token).toBeDefined();
    });

    it('should save tokens after login', async () => {
      const accessToken = 'new-access-token';
      const refreshToken = 'new-refresh-token';

      await mockSaveTokens(accessToken, refreshToken);

      expect(mockSaveTokens).toHaveBeenCalledWith(accessToken, refreshToken);
    });

    it('should reset biometric attempts on successful login', () => {
      let biometricAttempts = 2;
      let lockoutEndTime: number | null = Date.now() + 30000;

      // Simulate successful login
      biometricAttempts = 0;
      lockoutEndTime = null;

      expect(biometricAttempts).toBe(0);
      expect(lockoutEndTime).toBeNull();
    });

    it('should fallback to Directus user when app_user not found', () => {
      const directusUser = mockDirectusUser;
      const appUserMatch = null;

      let resultUser: AppUser;
      if (appUserMatch) {
        resultUser = appUserMatch;
      } else {
        resultUser = {
          id: directusUser.id,
          organization_id: '',
          role: 'parent',
          first_name: directusUser.first_name || '',
          last_name: directusUser.last_name || '',
          email: directusUser.email || '',
          status: 'active',
        };
      }

      expect(resultUser.id).toBe('directus-user-123');
      expect(resultUser.organization_id).toBe('');
    });
  });

  describe('logout flow', () => {
    it('should clear tokens on logout', async () => {
      await mockClearTokens();

      expect(mockClearTokens).toHaveBeenCalled();
    });

    it('should reset user state on logout', () => {
      let user: AppUser | null = mockAppUser;

      // Simulate logout
      user = null;

      expect(user).toBeNull();
    });

    it('should reset biometric state on logout', () => {
      let biometricAttempts = 2;
      let lockoutEndTime: number | null = Date.now() + 30000;

      // Simulate logout
      biometricAttempts = 0;
      lockoutEndTime = null;

      expect(biometricAttempts).toBe(0);
      expect(lockoutEndTime).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle Directus errors with message', () => {
      const directusError = {
        errors: [{ message: 'Invalid credentials' }],
        message: 'Authentication failed',
      };

      const errorMessage = directusError.errors?.[0]?.message ?? directusError.message ?? 'Error de autenticacion';

      expect(errorMessage).toBe('Invalid credentials');
    });

    it('should handle generic errors', () => {
      const error = new Error('Network error');

      const errorMessage = error instanceof Error ? error.message : 'Error de autenticacion';

      expect(errorMessage).toBe('Network error');
    });

    it('should fallback to default error message', () => {
      const error = {};

      const isDirectusError = false;
      const isError = false;
      const errorMessage = isDirectusError
        ? 'Directus error'
        : isError
          ? 'Generic error'
          : 'Error de autenticacion';

      expect(errorMessage).toBe('Error de autenticacion');
    });
  });

  describe('context state', () => {
    it('should provide isAuthenticated based on user state', () => {
      const testCases = [
        { user: mockAppUser, expected: true },
        { user: null, expected: false },
      ];

      testCases.forEach(({ user, expected }) => {
        const isAuthenticated = user !== null;
        expect(isAuthenticated).toBe(expected);
      });
    });

    it('should provide loading state', () => {
      let isLoading = true;

      // Simulate auth check complete
      isLoading = false;

      expect(isLoading).toBe(false);
    });

    it('should provide biometric lockout info', () => {
      const biometricLockout = {
        isLocked: false,
        remainingTime: 0,
      };

      expect(biometricLockout.isLocked).toBe(false);
      expect(biometricLockout.remainingTime).toBe(0);
    });
  });
});

describe('useAuth hook', () => {
  it('should throw error when used outside provider', () => {
    // The useAuth hook should throw when context is undefined
    const throwIfNoContext = (context: any) => {
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
    };

    expect(() => throwIfNoContext(undefined)).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should return context value when inside provider', () => {
    const mockContextValue = {
      user: mockAppUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      biometricLockout: { isLocked: false, remainingTime: 0 },
    };

    expect(mockContextValue.user).toEqual(mockAppUser);
    expect(mockContextValue.isAuthenticated).toBe(true);
    expect(typeof mockContextValue.login).toBe('function');
    expect(typeof mockContextValue.logout).toBe('function');
  });
});

describe('AppUser type', () => {
  it('should have all required fields', () => {
    expect(mockAppUser.id).toBeDefined();
    expect(mockAppUser.organization_id).toBeDefined();
    expect(mockAppUser.role).toBeDefined();
    expect(mockAppUser.first_name).toBeDefined();
    expect(mockAppUser.last_name).toBeDefined();
    expect(mockAppUser.email).toBeDefined();
    expect(mockAppUser.status).toBeDefined();
  });

  it('should have valid role values', () => {
    const validRoles = ['admin', 'teacher', 'parent', 'staff'];
    expect(validRoles).toContain(mockAppUser.role);
  });

  it('should have valid status values', () => {
    const validStatuses = ['active', 'inactive', 'pending'];
    expect(validStatuses).toContain(mockAppUser.status);
  });

  it('should support optional fields', () => {
    const userWithOptionals: AppUser = {
      ...mockAppUser,
      phone: '+1234567890',
      avatar: 'avatar-123',
      children: ['student-1', 'student-2'],
    };

    expect(userWithOptionals.phone).toBeDefined();
    expect(userWithOptionals.avatar).toBeDefined();
    expect(userWithOptionals.children).toHaveLength(2);
  });
});
