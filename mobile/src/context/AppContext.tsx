import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Student, AppUser, directus, saveTokens, getTokens, clearTokens, isBiometricEnabled } from '../api/directus';
import { readMe, readItems } from '@directus/sdk';
import { clearAllReadStatus } from '../services/readStatusService';

// Extended filter mode for Novedades (announcements)
// 'all' = show everything except archived
// 'unread' = show only unread (non-archived)
// 'pinned' = show only user-pinned items
// 'archived' = show only archived items
export type FilterMode = 'unread' | 'all' | 'pinned' | 'archived';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AppContextType extends AuthContextType {
  // Children state
  children: Student[];
  setChildren: (children: Student[]) => void;

  // Global filter state
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;

  // Unread counts per tab (new 4-tab structure)
  unreadCounts: {
    inicio: number;      // Combined novedades + upcoming events
    agenda: number;      // All events
    mensajes: number;
    mishijos: number;    // Reports + attendance
    // Legacy keys for backwards compatibility
    novedades: number;
    eventos: number;
    cambios: number;
    boletines: number;
  };
  setUnreadCounts: (counts: Partial<AppContextType['unreadCounts']>) => void;
}

const defaultUnreadCounts = {
  inicio: 0,
  agenda: 0,
  mensajes: 0,
  mishijos: 0,
  // Legacy keys
  novedades: 0,
  eventos: 0,
  cambios: 0,
  boletines: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('unread');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCountsState] = useState(defaultUnreadCounts);

  const setUnreadCounts = useCallback((counts: Partial<AppContextType['unreadCounts']>) => {
    setUnreadCountsState(prev => ({ ...prev, ...counts }));
  }, []);

  const isAuthenticated = user !== null;

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Helper to fetch app_user for current user
  // The Directus permission filters app_users by directus_user_id = $CURRENT_USER
  // So we just need to fetch and find the one matching our email
  const fetchAppUser = async (email: string): Promise<AppUser | null> => {
    try {
      // Fetch app_users - the Directus permission will filter to current user's records
      const appUsers = await directus.request(
        readItems('app_users', {
          limit: 10, // Should return only user's own records due to permission
        })
      );

      if (!Array.isArray(appUsers) || appUsers.length === 0) {
        if (__DEV__) console.log('[fetchAppUser] No app_users returned');
        return null;
      }

      // Permission filters to current user, so we should only get our own record
      // First try to match by email, then fall back to first record
      let match = appUsers.find(u => u.email === email);

      // If no email match, use first record (permission ensures it's ours)
      if (!match && appUsers.length > 0) {
        match = appUsers[0];
      }

      if (match) {
        if (__DEV__) console.log('[fetchAppUser] ✅ Found app_user:', match.id);
        return match as AppUser;
      }

      return null;
    } catch (error: any) {
      if (__DEV__) console.log('[fetchAppUser] Error:', error?.message);
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      if (accessToken && refreshToken) {
        // Check if biometric authentication is enabled
        const biometricEnabled = await isBiometricEnabled();

        if (biometricEnabled) {
          // Verify device has biometric hardware and is enrolled
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Confirma tu identidad para continuar',
              cancelLabel: 'Cancelar',
              disableDeviceFallback: true,
            });

            if (!result.success) {
              // User cancelled or biometric failed - require manual login
              setIsLoading(false);
              return;
            }
          }
        }

        // Set tokens in the SDK so it can make authenticated requests
        await directus.setToken(accessToken);

        // Try to get current user with stored token
        const currentUser = await directus.request(readMe());

        if (currentUser && currentUser.email) {
          // Fetch the app_user record by email
          const appUser = await fetchAppUser(currentUser.email);

          if (appUser) {
            // Use app_user data (has correct ID for relations)
            setUser(appUser);
          } else {
            // Fallback: create minimal user from Directus data
            if (__DEV__) console.log('[checkAuthStatus] ⚠️ Fallback to Directus user - children query may fail');
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
      if (__DEV__) console.log('[checkAuthStatus] No valid session');
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Use the SDK's built-in login which handles token storage internally
      const result = await directus.login({ email, password });

      if (result.access_token && result.refresh_token) {
        // Save tokens to SecureStore for persistence across app restarts
        await saveTokens(result.access_token, result.refresh_token);

        // Get Directus user info
        const currentUser = await directus.request(readMe());

        // Fetch the app_user record by email
        const appUser = currentUser.email ? await fetchAppUser(currentUser.email) : null;

        if (appUser) {
          setUser(appUser);
        } else {
          // Fallback: create minimal user from Directus data
          if (__DEV__) console.log('[login] ⚠️ Fallback to Directus user - children query may fail');
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
    } catch (error: any) {
      if (__DEV__) console.error('[login] Failed:', error?.message);
      throw new Error(error.errors?.[0]?.message || 'Error de autenticación');
    }
  }, []);

  const logout = useCallback(async () => {
    // Clear read status before clearing user (need user.id for the API call)
    // This is non-critical - don't let it block logout
    if (user?.id) {
      try {
        await clearAllReadStatus(user.id);
      } catch (error) {
        // Non-critical - continue with logout even if this fails
        if (__DEV__) console.log('[logout] Failed to clear read status:', error);
      }
    }

    await clearTokens();
    setUser(null);
    setChildren([]);
    setUnreadCountsState(defaultUnreadCounts);
  }, [user?.id]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<AppContextType>(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    children,
    setChildren,
    filterMode,
    setFilterMode,
    selectedChildId,
    setSelectedChildId,
    unreadCounts,
    setUnreadCounts,
  }), [
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    children,
    filterMode,
    selectedChildId,
    unreadCounts,
    setUnreadCounts,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {childrenProp}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Auth hook
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useAppContext();
  return { user, isAuthenticated, isLoading, login, logout };
}

// Convenience hooks
export function useFilters() {
  const { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children } = useAppContext();
  return { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children };
}

export function useUnreadCounts() {
  const { unreadCounts, setUnreadCounts } = useAppContext();
  return { unreadCounts, setUnreadCounts };
}
