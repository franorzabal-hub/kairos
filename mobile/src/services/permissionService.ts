/**
 * Permission Service - Syncs and manages permissions from Frappe
 *
 * This service fetches the user's role permissions from Frappe at login
 * and provides fast lookups for UI/API permission checks.
 *
 * @example
 * ```typescript
 * await permissionService.init();
 * permissionService.can('Report', 'read'); // true/false
 * permissionService.canField('Student', 'medical_file'); // true/false
 * ```
 */

import { getFrappeApp, getToken, FRAPPE_URL } from '../api/frappe';
import { logger } from '../utils/logger';

// Frappe permission structure
interface FrappeDocPerm {
  name: string;
  parent: string; // DocType name
  role: string;
  permlevel: number;
  read: 0 | 1;
  write: 0 | 1;
  create: 0 | 1;
  delete: 0 | 1;
  submit: 0 | 1;
  cancel: 0 | 1;
  amend: 0 | 1;
  report: 0 | 1;
  export: 0 | 1;
  import: 0 | 1;
  share: 0 | 1;
  print: 0 | 1;
  email: 0 | 1;
  if_owner: 0 | 1;
}

// Internal permission map structure
interface PermissionEntry {
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  ifOwner: boolean;
}

type PermissionMap = Record<string, PermissionEntry>;

// Missing permission info for debugging
export interface MissingPermission {
  doctype: string;
  action: string;
  field?: string;
  message?: string;
  timestamp: string;
  wasLoadError: boolean;
}

class PermissionService {
  private permissions: PermissionMap | null = null;
  private userRoles: string[] = [];
  private initialized = false;
  private loadError: Error | null = null;

  /**
   * Initialize permissions by fetching from Frappe.
   * Call this after successful login.
   */
  async init(): Promise<void> {
    try {
      const token = await getToken();
      if (!token) {
        logger.warn('PermissionService', 'No token available');
        this.permissions = {};
        this.initialized = true;
        return;
      }

      // Fetch current user's roles
      const userResponse = await fetch(
        `${FRAPPE_URL}/api/method/frappe.auth.get_logged_user`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error(`Failed to get logged user: ${userResponse.status}`);
      }

      const userResult = await userResponse.json();
      const userName = userResult.message;

      if (!userName) {
        logger.warn('PermissionService', 'No user found');
        this.permissions = {};
        this.initialized = true;
        return;
      }

      // Fetch user's roles
      const rolesResponse = await fetch(
        `${FRAPPE_URL}/api/method/frappe.client.get_list?doctype=Has Role&filters=[["parent","=","${userName}"]]&fields=["role"]&limit_page_length=0`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!rolesResponse.ok) {
        throw new Error(`Failed to fetch roles: ${rolesResponse.status}`);
      }

      const rolesResult = await rolesResponse.json();
      this.userRoles = (rolesResult.message || []).map((r: { role: string }) => r.role);

      if (this.userRoles.length === 0) {
        logger.warn('PermissionService', 'User has no roles assigned');
        this.permissions = {};
        this.initialized = true;
        return;
      }

      // Fetch DocPerms for user's roles
      // In Frappe, permissions are defined per DocType in DocPerm child table
      const rolesFilter = this.userRoles.map(r => `"${r}"`).join(',');
      const permsResponse = await fetch(
        `${FRAPPE_URL}/api/method/frappe.client.get_list?doctype=DocPerm&filters=[["role","in",[${rolesFilter}]],["permlevel","=",0]]&fields=["parent","role","read","write","create","delete","if_owner"]&limit_page_length=0`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!permsResponse.ok) {
        throw new Error(`Failed to fetch permissions: ${permsResponse.status}`);
      }

      const permsResult = await permsResponse.json();
      const docPerms = (permsResult.message || []) as Array<{
        parent: string;
        role: string;
        read: 0 | 1;
        write: 0 | 1;
        create: 0 | 1;
        delete: 0 | 1;
        if_owner: 0 | 1;
      }>;

      // Build permission map for fast lookups
      this.permissions = this.buildPermissionMap(docPerms);
      this.initialized = true;

      logger.debug('PermissionService', `Initialized with ${Object.keys(this.permissions).length} DocTypes`);
    } catch (error: unknown) {
      logger.error('PermissionService', 'Failed to initialize permissions', error);
      // Initialize with empty permissions to prevent crashes
      this.permissions = {};
      this.loadError = error instanceof Error ? error : new Error(String(error));
      this.initialized = true;
    }
  }

