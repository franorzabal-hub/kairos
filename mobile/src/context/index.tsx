/**
 * Context exports
 *
 * Split contexts for better separation of concerns:
 * - AuthContext: Authentication state (user, login, logout)
 * - ChildrenContext: Children/students state
 * - UIContext: UI state (filters, unread counts)
 */

// Individual contexts
export { AuthProvider, useAuth } from './AuthContext';
export { ChildrenProvider, useChildren, useChildrenList } from './ChildrenContext';
export { UIProvider, useUI, useFilters, useUnreadCounts } from './UIContext';
export type { FilterMode } from './UIContext';

// Re-export for backwards compatibility
// Note: Prefer using specific context hooks over useAppContext
export { AppProvider, useAppContext } from './AppContext';

// Combined provider for app root (convenience wrapper)
import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ChildrenProvider } from './ChildrenContext';
import { UIProvider } from './UIContext';

/**
 * CombinedProvider - Wraps all three contexts in correct order
 *
 * Use this at the app root for convenience.
 * Order: Auth (outermost) -> Children -> UI (innermost)
 */
export function CombinedProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChildrenProvider>
        <UIProvider>
          {children}
        </UIProvider>
      </ChildrenProvider>
    </AuthProvider>
  );
}
