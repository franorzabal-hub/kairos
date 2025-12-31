/**
 * WebMisHijosScreen - Web-optimized "Mis Hijos" screen
 *
 * Features:
 * - WebLayout with sidebar navigation
 * - CSS Grid layout for menu sections
 * - Hover effects on cards
 * - Quick action button for pickup changes
 * - Recent reports preview
 */
import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ChildSelector from '../../components/ChildSelector';
import { WebLayout, ResponsiveCardGrid } from '../../components/web';
import { useSession } from '../../hooks';
import { useChildren, useReports, usePickupRequests, useContentReadStatus } from '../../api/hooks';
import { Report } from '../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, CHILD_COLORS } from '../../theme';
import { logger } from '../../utils';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

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

export default function WebMisHijosScreen() {
  const router = useRouter();
  const { children, selectedChildId, setSelectedChildId, isChildrenLoading, getChildById } = useSession();

  // Fetch data
  const { refetch: refetchChildren } = useChildren();
  const { data: reports = [], isLoading: reportsLoading, refetch: refetchReports } = useReports();
  const { data: pickupRequests = [], isLoading: pickupLoading, refetch: refetchPickup } = usePickupRequests();

  // Read status for reports
  const { isRead: isReportRead, filterUnread: filterUnreadReports } = useContentReadStatus('boletines');

  const isLoading = isChildrenLoading || reportsLoading || pickupLoading;

  // If only one child, auto-select
  const effectiveSelectedChildId = useMemo(() => {
    if (children.length === 1) return children[0].id;
    return selectedChildId;
  }, [children, selectedChildId]);

  const selectedChild = useMemo(() => {
    return effectiveSelectedChildId ? getChildById(effectiveSelectedChildId) || null : null;
  }, [effectiveSelectedChildId, getChildById]);

  // Get child color for accent
  const selectedChildColor = useMemo(() => {
    if (!effectiveSelectedChildId) return COLORS.primary;
    const index = children.findIndex(c => c.id === effectiveSelectedChildId);
    return CHILD_COLORS[index % CHILD_COLORS.length];
  }, [effectiveSelectedChildId, children]);

  // Count unread reports for selected child
  const unreadReportsCount = useMemo(() => {
    if (!effectiveSelectedChildId) return 0;
    const childReports = reports.filter(r => r.student_id === effectiveSelectedChildId);
    return filterUnreadReports(childReports).length;
  }, [reports, effectiveSelectedChildId, filterUnreadReports]);

  // Count pending pickup requests for selected child
  const pendingPickupCount = useMemo(() => {
    if (!effectiveSelectedChildId) return 0;
    return pickupRequests.filter(
      r => r.student_id === effectiveSelectedChildId && r.status === 'pending'
    ).length;
  }, [pickupRequests, effectiveSelectedChildId]);

  // Get recent reports for preview
  const recentReports = useMemo(() => {
    if (!effectiveSelectedChildId) return [];
    return reports
      .filter(r => r.student_id === effectiveSelectedChildId)
      .slice(0, 6);
  }, [reports, effectiveSelectedChildId]);

  // Menu sections
  const menuSections: MenuSection[] = useMemo(() => [
    {
      id: 'boletines',
      title: 'Boletines',
      description: 'Calificaciones e informes',
      icon: 'document-text-outline',
      iconColor: '#6366F1',
      route: '/boletines',
      badge: unreadReportsCount,
    },
    {
      id: 'asistencia',
      title: 'Asistencia',
      description: 'Historial de asistencia',
      icon: 'calendar-outline',
      iconColor: '#10B981',
      onPress: () => {
        logger.debug('Attendance not implemented yet');
      },
    },
    {
      id: 'legajo',
      title: 'Legajo',
      description: 'Datos y documentos',
      icon: 'folder-outline',
      iconColor: '#F59E0B',
      onPress: () => {
        logger.debug('Student record not implemented yet');
      },
    },
    {
      id: 'cambios',
      title: 'Cambios de Salida',
      description: 'Solicitar retiro anticipado',
      icon: 'time-outline',
      iconColor: '#EF4444',
      route: '/cambios',
      badge: pendingPickupCount,
    },
  ], [unreadReportsCount, pendingPickupCount]);

  const handleSelectChild = useCallback((childId: string) => {
    setSelectedChildId(childId);
  }, [setSelectedChildId]);

  const handleMenuPress = useCallback((section: MenuSection) => {
    if (section.route) {
      router.push(section.route);
    } else if (section.onPress) {
      section.onPress();
    }
  }, [router]);

  const formatReportDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Render menu card with hover effect
  const renderMenuCard = (section: MenuSection) => (
    <Pressable
      key={section.id}
      onPress={() => handleMenuPress(section)}
      style={(state) => ({
        backgroundColor: COLORS.white,
        borderRadius: BORDERS.radius.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          boxShadow: (state as WebPressableState).hovered
            ? '0 4px 12px rgba(0,0,0,0.1)'
            : '0 1px 3px rgba(0,0,0,0.05)',
          transform: (state as WebPressableState).hovered ? [{ translateY: -2 }] : [],
          transition: 'all 0.2s ease',
        } as any),
      })}
    >
      {/* Icon with badge */}
      <View style={{
        width: 56,
        height: 56,
        borderRadius: BORDERS.radius.lg,
        backgroundColor: section.iconColor + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        position: 'relative',
      }}>
        <Ionicons name={section.icon} size={28} color={section.iconColor} />
        {section.badge && section.badge > 0 ? (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: COLORS.primary,
            borderRadius: BORDERS.radius.full,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
          }}>
            <Text style={{
              ...TYPOGRAPHY.badge,
              color: COLORS.white,
            }}>
              {section.badge}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={{
        ...TYPOGRAPHY.listItemTitle,
        fontWeight: '600',
        color: COLORS.darkGray,
        marginBottom: 4,
      }}>
        {section.title}
      </Text>
      <Text style={{
        ...TYPOGRAPHY.caption,
        color: COLORS.gray,
      }}>
        {section.description}
      </Text>
    </Pressable>
  );

  // Render report card with hover effect
  const renderReportCard = (report: Report) => {
    const isUnread = !isReportRead(report.id);

    return (
      <Pressable
        key={report.id}
        onPress={() => router.push('/boletines')}
        style={(state) => ({
          backgroundColor: COLORS.white,
          borderRadius: BORDERS.radius.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: isUnread ? selectedChildColor : COLORS.border,
          borderLeftWidth: isUnread ? 4 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            boxShadow: (state as WebPressableState).hovered
              ? '0 4px 8px rgba(0,0,0,0.08)'
              : '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
          } as any),
        })}
      >
        {/* Icon */}
        <View style={{
          width: 44,
          height: 44,
          borderRadius: BORDERS.radius.md,
          backgroundColor: COLORS.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="document-text" size={22} color={COLORS.primary} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={{
            ...TYPOGRAPHY.listItemTitle,
            color: COLORS.darkGray,
            fontWeight: isUnread ? '600' : '500',
          }}>
            {report.title}
          </Text>
          <Text style={{
            ...TYPOGRAPHY.caption,
            color: COLORS.gray,
            marginTop: 2,
          }}>
            {report.type} {report.period ? `- ${report.period}` : ''}
          </Text>
        </View>

        {/* Date */}
        <Text style={{
          ...TYPOGRAPHY.caption,
          color: COLORS.gray,
        }}>
          {formatReportDate(report.published_at || report.created_at)}
        </Text>

        {/* Unread indicator */}
        {isUnread && (
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: selectedChildColor,
          }} />
        )}
      </Pressable>
    );
  };

  return (
    <WebLayout>
      <View style={{
        flex: 1,
        padding: SPACING.lg,
        maxWidth: 1200,
        marginHorizontal: 'auto',
        width: '100%',
      }}>
        {/* Page Header */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={{
            ...TYPOGRAPHY.sectionTitle,
            fontSize: 28,
            color: COLORS.darkGray,
            marginBottom: SPACING.xs,
          }}>
            Mis Hijos
          </Text>
          <Text style={{
            ...TYPOGRAPHY.body,
            color: COLORS.gray,
          }}>
            Información académica y gestión de retiros
          </Text>
        </View>

        {/* Child Selector */}
        {children.length > 0 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <ChildSelector
              children={children}
              selectedChildId={effectiveSelectedChildId}
              onSelectChild={handleSelectChild}
            />
          </View>
        )}

        {isLoading && children.length === 0 ? (
          <View style={{
            padding: SPACING.xl,
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : children.length === 0 ? (
          <View style={{
            padding: SPACING.xl,
            alignItems: 'center',
            gap: SPACING.md,
          }}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray} />
            <Text style={{
              ...TYPOGRAPHY.sectionTitle,
              color: COLORS.darkGray,
            }}>
              No hay hijos registrados
            </Text>
            <Text style={{
              ...TYPOGRAPHY.body,
              color: COLORS.gray,
              textAlign: 'center',
            }}>
              Contacta al colegio para vincular a tus hijos con tu cuenta.
            </Text>
          </View>
        ) : (
          <>
            {/* Quick Action: Pickup Change */}
            <Pressable
              onPress={() => router.push('/cambios')}
              style={(state) => ({
                backgroundColor: selectedChildColor + '10',
                borderRadius: BORDERS.radius.lg,
                padding: SPACING.lg,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: SPACING.xl,
                borderWidth: 1,
                borderColor: selectedChildColor + '30',
                ...(Platform.OS === 'web' && {
                  cursor: 'pointer',
                  boxShadow: (state as WebPressableState).hovered
                    ? '0 4px 12px rgba(0,0,0,0.1)'
                    : 'none',
                  transition: 'all 0.2s ease',
                } as any),
              })}
            >
              <View style={{
                width: 56,
                height: 56,
                borderRadius: BORDERS.radius.lg,
                backgroundColor: selectedChildColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="time-outline" size={28} color={COLORS.white} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{
                  ...TYPOGRAPHY.listItemTitle,
                  fontWeight: '600',
                  color: COLORS.darkGray,
                }}>
                  Solicitar Cambio de Salida
                </Text>
                <Text style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.gray,
                  marginTop: 2,
                }}>
                  Retiro anticipado o persona autorizada
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={selectedChildColor} />
            </Pressable>

            {/* Menu Grid */}
            <View style={{ marginBottom: SPACING.xl }}>
              <Text style={{
                ...TYPOGRAPHY.sectionTitle,
                color: COLORS.darkGray,
                marginBottom: SPACING.md,
              }}>
                Información Académica
              </Text>
              <ResponsiveCardGrid minColumnWidth={220} gap={SPACING.md}>
                {menuSections.map(renderMenuCard)}
              </ResponsiveCardGrid>
            </View>

            {/* Recent Reports */}
            {recentReports.length > 0 && (
              <View style={{ marginBottom: SPACING.xl }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                }}>
                  <Text style={{
                    ...TYPOGRAPHY.sectionTitle,
                    color: COLORS.darkGray,
                  }}>
                    Boletines Recientes
                  </Text>
                  <Pressable
                    onPress={() => router.push('/boletines')}
                    style={(state) => ({
                      opacity: (state as WebPressableState).hovered ? 0.7 : 1,
                      ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
                    })}
                  >
                    <Text style={{
                      ...TYPOGRAPHY.body,
                      color: COLORS.primary,
                      fontWeight: '600',
                    }}>
                      Ver todos
                    </Text>
                  </Pressable>
                </View>
                <View style={{ gap: SPACING.sm }}>
                  {recentReports.map(renderReportCard)}
                </View>
              </View>
            )}

            {/* Attendance Placeholder */}
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: BORDERS.radius.lg,
              padding: SPACING.xl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <MaterialCommunityIcons name="calendar-check" size={48} color={COLORS.gray} />
              <Text style={{
                ...TYPOGRAPHY.listItemTitle,
                color: COLORS.gray,
                marginTop: SPACING.md,
              }}>
                Asistencia Disponible Pronto
              </Text>
              <Text style={{
                ...TYPOGRAPHY.caption,
                color: COLORS.gray,
                textAlign: 'center',
                marginTop: SPACING.xs,
                maxWidth: 400,
              }}>
                El historial de asistencia estará disponible en una próxima actualización.
              </Text>
            </View>
          </>
        )}
      </View>
    </WebLayout>
  );
}