  /**
   * Build a fast-lookup permission map from Frappe DocPerms.
   * Merges permissions from all roles (OR logic).
   */
  private buildPermissionMap(docPerms: Array<{
    parent: string;
    role: string;
    read: 0 | 1;
    write: 0 | 1;
    create: 0 | 1;
    delete: 0 | 1;
    if_owner: 0 | 1;
  }>): PermissionMap {
    const map: PermissionMap = {};

    for (const p of docPerms) {
      const doctype = p.parent;

      if (!map[doctype]) {
        map[doctype] = {
          read: false,
          write: false,
          create: false,
          delete: false,
          ifOwner: false,
        };
      }

      // OR logic: if any role has permission, user has permission
      if (p.read === 1) map[doctype].read = true;
      if (p.write === 1) map[doctype].write = true;
      if (p.create === 1) map[doctype].create = true;
      if (p.delete === 1) map[doctype].delete = true;
      if (p.if_owner === 1) map[doctype].ifOwner = true;
    }

    return map;
  }

  /**
   * Check if user can perform an action on a DocType.
   *
   * @param doctype - Frappe DocType name
   * @param action - CRUD action
   * @returns true if permitted
   */
  can(doctype: string, action: 'create' | 'read' | 'update' | 'delete' = 'read'): boolean {
    if (!this.initialized || !this.permissions) {
      logger.warn('PermissionService', 'Not initialized, denying access');
      return false;
    }

    const perm = this.permissions[doctype];
    if (!perm) return false;

    switch (action) {
      case 'create':
        return perm.create;
      case 'read':
        return perm.read;
      case 'update':
        return perm.write;
      case 'delete':
        return perm.delete;
      default:
        return false;
    }
  }

  /**
   * Check if user can read a specific field in a DocType.
   * In Frappe, field-level permissions are controlled by permlevel.
   * For simplicity, we check if user has read permission on the DocType.
   *
   * @param doctype - Frappe DocType name
   * @param field - Field name
   * @returns true if field is readable
   */
  canField(doctype: string, field: string): boolean {
    if (!this.initialized || !this.permissions) {
      return false;
    }

    // In Frappe, permlevel 0 means base-level access
    // Higher permlevels require additional role permissions
    // For now, we assume permlevel 0 for all fields
    return this.can(doctype, 'read');
  }

  /**
   * Check if permission is restricted to owner only.
   */
  isOwnerOnly(doctype: string): boolean {
    if (!this.permissions) return false;
    return this.permissions[doctype]?.ifOwner || false;
  }

  /**
   * Get info about a missing permission (for debugging).
   */
  getMissingInfo(doctype: string, action: string, field?: string): MissingPermission {
    return {
      doctype,
      action,
      field,
      message: field
        ? `Missing field '${field}' read access on '${doctype}'`
        : `Missing '${action}' permission on '${doctype}'`,
      timestamp: new Date().toISOString(),
      wasLoadError: this.loadError !== null,
    };
  }

  /**
   * Check if there was an error loading permissions.
   */
  hasLoadError(): boolean {
    return this.loadError !== null;
  }

  /**
   * Get the error that occurred during permission loading, if any.
   */
  getLoadError(): Error | null {
    return this.loadError;
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
    logger.debug('PermissionService', 'Current permissions', this.permissions);
    return this.permissions;
  }

  /**
   * Get user's roles.
   */
  getRoles(): string[] {
    return this.userRoles;
  }

  /**
   * Get list of all DocTypes user has access to.
   */
  getAccessibleDocTypes(): string[] {
    if (!this.permissions) return [];
    return Object.keys(this.permissions).filter(
      doctype => this.permissions![doctype].read
    );
  }

  /**
   * Reset service state (call on logout).
   */
  reset(): void {
    this.permissions = null;
    this.userRoles = [];
    this.initialized = false;
    this.loadError = null;
  }
}

// Singleton instance
export const permissionService = new PermissionService();
