import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../components/ScreenHeader';
import ChildSelector from '../components/ChildSelector';
import DirectusImage from '../components/DirectusImage';
import { useChildren, useReports, usePickupRequests } from '../api/hooks';
import { Report, PickupRequest } from '../api/frappe';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, BADGE_STYLES, UNREAD_STYLES, FONT_SIZES, SIZES } from '../theme';
import { useSession } from '../hooks';
import { useContentReadStatus } from '../api/hooks';
import { logger } from '../utils';

interface MenuSection {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route?: string;
  badge?: number;
  onPress?: () => void;
}

export default function MisHijosScreen() {
  const router = useRouter();
  // Centralized session state - user, children, permissions
  const { children, selectedChildId, setSelectedChildId, isChildrenLoading, getChildById } = useSession();

  // Fetch data (useChildren just for refetch - React Query shares cache with useSession)
  const { refetch: refetchChildren } = useChildren();
  const { data: reports = [], isLoading: reportsLoading, refetch: refetchReports } = useReports();
  const { data: pickupRequests = [], isLoading: pickupLoading, refetch: refetchPickup } = usePickupRequests();

  // Read status for reports
  const { isRead: isReportRead, filterUnread: filterUnreadReports } = useContentReadStatus('boletines');

  const isLoading = isChildrenLoading || reportsLoading || pickupLoading;

  // OPTIMIZED: Consolidated 5 useMemos into 1 that computes all child-related derived state
  // All these had overlapping dependencies (effectiveSelectedChildId, reports, pickupRequests)
  const {
    effectiveSelectedChildId,
    selectedChild,
    unreadReportsCount,
    pendingPickupCount,
    recentReports,
  } = useMemo(() => {
    // If only one child, auto-select
    const effectiveId = children.length === 1 ? children[0].id : selectedChildId;

    // Get selected child object
    const child = effectiveId ? getChildById(effectiveId) || null : null;

    // Early return if no effective child ID
    if (!effectiveId) {
      return {
        effectiveSelectedChildId: effectiveId,
        selectedChild: child,
        unreadReportsCount: 0,
        pendingPickupCount: 0,
        recentReports: [] as Report[],
      };
    }

    // Filter reports for selected child once
    const childReports = reports.filter(r => r.student === effectiveId);

    return {
      effectiveSelectedChildId: effectiveId,
      selectedChild: child,
      unreadReportsCount: filterUnreadReports(childReports).length,
      pendingPickupCount: pickupRequests.filter(
        r => r.student === effectiveId && r.status === 'pending'
      ).length,
      recentReports: childReports.slice(0, 3),
    };
  }, [children, selectedChildId, getChildById, reports, pickupRequests, filterUnreadReports]);

  // Menu sections
  const menuSections: MenuSection[] = [
    {
      id: 'boletines',
      title: 'Boletines',
      description: 'Calificaciones e informes',
      icon: 'document-text-outline',
      iconColor: COLORS.indigo,
      route: '/boletines',
      badge: unreadReportsCount,
    },
    {
      id: 'asistencia',
      title: 'Asistencia',
      description: 'Historial de asistencia',
      icon: 'calendar-outline',
      iconColor: COLORS.emerald,
      onPress: () => {
        // TODO: Navigate to attendance screen when implemented
        logger.debug('Attendance not implemented yet');
      },
    },
    {
      id: 'legajo',
      title: 'Legajo',
      description: 'Datos y documentos',
      icon: 'folder-outline',
      iconColor: COLORS.amber,
      onPress: () => {
        // TODO: Navigate to student record screen when implemented
        logger.debug('Student record not implemented yet');
      },
    },
    {
      id: 'cambios',
      title: 'Cambios de Salida',
      description: 'Solicitar retiro anticipado',
      icon: 'time-outline',
      iconColor: COLORS.red,
      route: '/cambios',
      badge: pendingPickupCount,
    },
  ];

  const onRefresh = async () => {
    await Promise.all([refetchChildren(), refetchReports(), refetchPickup()]);
  };

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleMenuPress = (section: MenuSection) => {
    if (section.route) {
      router.push(section.route);
    } else if (section.onPress) {
      section.onPress();
    }
  };

  const formatReportDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <ScreenHeader title="Mis Hijos" />

        {/* Child Selector */}
        <ChildSelector
          children={children}
          selectedChildId={effectiveSelectedChildId}
          onSelectChild={handleSelectChild}
        />

        {isLoading && children.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No hay hijos registrados</Text>
            <Text style={styles.emptyText}>
              Contacta al colegio para vincular a tus hijos con tu cuenta.
            </Text>
          </View>
        ) : (
          <>
            {/* Quick Action: Cambio de Salida */}
            <View style={styles.quickActionSection}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push('/cambios')}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="time-outline" size={24} color={COLORS.white} />
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Solicitar Cambio de Salida</Text>
                  <Text style={styles.quickActionDescription}>
                    Retiro anticipado o persona autorizada
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Menu Grid */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Información Académica</Text>
              <View style={styles.menuGrid}>
                {menuSections.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={styles.menuCard}
                    onPress={() => handleMenuPress(section)}
                  >
                    <View style={[styles.menuIconContainer, { backgroundColor: section.iconColor + '15' }]}>
                      <Ionicons name={section.icon} size={28} color={section.iconColor} />
                      {section.badge && section.badge > 0 ? (
                        <View style={styles.menuBadge}>
                          <Text style={styles.menuBadgeText}>{section.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.menuTitle}>{section.title}</Text>
                    <Text style={styles.menuDescription}>{section.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Reports Preview */}
            {recentReports.length > 0 && (
              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Text style={styles.sectionTitle}>Boletines Recientes</Text>
                  <TouchableOpacity onPress={() => router.push('/boletines')}>
                    <Text style={styles.seeAllText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>
                {recentReports.map((report) => {
                  const isUnread = !isReportRead(report.id);
                  return (
                    <TouchableOpacity
                      key={report.id}
                      style={[styles.reportCard, isUnread && styles.reportCardUnread]}
                      onPress={() => router.push('/boletines')}
                    >
                      {isUnread && <View style={styles.unreadDot} />}
                      <View style={styles.reportIconContainer}>
                        <Ionicons name="document-text" size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.reportContent}>
                        <Text style={styles.reportTitle}>{report.title}</Text>
                        <Text style={styles.reportMeta}>
                          {report.type} {report.period ? `- ${report.period}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.reportDate}>
                        {formatReportDate(report.published_at || report.created_at)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Attendance Preview (Placeholder) */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <Text style={styles.sectionTitle}>Asistencia</Text>
              </View>
              <View style={styles.attendancePlaceholder}>
                <MaterialCommunityIcons name="calendar-check" size={48} color={COLORS.gray} />
                <Text style={styles.placeholderTitle}>Disponible Pronto</Text>
                <Text style={styles.placeholderText}>
                  El historial de asistencia estará disponible en una próxima actualización.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl + SPACING.xxl + SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl + SPACING.xxxl + SPACING.lg,
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    marginTop: SPACING.lg,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Quick Action
  quickActionSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
  },
  quickActionIcon: {
    width: SIZES.avatarLg,
    height: SIZES.avatarLg,
    borderRadius: BORDERS.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  quickActionTitle: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  quickActionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xxs,
  },

  // Menu Grid
  menuSection: {
    padding: SPACING.screenPadding,
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  menuCard: {
    width: '50%',
    padding: SPACING.xs,
  },
  menuIconContainer: {
    width: SIZES.fabSize,
    height: SIZES.fabSize,
    borderRadius: BORDERS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  menuBadge: {
    position: 'absolute',
    top: -SPACING.xs,
    right: -SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radius.full,
    minWidth: SIZES.iconMd,
    height: SIZES.iconMd,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs + SPACING.xxs,
  },
  menuBadgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.white,
  },
  menuTitle: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  menuDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xxs,
  },

  // Preview Sections
  previewSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    padding: SPACING.screenPadding,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Report Cards
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportCardUnread: {
    ...UNREAD_STYLES.borderLeft,
    paddingLeft: SPACING.sm,
    marginLeft: -SPACING.screenPadding,
    paddingRight: SPACING.sm,
  },
  unreadDot: {
    ...UNREAD_STYLES.dotSmall,
    position: 'absolute',
    left: -SPACING.md,
    top: '50%',
    marginTop: -SPACING.xs,
  },
  reportIconContainer: {
    width: SIZES.avatarMd,
    height: SIZES.avatarMd,
    borderRadius: BORDERS.radius.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.darkGray,
  },
  reportMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xxs,
  },
  reportDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },

  // Attendance Placeholder
  attendancePlaceholder: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
  },
  placeholderTitle: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
  placeholderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
});
