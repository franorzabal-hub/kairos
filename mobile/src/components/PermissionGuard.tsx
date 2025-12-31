/**
 * PermissionGuard - Wrapper component for permission-based rendering
 *
 * Wraps content that requires specific permissions. If the user
 * doesn't have permission, shows a fallback or nothing.
 *
 * @example
 * ```tsx
 * // Hide if no permission
 * <PermissionGuard collection="reports" action="read">
 *   <ReportsList />
 * </PermissionGuard>
 *
 * // Show locked UI if no permission
 * <PermissionGuard collection="reports" action="read" showLocked>
 *   <ReportsList />
 * </PermissionGuard>
 *
 * // Custom fallback
 * <PermissionGuard
 *   collection="reports"
 *   action="read"
 *   fallback={<Text>Próximamente</Text>}
 * >
 *   <ReportsList />
 * </PermissionGuard>
 * ```
 */

import React, { ReactNode } from 'react';
import { usePermissions } from '../context/PermissionContext';
import LockedFeature from './LockedFeature';

type PermissionAction = 'create' | 'read' | 'update' | 'delete';

interface PermissionGuardProps {
  /** Directus collection name */
  collection: string;

  /** Permission action to check (default: 'read') */
  action?: PermissionAction;

  /** Content to render if permitted */
  children: ReactNode;

  /** Content to render if not permitted (default: null) */
  fallback?: ReactNode;

  /** Show LockedFeature component if not permitted */
  showLocked?: boolean;

  /** Human-readable name for LockedFeature */
  featureName?: string;
}

export default function PermissionGuard({
  collection,
  action = 'read',
  children,
  fallback = null,
  showLocked = false,
  featureName,
}: PermissionGuardProps) {
  const { can, isLoaded } = usePermissions();

  // While permissions are loading, show nothing to prevent flash
  if (!isLoaded) {
    return null;
  }

  // Check permission
  if (can(collection, action)) {
    return <>{children}</>;
  }

  // Permission denied
  if (__DEV__) {
    console.warn(`🔒 PermissionGuard blocked: ${action} on ${collection}`);
  }

  // Show locked feature UI
  if (showLocked) {
    return <LockedFeature nombre={featureName} collection={collection} />;
  }

  // Show custom fallback or nothing
  return <>{fallback}</>;
}

/**
 * FieldGuard - Guard for field-level permissions
 *
 * @example
 * ```tsx
 * <FieldGuard collection="students" field="legajo_medico">
 *   <MedicalInfo />
 * </FieldGuard>
 * ```
 */
interface FieldGuardProps {
  /** Directus collection name */
  collection: string;

  /** Field name to check */
  field: string;

  /** Content to render if field is readable */
  children: ReactNode;

  /** Content to render if field is not readable */
  fallback?: ReactNode;
}

export function FieldGuard({
  collection,
  field,
  children,
  fallback = null,
}: FieldGuardProps) {
  const { canField, isLoaded } = usePermissions();

  if (!isLoaded) {
    return null;
  }

  if (canField(collection, field)) {
    return <>{children}</>;
  }

  if (__DEV__) {
    console.warn(`🔒 FieldGuard blocked: ${field} on ${collection}`);
  }

  return <>{fallback}</>;
}
