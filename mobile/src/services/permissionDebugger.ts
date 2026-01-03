/**
 * Permission Debugger - Tracks missing permissions during development
 *
 * This service collects all 403 errors and missing permissions to help
 * developers understand what needs to be configured in Frappe.
 *
 * Only active in __DEV__ mode.
 */

import { MissingPermission } from './permissionService';

type Listener = (item: MissingPermission) => void;

class PermissionDebugger {
  private missing: MissingPermission[] = [];
  private listeners: Listener[] = [];

  /**
   * Log a missing permission.
   * Avoids duplicates based on collection + action + field.
   */
  logMissing(item: MissingPermission): void {
    if (!__DEV__) return;

    // Check for duplicate
    const exists = this.missing.some(
      m =>
        m.collection === item.collection &&
        m.action === item.action &&
        m.field === item.field
    );

    if (!exists) {
      this.missing.push(item);
      this.listeners.forEach(fn => fn(item));

      // Also log to console for immediate visibility
      console.warn('🔒 PERMISSION MISSING:', item.message || `${item.action} on ${item.collection}`);
    }
  }

  /**
   * Log a 403 error from API response.
   */
  log403(collection: string, action: string, errorMessage?: string): void {
    this.logMissing({
      collection,
      action,
      message: errorMessage || `403 Forbidden: ${action} on ${collection}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to new missing permissions.
   * Returns unsubscribe function.
   */
  onMissing(callback: Listener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * Get all logged missing permissions.
   */
  getAll(): MissingPermission[] {
    return [...this.missing];
  }

  /**
   * Get count of missing permissions.
   */
  getCount(): number {
    return this.missing.length;
  }

  /**
   * Clear all logged permissions.
   */
  clear(): void {
    this.missing = [];
  }

  /**
   * Export in a format suitable for Frappe configuration.
   * Copy this output to configure roles in Frappe.
   */
  exportForFrappe(): Array<{ collection: string; action: string; fields: string[] }> {
    // Group by collection and action
    const grouped = new Map<string, Set<string>>();

    for (const m of this.missing) {
      const key = `${m.collection}:${m.action}`;
      if (!grouped.has(key)) {
        grouped.set(key, new Set());
      }
      if (m.field) {
        grouped.get(key)!.add(m.field);
      }
    }

    return Array.from(grouped.entries()).map(([key, fields]) => {
      const [collection, action] = key.split(':');
      return {
        collection,
        action,
        fields: fields.size > 0 ? Array.from(fields) : ['*'],
      };
    });
  }

  /**
   * Get a formatted string for clipboard.
   */
  exportAsText(): string {
    if (this.missing.length === 0) {
      return 'No missing permissions logged.';
    }

    const lines = ['Missing Permissions:', ''];
    for (const m of this.missing) {
      lines.push(`• ${m.action} → ${m.collection}${m.field ? ` (field: ${m.field})` : ''}`);
    }
    lines.push('');
    lines.push('Frappe Config:');
    lines.push(JSON.stringify(this.exportForFrappe(), null, 2));

    return lines.join('\n');
  }
}

// Singleton instance
export const permissionDebugger = new PermissionDebugger();
