/**
 * AuthContext - Focused context for authentication state
 *
 * Handles:
 * - User authentication (login/logout)
 * - Token management
 * - Biometric authentication
 * - AppUser fetching
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppUser, directus, saveTokens, getTokens, clearTokens, isBiometricEnabled, setBiometricEnabled } from '../api/directus';
import { readMe, readItems } from '@directus/sdk';
import { isDirectusError } from '../types/directus';

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

  // Helper to fetch app_user for current user
  const fetchAppUser = async (email: string): Promise<AppUser | null> => {
    try {
      const appUsers = await directus.request(
        readItems('app_users', { limit: 10 })
      );

      if (!Array.isArray(appUsers) || appUsers.length === 0) {
        if (__DEV__) console.log('[AuthContext] No app_users returned');
        return null;
      }

      let match = appUsers.find(u => u.email === email);
      if (!match && appUsers.length > 0) {
        match = appUsers[0];
      }

      if (match) {
        if (__DEV__) console.log('[AuthContext] ✅ Found app_user:', match.id);
        return match as AppUser;
      }

      return null;
    } catch (error: unknown) {
      if (__DEV__) console.log('[AuthContext] fetchAppUser error:', error instanceof Error ? error.message : 'Unknown error');
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
      const { accessToken, refreshToken } = await getTokens();
      if (accessToken && refreshToken) {
        const biometricEnabled = await isBiometricEnabled();

        if (biometricEnabled) {
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

        await directus.setToken(accessToken);
        const currentUser = await directus.request(readMe());

        if (currentUser && currentUser.email) {
          const appUser = await fetchAppUser(currentUser.email);

          if (appUser) {
            setUser(appUser);
          } else {
            if (__DEV__) console.log('[AuthContext] ⚠️ Fallback to Directus user');
            setUser({
              id: currentUser.id,
              organization_id: '',
              role: 'parent',
              first_name: currentUser.first_name || '',
              last_name: currentUser.last_name || '',
              email: currentUser.email || '',
              status: 'active',
            });
          }
        }
      }
    } catch (error) {
      if (__DEV__) console.log('[AuthContext] No valid session');
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await directus.login({ email, password });

      if (result.access_token && result.refresh_token) {
        await saveTokens(result.access_token, result.refresh_token);
        const currentUser = await directus.request(readMe());
        const appUser = currentUser.email ? await fetchAppUser(currentUser.email) : null;

        if (appUser) {
          setUser(appUser);
        } else {
          if (__DEV__) console.log('[AuthContext] ⚠️ Fallback to Directus user');
          setUser({
            id: currentUser.id,
            organization_id: '',
            role: 'parent',
            first_name: currentUser.first_name || '',
            last_name: currentUser.last_name || '',
            email: currentUser.email || '',
            status: 'active',
          });
        }

        // Reset biometric attempts on successful login
        setBiometricAttempts(0);
        setLockoutEndTime(null);
      }
    } catch (error: unknown) {
      const errorMessage = isDirectusError(error)
        ? error.errors?.[0]?.message ?? error.message ?? 'Error de autenticación'
        : error instanceof Error ? error.message : 'Error de autenticación';
      if (__DEV__) console.error('[AuthContext] Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
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
