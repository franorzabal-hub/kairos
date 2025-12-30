import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Student, AppUser, directus, saveTokens, getTokens, clearTokens } from '../api/directus';
import { readMe, readItems } from '@directus/sdk';
import { clearAllReadStatus } from '../services/readStatusService';

type FilterMode = 'unread' | 'all';

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

  // Unread counts per tab
  unreadCounts: {
    novedades: number;
    eventos: number;
    mensajes: number;
    cambios: number;
    boletines: number;
  };
  setUnreadCounts: (counts: Partial<AppContextType['unreadCounts']>) => void;
}

const defaultUnreadCounts = {
  novedades: 0,
  eventos: 0,
  mensajes: 0,
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

  // Helper to fetch app_user by email (more reliable than directus_user_id)
  const fetchAppUser = async (email: string): Promise<AppUser | null> => {
    try {
      const appUsers = await directus.request(
        readItems('app_users', {
          filter: { email: { _eq: email } },
          limit: 1,
        })
      );
      return appUsers.length > 0 ? (appUsers[0] as AppUser) : null;
    } catch (error) {
      // Silently fail - user might not have permission to read app_users
      console.log('Could not fetch app_user, using Directus user data');
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      if (accessToken && refreshToken) {
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
      console.log('No valid session found');
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Use the SDK's built-in login which handles token storage internally
      const result = await directus.login({ email, password });

      if (result.access_token && result.refresh_token) {
        // Also save tokens to SecureStore for persistence across app restarts
        await saveTokens(result.access_token, result.refresh_token);

        // Get Directus user info
        const currentUser = await directus.request(readMe());

        // Fetch the app_user record by email
        const appUser = currentUser.email ? await fetchAppUser(currentUser.email) : null;

        if (appUser) {
          // Use app_user data (has correct ID for relations)
          setUser(appUser);
        } else {
          // Fallback: create minimal user from Directus data
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
      console.error('Login failed:', error);
      throw new Error(error.errors?.[0]?.message || 'Error de autenticación');
    }
  };

  const logout = async () => {
    await clearTokens();
    await clearAllReadStatus();
    setUser(null);
    setChildren([]);
    setUnreadCountsState(defaultUnreadCounts);
  };

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
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
