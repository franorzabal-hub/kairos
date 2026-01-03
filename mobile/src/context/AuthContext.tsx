/**
 * AuthContext - Focused context for authentication state
 *
 * Handles:
 * - User authentication (login/logout)
 * - Token management
 * - Biometric authentication
 * - Guardian (AppUser) fetching
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  AppUser,
  Guardian,
  auth,
  getDocList,
  saveToken,
  getToken,
  clearToken,
  isBiometricEnabled,
  setBiometricEnabled,
  resetFrappeClient,
  guardianToAppUser,
} from '../api/frappe';
import { logger } from '../utils/logger';

// Error classification helper
type ErrorType = 'network' | 'permission' | 'auth_expired' | 'unknown';

function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('connection')) {
      return 'network';
    }
    // Permission/authorization errors
    if (message.includes('permission') || message.includes('forbidden') || message.includes('403')) {
      return 'permission';
    }
    // Token/session expired
    if (message.includes('expired') || message.includes('invalid token') || message.includes('401') || message.includes('unauthorized')) {
      return 'auth_expired';
    }
  }
  return 'unknown';
}

// Maximum biometric attempts before lockout
const MAX_BIOMETRIC_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

// Base type with common fields
interface AuthContextBase {
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  biometricLockout: {
    isLocked: boolean;
    remainingTime: number;
  };
}

// Discriminated union for auth states
type AuthState =
  | { isAuthenticated: false; user: null }
  | { isAuthenticated: true; user: AppUser };

type AuthContextType = AuthContextBase & AuthState;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAttempts, setBiometricAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(0);

  const isLocked = lockoutEndTime !== null && Date.now() < lockoutEndTime;

  // Lockout timer
  useEffect(() => {
    if (!lockoutEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, lockoutEndTime - Date.now());
      setRemainingLockoutTime(remaining);

      if (remaining === 0) {
        setLockoutEndTime(null);
        setBiometricAttempts(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Helper to fetch Guardian for current user
  const fetchGuardian = async (email: string): Promise<AppUser | null> => {
    try {
      // Fetch guardian by email
      const guardians = await getDocList<Guardian>('Guardian', {
        filters: [['email', '=', email]],
        fields: ['name', 'user', 'guardian_name', 'first_name', 'last_name', 'email', 'phone', 'status', 'institution'],
        limit: 1,
      });

      if (guardians.length > 0) {
        const guardian = guardians[0];
        logger.debug('AuthContext', 'Found guardian:', guardian.name);
        return guardianToAppUser(guardian);
      }

      logger.debug('AuthContext', 'No guardian found for email:', email);
      return null;
    } catch (error: unknown) {
      const errorType = classifyError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log with appropriate severity based on error type
      switch (errorType) {
        case 'network':
          logger.warn('AuthContext', 'Guardian fetch failed due to network', { email, error: errorMessage });
          break;
        case 'permission':
          logger.warn('AuthContext', 'Guardian fetch failed due to permissions', { email, error: errorMessage });
          break;
        default:
          logger.error('AuthContext', 'Guardian fetch failed unexpectedly', { email, errorType, error: errorMessage });
      }

      return null;
    }
  };

  const handleBiometricFailure = useCallback(() => {
    const newAttempts = biometricAttempts + 1;
    setBiometricAttempts(newAttempts);

    if (newAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
      setLockoutEndTime(Date.now() + LOCKOUT_DURATION_MS);
      setRemainingLockoutTime(LOCKOUT_DURATION_MS);
      logger.warn('AuthContext', 'Biometric lockout activated', { attempts: newAttempts, lockoutDurationMs: LOCKOUT_DURATION_MS });
    }
  }, [biometricAttempts]);

  const checkAuthStatus = async () => {
    try {
      const token = await getToken();
      if (token) {
        const biometricEnabled = await isBiometricEnabled();

        // Biometric auth is only available on native platforms
        if (biometricEnabled && Platform.OS !== 'web') {
          // Check lockout status
          if (isLocked) {
            setIsLoading(false);
            return;
          }

          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Confirma tu identidad para continuar',
              cancelLabel: 'Cancelar',
              disableDeviceFallback: true,
            });

            if (!result.success) {
              handleBiometricFailure();
              setIsLoading(false);
              return;
            }

            // Reset attempts on success
            setBiometricAttempts(0);
          }
        }

        // Get current user info from Frappe
        try {
          const currentUser = await auth().getLoggedInUser();

          if (currentUser) {
            const appUser = await fetchGuardian(currentUser);

            if (appUser) {
              setUser(appUser);
            } else {
              // Fallback: create minimal user from email
              logger.debug('AuthContext', 'Fallback to Frappe user (no guardian found)');
              setUser({
                id: currentUser,
                organization_id: '',
                role: 'parent',
                first_name: '',
                last_name: '',
                email: currentUser,
                status: 'active',
              });
            }
          }
        } catch (authError) {
          const errorType = classifyError(authError);
          const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';

          // Only clear token on auth-related errors, not network errors
          if (errorType === 'network') {
            // Network error - don't clear token, let user retry
            logger.warn('AuthContext', 'Token validation failed due to network, preserving session', { error: errorMessage });
            // User can retry when network is available
          } else if (errorType === 'auth_expired') {
            // Token is expired or invalid - clear it
            logger.info('AuthContext', 'Token expired, clearing session');
            await clearToken();
            resetFrappeClient();
          } else {
            // Unknown error - log and clear token to be safe
            logger.error('AuthContext', 'Token validation failed unexpectedly', { errorType, error: errorMessage });
            await clearToken();
            resetFrappeClient();
          }
        }
      }
    } catch (error) {
      const errorType = classifyError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorType === 'network') {
        // Network error during initial check - don't clear token
        logger.warn('AuthContext', 'Auth status check failed due to network', { error: errorMessage });
      } else {
        // Other errors - clear session
        logger.info('AuthContext', 'No valid session, clearing token', { errorType, error: errorMessage });
        await clearToken();
        resetFrappeClient();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Login with Frappe
      const result = await auth().loginWithUsernamePassword({
        username: email,
        password: password,
      });

      if (result.message) {
        // Frappe returns the user email in the message on successful login
        // For token-based auth, we need to get an API key
        // For now, we'll use session-based auth which uses cookies

        // Try to get current user
        const currentUser = await auth().getLoggedInUser();

        if (currentUser) {
          // Save a session indicator (Frappe uses cookies for session)
          await saveToken('session_active');

          const appUser = await fetchGuardian(currentUser);

          if (appUser) {
            setUser(appUser);
          } else {
            logger.debug('AuthContext', 'Fallback to Frappe user during login (no guardian found)');
            setUser({
              id: currentUser,
              organization_id: '',
              role: 'parent',
              first_name: '',
              last_name: '',
              email: currentUser,
              status: 'active',
            });
          }

          // Reset biometric attempts on successful login
          setBiometricAttempts(0);
          setLockoutEndTime(null);
        } else {
          throw new Error('Login succeeded but could not get user info');
        }
      } else {
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de autenticacion';
      const errorType = classifyError(error);
      logger.error('AuthContext', 'Login failed', { errorType, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Logout from Frappe
      await auth().logout();
    } catch (error) {
      // Log warning if server logout fails, but continue with local cleanup
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('AuthContext', 'Server logout failed, continuing with local cleanup', { error: errorMessage });
    }

    // Clear local state regardless of API result
    await clearToken();
    resetFrappeClient();
    setUser(null);
    setBiometricAttempts(0);
    setLockoutEndTime(null);
  }, []);

  const contextValue = useMemo<AuthContextType>(() => {
    const base = {
      isLoading,
      login,
      logout,
      biometricLockout: {
        isLocked,
        remainingTime: remainingLockoutTime,
      },
    };

    // Discriminated union: TypeScript now knows user and isAuthenticated are linked
    if (user !== null) {
      return { ...base, user, isAuthenticated: true as const };
    }
    return { ...base, user: null, isAuthenticated: false as const };
  }, [user, isLoading, login, logout, isLocked, remainingLockoutTime]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export for use in other contexts that need user state
export { AuthContext };
