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

// Maximum biometric attempts before lockout
const MAX_BIOMETRIC_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  biometricLockout: {
    isLocked: boolean;
    remainingTime: number;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAttempts, setBiometricAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(0);

  const isAuthenticated = user !== null;
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
        if (__DEV__) console.log('[AuthContext] ✅ Found guardian:', guardian.name);
        return guardianToAppUser(guardian);
      }

      if (__DEV__) console.log('[AuthContext] No guardian found for email:', email);
      return null;
    } catch (error: unknown) {
      if (__DEV__) console.log('[AuthContext] fetchGuardian error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  const handleBiometricFailure = useCallback(() => {
    const newAttempts = biometricAttempts + 1;
    setBiometricAttempts(newAttempts);

    if (newAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
      setLockoutEndTime(Date.now() + LOCKOUT_DURATION_MS);
      setRemainingLockoutTime(LOCKOUT_DURATION_MS);
      if (__DEV__) console.log('[AuthContext] Biometric lockout activated');
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
              if (__DEV__) console.log('[AuthContext] ⚠️ Fallback to Frappe user');
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
          // Token is invalid, clear it
          if (__DEV__) console.log('[AuthContext] Token validation failed:', authError);
          await clearToken();
          resetFrappeClient();
        }
      }
    } catch (error) {
      if (__DEV__) console.log('[AuthContext] No valid session');
      await clearToken();
      resetFrappeClient();
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
            if (__DEV__) console.log('[AuthContext] ⚠️ Fallback to Frappe user');
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
      const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
      if (__DEV__) console.error('[AuthContext] Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Logout from Frappe
      await auth().logout();
    } catch (error) {
      if (__DEV__) console.log('[AuthContext] Logout API call failed:', error);
    }

    // Clear local state regardless of API result
    await clearToken();
    resetFrappeClient();
    setUser(null);
    setBiometricAttempts(0);
    setLockoutEndTime(null);
  }, []);

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    biometricLockout: {
      isLocked,
      remainingTime: remainingLockoutTime,
    },
  }), [user, isAuthenticated, isLoading, login, logout, isLocked, remainingLockoutTime]);

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
