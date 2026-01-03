import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChildren as useChildrenContext } from '../context/ChildrenContext';
import { useChildren as useChildrenApi } from '../api/hooks';
import { Student } from '../api/frappe';

/**
 * Session permissions derived from user and children data.
 * These are computed once and cached via useMemo.
 */
export interface SessionPermissions {
  /** User has at least one child registered */
  hasChildren: boolean;
  /** User can view report cards (boletines) - requires having children */
  canViewReports: boolean;
  /** User can request early pickup for at least one child */
  canRequestPickup: boolean;
  /** User is the primary guardian for at least one child */
  isPrimaryGuardian: boolean;
}

/**
 * Session state including user, children, and derived permissions.
 * This is the main interface for the useSession hook.
 */
export interface SessionState extends SessionPermissions {
  // Core state
  user: ReturnType<typeof useAuth>['user'];
  children: Student[];
  isAuthenticated: boolean;

  // Loading states
  isLoading: boolean;
  isAuthLoading: boolean;
  isChildrenLoading: boolean;

  // Error states
  childrenError: Error | null;

  // Filter state (convenience re-export)
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;

  // Helper methods
  getChildById: (id: string) => Student | undefined;
  getChildByName: (firstName: string) => Student | undefined;
}

/**
 * Centralized session hook that provides user, children, and derived permissions.
 *
 * This hook solves the problem of scattered user/children state across components
 * and ensures consistent access to the correct user ID (app_user.id, not frappe_user.id).
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { user, children, canViewReports, isLoading } = useSession();
 *
 *   if (isLoading) return <Loading />;
 *   if (!canViewReports) return <NoAccess />;
 *
 *   return <ReportsList children={children} />;
 * }
 * ```
 *
 * ## Why this hook exists
 *
 * Previously, each screen had to:
 * 1. Call useAuth() to get user
 * 2. Call useChildren() to get children
 * 3. Manually check permissions
 * 4. Handle loading states separately
 *
 * This led to bugs where:
 * - The wrong user.id was used (Frappe User ID vs app_user ID)
 * - Children weren't loaded when needed
 * - Permission logic was duplicated across screens
 *
 * ## Architecture
 *
 * ```
 * useSession()
 *   ├── useAuth()           → user, isAuthenticated, authLoading
 *   ├── useChildrenApi()    → children[], childrenLoading, childrenError
 *   ├── useChildrenContext()→ selectedChildId, setSelectedChildId
 *   └── useMemo()           → derived permissions (canViewReports, etc.)
 * ```
 */
export function useSession(): SessionState {
  // Core auth state
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Children data (automatically fetched when user is authenticated)
  const {
    data: children = [],
    isLoading: isChildrenLoading,
    error: childrenError,
  } = useChildrenApi();

  // Child selection state from context
  const { selectedChildId, setSelectedChildId } = useChildrenContext();

  // OPTIMIZED: Consolidated permissions and helper methods into single useMemo
  // All have the same dependency (children), so compute once
  const { permissions, getChildById, getChildByName } = useMemo(() => {
    const hasChildren = children.length > 0;

    return {
      permissions: {
        hasChildren,
        // Can view reports if user has children
        canViewReports: hasChildren,
        // Can request pickup - for now, assume all parents can pickup
        // In the future, this could check student_guardians.can_pickup
        canRequestPickup: hasChildren,
        // Is primary guardian - for now, assume first child relationship
        // In the future, this could check student_guardians.is_primary
        isPrimaryGuardian: hasChildren,
      } as SessionPermissions,
      // Helper methods
      getChildById: (id: string): Student | undefined => {
        return children.find(c => c.id === id);
      },
      getChildByName: (firstName: string): Student | undefined => {
        return children.find(c =>
          c.first_name.toLowerCase() === firstName.toLowerCase()
        );
      },
    };
  }, [children]);

  // Combined loading state
  const isLoading = isAuthLoading || (isAuthenticated && isChildrenLoading);

  return {
    // Core state
    user,
    children,
    isAuthenticated,

    // Loading states
    isLoading,
    isAuthLoading,
    isChildrenLoading,

    // Error states
    childrenError: childrenError as Error | null,

    // Filter state
    selectedChildId,
    setSelectedChildId,

    // Permissions
    ...permissions,

    // Helpers
    getChildById,
    getChildByName,
  };
}

/**
 * Hook to get the currently selected child, if any.
 * Convenience wrapper around useSession.
 */
export function useSelectedChild(): Student | null {
  const { children, selectedChildId } = useSession();

  if (!selectedChildId) return null;
  return children.find(c => c.id === selectedChildId) || null;
}
