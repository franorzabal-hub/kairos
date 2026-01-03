/**
 * AppContext - Backwards-compatible wrapper
 *
 * This file maintains backwards compatibility with existing code
 * that uses useAppContext(). New code should prefer the split contexts:
 * - useAuth() for authentication
 * - useChildren() for children state
 * - useUI() for filters and unread counts
 *
 * @deprecated Prefer using specific context hooks
 */
import React, { createContext, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { Student, AppUser } from '../api/frappe';
import { clearAllReadStatus } from '../services/readStatusService';

// Import split contexts
import { AuthProvider, useAuth } from './AuthContext';
import { ChildrenProvider, useChildren } from './ChildrenContext';
import { UIProvider, useUI, FilterMode } from './UIContext';

// Re-export for backwards compatibility
export type { FilterMode };
export { useAuth };

interface AppContextType {
  // Auth state
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Children state
  children: Student[];
  setChildren: (children: Student[]) => void;

  // UI state
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
  unreadCounts: {
    inicio: number;
    agenda: number;
    mensajes: number;
    mishijos: number;
    novedades: number;
    eventos: number;
    cambios: number;
    boletines: number;
  };
  setUnreadCounts: (counts: Partial<AppContextType['unreadCounts']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppContextBridge - Internal component that bridges split contexts
 */
function AppContextBridge({ children: childrenProp }: { children: ReactNode }) {
  const auth = useAuth();
  const childrenCtx = useChildren();
  const ui = useUI();

  // Clear read status on logout (enhanced logout)
  const enhancedLogout = useCallback(async () => {
    if (auth.user?.id) {
      try {
        await clearAllReadStatus(auth.user.id);
      } catch (error) {
        if (__DEV__) console.log('[AppContext] Failed to clear read status:', error);
      }
    }
    // Reset children and UI state
    childrenCtx.setChildren([]);
    ui.resetUnreadCounts();
    // Call original logout
    await auth.logout();
  }, [auth, childrenCtx, ui]);

  // Combine all contexts into single value for backwards compatibility
  const contextValue = useMemo<AppContextType>(() => ({
    // Auth
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: auth.login,
    logout: enhancedLogout,

    // Children
    children: childrenCtx.children,
    setChildren: childrenCtx.setChildren,
    selectedChildId: childrenCtx.selectedChildId,
    setSelectedChildId: childrenCtx.setSelectedChildId,

    // UI
    filterMode: ui.filterMode,
    setFilterMode: ui.setFilterMode,
    unreadCounts: ui.unreadCounts,
    setUnreadCounts: ui.setUnreadCounts,
  }), [auth, childrenCtx, ui, enhancedLogout]);

  return (
    <AppContext.Provider value={contextValue}>
      {childrenProp}
    </AppContext.Provider>
  );
}

/**
 * AppProvider - Main provider that wraps all contexts
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChildrenProvider>
        <UIProvider>
          <AppContextBridge>
            {children}
          </AppContextBridge>
        </UIProvider>
      </ChildrenProvider>
    </AuthProvider>
  );
}

/**
 * @deprecated Prefer using specific hooks: useAuth, useChildren, useUI
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Legacy convenience hooks - these now delegate to split contexts
// Kept for backwards compatibility

/**
 * @deprecated Use useAuth from AuthContext instead
 */
export function useAuthLegacy() {
  const { user, isAuthenticated, isLoading, login, logout } = useAppContext();
  return { user, isAuthenticated, isLoading, login, logout };
}

/**
 * @deprecated Use useUI from UIContext instead
 */
export function useFilters() {
  const { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children } = useAppContext();
  return { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children };
}

/**
 * @deprecated Use useUnreadCounts from UIContext instead
 */
export function useUnreadCounts() {
  const { unreadCounts, setUnreadCounts } = useAppContext();
  return { unreadCounts, setUnreadCounts };
}
