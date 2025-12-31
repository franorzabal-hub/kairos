/**
 * Permission Service - Syncs and manages permissions from Directus
 *
 * This service fetches the user's role permissions from Directus at login
 * and provides fast lookups for UI/API permission checks.
 *
 * @example
 * ```typescript
 * await permissionService.init(directus);
 * permissionService.can('reports', 'read'); // true/false
 * permissionService.canField('students', 'legajo_medico'); // true/false
 * ```
 */

import { readMe } from '@directus/sdk';
import { directus } from '../api/directus';

// Directus permission structure
interface DirectusPermission {
  id: string;
  role: string | null;
  collection: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fields: string[] | null; // null means all fields ('*')
  permissions: Record<string, any> | null; // Row-level filter conditions
  validation: Record<string, any> | null;
}

// Internal permission map structure
interface PermissionEntry {
  fields: string[] | null; // null = all fields
  conditions: Record<string, any> | null; // Row-level conditions
}

type ActionMap = Partial<Record<'create' | 'read' | 'update' | 'delete', PermissionEntry>>;
type PermissionMap = Record<string, ActionMap>;

// Missing permission info for debugging
export interface MissingPermission {
  collection: string;
  action: string;
  field?: string;
  message?: string;
  timestamp: string;
}

class PermissionService {
  private permissions: PermissionMap | null = null;
  private roleId: string | null = null;
  private initialized = false;

  /**
   * Initialize permissions by fetching from Directus.
   * Call this after successful login.
   */
  async init(): Promise<void> {
    try {
      // Get current user's role using readMe
      const currentUser = await directus.request(
        readMe({ fields: ['role'] })
      ) as { role: string | null };

      if (!currentUser?.role) {
        if (__DEV__) console.warn('[PermissionService] User has no role assigned');
        this.permissions = {};
        this.initialized = true;
        return;
      }

      this.roleId = currentUser.role;

      // Fetch permissions for this role using raw fetch
      // (directus_permissions is a system collection not in typed schema)
      const response = await fetch(
        `${(directus as any).url}/permissions?filter[role][_eq]=${this.roleId}&limit=-1`,
        {
          headers: {
            'Authorization': `Bearer ${await (directus as any).getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }

      const result = await response.json();
      const permissions = (result.data || []) as DirectusPermission[];

      // Build permission map for fast lookups
      this.permissions = this.buildPermissionMap(permissions);
      this.initialized = true;

      if (__DEV__) {
        console.log('[PermissionService] Initialized with', Object.keys(this.permissions).length, 'collections');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[PermissionService] Failed to init:', error?.message);
      }
      // Initialize with empty permissions to prevent crashes
      this.permissions = {};
      this.initialized = true;
    }
  }

  /**
   * Build a fast-lookup permission map from Directus permissions array.
   */
  private buildPermissionMap(permissions: DirectusPermission[]): PermissionMap {
    const map: PermissionMap = {};

    for (const p of permissions) {
      if (!map[p.collection]) {
        map[p.collection] = {};
      }

      map[p.collection][p.action] = {
        fields: p.fields,
        conditions: p.permissions,
      };
    }

    return map;
  }

  /**
   * Check if user can perform an action on a collection.
   *
   * @param collection - Directus collection name
   * @param action - CRUD action
   * @returns true if permitted
   */
  can(collection: string, action: 'create' | 'read' | 'update' | 'delete' = 'read'): boolean {
    if (!this.initialized || !this.permissions) {
      if (__DEV__) console.warn('[PermissionService] Not initialized, denying access');
      return false;
    }

    return !!this.permissions[collection]?.[action];
  }

  /**
   * Check if user can read a specific field in a collection.
   *
   * @param collection - Directus collection name
   * @param field - Field name
   * @returns true if field is readable
   */
  canField(collection: string, field: string): boolean {
    if (!this.initialized || !this.permissions) {
      return false;
    }

    const readPermission = this.permissions[collection]?.read;
    if (!readPermission) return false;

    // null fields means all fields ('*')
    if (readPermission.fields === null) return true;

    return readPermission.fields.includes('*') || readPermission.fields.includes(field);
  }

  /**
   * Get the row-level conditions for a collection action.
   * Useful for understanding what filter Directus applies.
   */
  getConditions(collection: string, action: 'create' | 'read' | 'update' | 'delete' = 'read'): Record<string, any> | null {
    if (!this.permissions) return null;
    return this.permissions[collection]?.[action]?.conditions || null;
  }

  /**
   * Get info about a missing permission (for debugging).
   */
  getMissingInfo(collection: string, action: string, field?: string): MissingPermission {
    return {
      collection,
      action,
      field,
      message: field
        ? `Missing field '${field}' read access on '${collection}'`
        : `Missing '${action}' permission on '${collection}'`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if service is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all permissions (for debugging).
   */
  debug(): PermissionMap | null {
    if (__DEV__) {
      console.log('[PermissionService] Current permissions:', this.permissions);
    }
    return this.permissions;
  }

  /**
   * Get list of all collections user has access to.
   */
  getAccessibleCollections(): string[] {
    if (!this.permissions) return [];
    return Object.keys(this.permissions);
  }

  /**
   * Reset service state (call on logout).
   */
  reset(): void {
    this.permissions = null;
    this.roleId = null;
    this.initialized = false;
  }
}

// Singleton instance
export const permissionService = new PermissionService();
