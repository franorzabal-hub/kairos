/**
 * Permission Context - Provides permission checks throughout the app
 *
 * This context syncs with Frappe on login and provides hooks
 * for checking permissions in components.
 *
 * @example
 * ```tsx
 * // In a component
 * const { can, canField } = usePermissions();
 *
 * if (can('reports', 'read')) {
 *   return <ReportsList />;
 * }
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { permissionService } from '../services/permissionService';
import { permissionDebugger } from '../services/permissionDebugger';
import { useAuth } from './AuthContext';

// Action types for permission checks
type PermissionAction = 'create' | 'read' | 'update' | 'delete';

interface PermissionContextType {
  /** Whether permissions have been loaded */
  isLoaded: boolean;

  /** Whether permissions are currently loading */
  isLoading: boolean;

  /** Check if user can perform action on collection */
  can: (collection: string, action?: PermissionAction) => boolean;

  /** Check if user can read a specific field */
  canField: (collection: string, field: string) => boolean;

  /** Reload permissions from Frappe */
  reload: () => Promise<void>;

  /** Get list of collections user has access to */
  accessibleCollections: string[];
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessibleCollections, setAccessibleCollections] = useState<string[]>([]);

  // Load permissions when user authenticates
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      permissionService.reset();
      setIsLoaded(false);
      setAccessibleCollections([]);
      return;
    }

    setIsLoading(true);
    try {
      await permissionService.init();
      setAccessibleCollections(permissionService.getAccessibleCollections());
      setIsLoaded(true);
    } catch (error) {
      if (__DEV__) {
        console.error('[PermissionContext] Failed to load permissions:', error);
      }
      // Still mark as loaded so app doesn't hang
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Permission check with logging
  const can = useCallback(
    (collection: string, action: PermissionAction = 'read'): boolean => {
      const hasPermission = permissionService.can(collection, action);

      if (!hasPermission && __DEV__) {
        // Log missing permission for debugging
        permissionDebugger.logMissing(
          permissionService.getMissingInfo(collection, action)
        );
      }

      return hasPermission;
    },
    []
  );

  // Field-level permission check with logging
  const canField = useCallback(
    (collection: string, field: string): boolean => {
      const hasPermission = permissionService.canField(collection, field);

      if (!hasPermission && __DEV__) {
        permissionDebugger.logMissing(
          permissionService.getMissingInfo(collection, 'read', field)
        );
      }

      return hasPermission;
    },
    []
  );

  const value = useMemo<PermissionContextType>(
    () => ({
      isLoaded,
      isLoading,
      can,
      canField,
      reload: loadPermissions,
      accessibleCollections,
    }),
    [isLoaded, isLoading, can, canField, loadPermissions, accessibleCollections]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission checks in components.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { can, canField } = usePermissions();
 *
 *   // Check collection access
 *   if (!can('reports', 'read')) {
 *     return <LockedFeature nombre="Boletines" />;
 *   }
 *
 *   // Check field access
 *   const showMedicalInfo = canField('students', 'legajo_medico');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }

  return context;
}

/**
 * Hook with guard helper for conditional rendering.
 *
 * @example
 * ```tsx
 * const { guard } = usePermissionGuard();
 *
 * return (
 *   <View>
 *     {guard('reports', 'read', <ReportsList />)}
 *     {guard('attendance', 'read', <AttendanceView />, <LockedFeature />)}
 *   </View>
 * );
 * ```
 */
export function usePermissionGuard() {
  const { can, canField, isLoaded } = usePermissions();

  const guard = useCallback(
    (
      collection: string,
      action: PermissionAction = 'read',
      component: ReactNode,
      fallback: ReactNode = null
    ): ReactNode => {
      // While loading, show nothing or a placeholder
      if (!isLoaded) return fallback;

      return can(collection, action) ? component : fallback;
    },
    [can, isLoaded]
  );

  const guardField = useCallback(
    (
      collection: string,
      field: string,
      component: ReactNode,
      fallback: ReactNode = null
    ): ReactNode => {
      if (!isLoaded) return fallback;

      return canField(collection, field) ? component : fallback;
    },
    [canField, isLoaded]
  );

  return { guard, guardField, can, canField, isLoaded };
}
