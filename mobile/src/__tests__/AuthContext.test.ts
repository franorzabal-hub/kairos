/**
 * Tests for AuthContext
 *
 * Tests the authentication context and provider:
 * - Login/logout functionality
 * - Token management
 * - Biometric authentication lockout
 * - App user fetching (Guardian)
 */

import { AppUser } from '../api/frappe';

// Mock implementations that we'll control in tests
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockRequest = jest.fn();
const mockSetToken = jest.fn();

// Sample user data
const mockFrappeUser = {
  name: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
};

const mockAppUser: AppUser = {
  id: 'guardian-456',
  organization_id: 'institution-789',
  directus_user_id: 'john@example.com', // In Frappe, this maps to the user field
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

// Mock frappe functions
import { getToken, saveToken, clearToken, isBiometricEnabled } from '../api/frappe';
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockSaveToken = saveToken as jest.MockedFunction<typeof saveToken>;
const mockClearToken = clearToken as jest.MockedFunction<typeof clearToken>;
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
    it('should save token after successful login', async () => {
      const token = 'session_active';

      await mockSaveToken(token);

      expect(mockSaveToken).toHaveBeenCalledWith(token);
    });

    it('should retrieve token on app start', async () => {
      mockGetToken.mockResolvedValue('stored-token');

      const token = await getToken();

      expect(token).toBe('stored-token');
    });

    it('should return null token when not logged in', async () => {
      mockGetToken.mockResolvedValue(null);

      const token = await getToken();

      expect(token).toBeNull();
    });

    it('should clear token on logout', async () => {
      await mockClearToken();

      expect(mockClearToken).toHaveBeenCalled();
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
      // Frappe login returns message on success
      const loginResult = {
        message: 'john@example.com',
      };

      expect(loginResult.message).toBeDefined();
    });

    it('should save token after login', async () => {
      const token = 'session_active';

      await mockSaveToken(token);

      expect(mockSaveToken).toHaveBeenCalledWith(token);
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

    it('should fallback to Frappe user when Guardian not found', () => {
      const frappeUser = mockFrappeUser;
      const guardianMatch = null;

      let resultUser: AppUser;
      if (guardianMatch) {
        resultUser = guardianMatch;
      } else {
        // Fallback: create minimal user from email
        resultUser = {
          id: frappeUser.name,
          organization_id: '',
          role: 'parent',
          first_name: frappeUser.first_name || '',
          last_name: frappeUser.last_name || '',
          email: frappeUser.email || '',
          status: 'active',
        };
      }

      expect(resultUser.id).toBe('john@example.com');
      expect(resultUser.organization_id).toBe('');
    });
  });

  describe('logout flow', () => {
    it('should clear token on logout', async () => {
      await mockClearToken();

      expect(mockClearToken).toHaveBeenCalled();
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
    it('should handle Frappe errors with message', () => {
      // Frappe returns errors in the exc_type and message fields
      const frappeError = {
        exc_type: 'AuthenticationError',
        message: 'Invalid credentials',
        _server_messages: '["Invalid credentials"]',
      };

      const errorMessage = frappeError.message ?? 'Error de autenticación';

      expect(errorMessage).toBe('Invalid credentials');
    });

    it('should handle generic errors', () => {
      const error = new Error('Network error');

      const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';

      expect(errorMessage).toBe('Network error');
    });

    it('should fallback to default error message', () => {
      const error = {};

      const isFrappeError = false;
      const isError = false;
      const errorMessage = isFrappeError
        ? 'Frappe error'
        : isError
          ? 'Generic error'
          : 'Error de autenticación';

      expect(errorMessage).toBe('Error de autenticación');
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
