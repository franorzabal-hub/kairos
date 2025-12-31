/**
 * PermissionDebugPanel - Floating dev panel for permission debugging
 *
 * Shows missing permissions in real-time during development.
 * Only renders in __DEV__ mode.
 *
 * Features:
 * - Collapsible floating panel
 * - Real-time updates when permissions are denied
 * - Export format for Directus configuration
 * - Copy to clipboard
 *
 * @example
 * ```tsx
 * // Add to App root (only shows in dev)
 * <PermissionDebugPanel />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { permissionDebugger } from '../services/permissionDebugger';
import { MissingPermission } from '../services/permissionService';
import { COLORS, SPACING, TYPOGRAPHY, BORDERS } from '../theme';

interface PermissionDebugPanelProps {
  /** Initial collapsed state */
  initialCollapsed?: boolean;
}

export default function PermissionDebugPanel({
  initialCollapsed = true,
}: PermissionDebugPanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [missing, setMissing] = useState<MissingPermission[]>([]);
  const [copied, setCopied] = useState(false);

  // Subscribe to missing permission updates
  useEffect(() => {
    // Load existing missing permissions
    setMissing(permissionDebugger.getAll());

    // Subscribe to new ones
    const unsubscribe = permissionDebugger.onMissing((item) => {
      setMissing(permissionDebugger.getAll());
    });

    return unsubscribe;
  }, []);

  // Copy export to clipboard
  const handleCopy = useCallback(() => {
    const exportText = permissionDebugger.exportAsText();
    Clipboard.setString(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Clear all logged permissions
  const handleClear = useCallback(() => {
    permissionDebugger.clear();
    setMissing([]);
  }, []);

  // Don't render in production
  if (!__DEV__) {
    return null;
  }

  // Collapsed state - just show badge
  if (collapsed) {
    return (
      <TouchableOpacity
        style={styles.collapsedContainer}
        onPress={() => setCollapsed(false)}
        activeOpacity={0.8}
      >
        <Ionicons name="lock-closed" size={16} color={COLORS.white} />
        {missing.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{missing.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Expanded panel
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed" size={16} color={COLORS.white} />
          <Text style={styles.headerTitle}>Permisos ({missing.length})</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleCopy} style={styles.headerButton}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={16} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCollapsed(true)}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} nestedScrollEnabled>
        {missing.length === 0 ? (
          <Text style={styles.emptyText}>
            Sin permisos faltantes registrados
          </Text>
        ) : (
          missing.map((item, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemAction}>{item.action}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={COLORS.gray}
                />
                <Text style={styles.itemCollection}>{item.collection}</Text>
              </View>
              {item.field && (
                <Text style={styles.itemField}>Campo: {item.field}</Text>
              )}
              {item.message && (
                <Text style={styles.itemMessage} numberOfLines={1}>
                  {item.message}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer with export hint */}
      {missing.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Toca copiar para exportar config de Directus
          </Text>
        </View>
      )}
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH - 32);
const PANEL_MAX_HEIGHT = SCREEN_HEIGHT * 0.4;

const styles = StyleSheet.create({
  // Collapsed button
  collapsedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },

  // Expanded panel
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: PANEL_WIDTH,
    maxHeight: PANEL_MAX_HEIGHT,
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDERS.radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerButton: {
    padding: SPACING.xs,
  },

  // Content
  content: {
    maxHeight: PANEL_MAX_HEIGHT - 100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },

  // Item
  item: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDERS.radius.md,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  itemAction: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemCollection: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '500',
  },
  itemField: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  itemMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontSize: 10,
    marginTop: 2,
  },

  // Footer
  footer: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontSize: 10,
    textAlign: 'center',
  },
});
