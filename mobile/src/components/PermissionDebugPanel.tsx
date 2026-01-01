/**
 * PermissionDebugPanel - Floating dev panel for debugging
 *
 * Shows missing permissions and image loading errors in real-time during development.
 * Only renders in __DEV__ mode.
 *
 * Features:
 * - Collapsible floating panel
 * - Tabs for Permissions and Images
 * - Real-time updates when permissions are denied or images fail
 * - Export format for debugging
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
import { imageDebugger, ImageLoadResult } from '../services/imageDebugger';
import { MissingPermission } from '../services/permissionService';
import { COLORS, SPACING, TYPOGRAPHY, BORDERS } from '../theme';

type DebugTab = 'permissions' | 'images';

interface PermissionDebugPanelProps {
  /** Initial collapsed state */
  initialCollapsed?: boolean;
  /** Rendering mode: 'floating' (default) or 'inline' (for footer integration) */
  mode?: 'floating' | 'inline';
}

export default function PermissionDebugPanel({
  initialCollapsed = true,
  mode = 'floating',
}: PermissionDebugPanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<DebugTab>('images'); // Default to images since that's what we're debugging
  const [missing, setMissing] = useState<MissingPermission[]>([]);
  const [imageResults, setImageResults] = useState<ImageLoadResult[]>([]);
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

  // Subscribe to image debug updates
  useEffect(() => {
    // Load existing image results
    setImageResults(imageDebugger.getAll());

    // Subscribe to new ones
    const unsubscribe = imageDebugger.onResult((item) => {
      setImageResults(imageDebugger.getAll());
    });

    return unsubscribe;
  }, []);

  // Copy export to clipboard (based on active tab)
  const handleCopy = useCallback(() => {
    const exportText = activeTab === 'permissions'
      ? permissionDebugger.exportAsText()
      : imageDebugger.exportAsText();
    Clipboard.setString(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeTab]);

  // Clear all logged items (based on active tab)
  const handleClear = useCallback(() => {
    if (activeTab === 'permissions') {
      permissionDebugger.clear();
      setMissing([]);
    } else {
      imageDebugger.clear();
      setImageResults([]);
    }
  }, [activeTab]);

  // Count errors for badges
  const imageErrorCount = imageResults.filter(r => r.status === 'error').length;
  const totalIssues = missing.length + imageErrorCount;

  // Don't render in production
  if (!__DEV__) {
    return null;
  }

  // Inline mode (Footer integration)
  if (mode === 'inline') {
    return (
      <>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.7 }}
          onPress={() => setCollapsed(!collapsed)}
        >
          <Ionicons name="bug-outline" size={14} color={COLORS.white} />
          {totalIssues > 0 && (
            <View style={{ backgroundColor: COLORS.error, borderRadius: 6, paddingHorizontal: 4, height: 12, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{totalIssues}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Render panel absolute relative to the footer/screen if expanded */}
        {!collapsed && (
          <View style={[styles.container, { bottom: 40, right: 10 }]}>
            {/* Header with tabs */}
            <View style={styles.header}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'images' && styles.tabActive]}
                  onPress={() => setActiveTab('images')}
                >
                  <Ionicons name="image-outline" size={12} color={COLORS.white} />
                  <Text style={styles.tabText}>Imgs ({imageErrorCount})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'permissions' && styles.tabActive]}
                  onPress={() => setActiveTab('permissions')}
                >
                  <Ionicons name="lock-closed" size={12} color={COLORS.white} />
                  <Text style={styles.tabText}>Perms ({missing.length})</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleCopy} style={styles.headerButton}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCollapsed(true)} style={styles.headerButton}>
                  <Ionicons name="close" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.content} nestedScrollEnabled>
              {activeTab === 'permissions' ? (
                missing.length === 0 ? (
                  <Text style={styles.emptyText}>Sin permisos faltantes</Text>
                ) : (
                  missing.map((item, index) => (
                    <View key={index} style={styles.item}>
                      <Text style={styles.itemAction}>{item.action} {item.collection}</Text>
                      <Text style={styles.itemMessage}>{item.message}</Text>
                    </View>
                  ))
                )
              ) : (
                imageResults.length === 0 ? (
                  <Text style={styles.emptyText}>Sin intentos de carga de imágenes</Text>
                ) : (
                  imageResults.map((item, index) => (
                    <View key={index} style={[styles.item, item.status === 'error' && styles.itemError]}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemAction, item.status === 'success' && { color: '#4ade80' }]}>
                          {item.status.toUpperCase()}
                        </Text>
                        <Text style={styles.itemCollection}>{item.authMethod}</Text>
                      </View>
                      <Text style={styles.itemField}>ID: {item.fileId.substring(0, 8)}...</Text>
                      {item.httpStatus && (
                        <Text style={styles.itemField}>HTTP: {item.httpStatus} {item.httpStatusText}</Text>
                      )}
                      {item.errorMessage && (
                        <Text style={[styles.itemMessage, { color: '#f87171' }]}>{item.errorMessage}</Text>
                      )}
                      <Text style={styles.itemUrl} numberOfLines={1}>{item.url}</Text>
                    </View>
                  ))
                )
              )}
            </ScrollView>
          </View>
        )}
      </>
    );
  }

  // Collapsed state - just show badge (Floating)
  if (collapsed) {
    return (
      <TouchableOpacity
        style={styles.collapsedContainer}
        onPress={() => setCollapsed(false)}
        activeOpacity={0.8}
      >
        <Ionicons name="bug-outline" size={16} color={COLORS.white} />
        {totalIssues > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalIssues}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Expanded panel (Floating)
  return (
    <View style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'images' && styles.tabActive]}
            onPress={() => setActiveTab('images')}
          >
            <Ionicons name="image-outline" size={14} color={COLORS.white} />
            <Text style={styles.tabText}>Imgs ({imageErrorCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'permissions' && styles.tabActive]}
            onPress={() => setActiveTab('permissions')}
          >
            <Ionicons name="lock-closed" size={14} color={COLORS.white} />
            <Text style={styles.tabText}>Perms ({missing.length})</Text>
          </TouchableOpacity>
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
        {activeTab === 'permissions' ? (
          missing.length === 0 ? (
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
          )
        ) : (
          imageResults.length === 0 ? (
            <Text style={styles.emptyText}>
              Sin intentos de carga de imágenes
            </Text>
          ) : (
            imageResults.map((item, index) => (
              <View key={index} style={[styles.item, item.status === 'error' && styles.itemError]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemAction, item.status === 'success' && { color: '#4ade80' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={COLORS.gray} />
                  <Text style={styles.itemCollection}>{item.authMethod}</Text>
                </View>
                <Text style={styles.itemField}>ID: {item.fileId.substring(0, 12)}...</Text>
                {item.httpStatus && (
                  <Text style={styles.itemField}>
                    HTTP: {item.httpStatus} {item.httpStatusText}
                  </Text>
                )}
                {item.contentType && (
                  <Text style={styles.itemField}>Type: {item.contentType}</Text>
                )}
                {item.errorMessage && (
                  <Text style={[styles.itemMessage, { color: '#f87171' }]}>
                    {item.errorMessage}
                  </Text>
                )}
                <Text style={styles.itemUrl} numberOfLines={2}>{item.url}</Text>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Footer with export hint */}
      {(activeTab === 'permissions' ? missing.length : imageErrorCount) > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Toca copiar para exportar info de debug
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

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDERS.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 11,
  },

  // Error item styling
  itemError: {
    borderLeftWidth: 3,
    borderLeftColor: '#f87171',
  },
  itemUrl: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontSize: 9,
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
