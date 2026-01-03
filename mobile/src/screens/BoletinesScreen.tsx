import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNetInfo } from '@react-native-community/netinfo';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useReports, useChildren, useContentReadStatus } from '../api/hooks';
import { Report, FRAPPE_URL } from '../api/frappe';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, BADGE_STYLES, SHADOWS, FONT_SIZES, SIZES } from '../theme';

type ReportListItem =
  | { type: 'header'; id: string; title: string }
  | { type: 'report'; id: string; report: Report };

export default function BoletinesScreen() {
  const { children, filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useContentReadStatus('boletines');
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  // Fetch children on mount
  useChildren();

  // Fetch reports (TanStack Query handles offline caching)
  const { data: reports = [], isLoading, refetch, isRefetching, dataUpdatedAt } = useReports();

  // OPTIMIZED: Consolidated 3 useMemo chain into 1
  // Previously: filteredReports -> reportsByStudent -> listData (chain of dependencies)
  // Now: Single memo that does filtering, grouping, and list building in one pass
  const listData = useMemo<ReportListItem[]>(() => {
    // Step 1: Apply filters
    const filtered = filterMode === 'unread' ? filterUnread(reports) : reports;

    // Step 2: Group by student
    const byStudent: Record<string, Report[]> = {};
    filtered.forEach(report => {
      const child = children.find(c => c.id === report.student);
      const childName = child ? `${child.first_name} ${child.last_name}` : 'Estudiante';

      if (!byStudent[childName]) {
        byStudent[childName] = [];
      }
      byStudent[childName].push(report);
    });

    // Step 3: Build list items
    const items: ReportListItem[] = [];
    Object.entries(byStudent).forEach(([childName, studentReports]) => {
      items.push({ type: 'header', id: `header-${childName}`, title: childName });
      studentReports.forEach((report) => {
        items.push({ type: 'report', id: report.id, report });
      });
    });
    return items;
  }, [reports, filterMode, filterUnread, children]);

  const onRefresh = async () => {
    await refetch();
  };

  const handleDownload = async (report: Report) => {
    if (isOffline) {
      Alert.alert(
        'Sin conexión',
        'No podés descargar archivos mientras estés offline. Los datos de la lista se muestran desde la caché.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isRead(report.id)) {
      markAsRead(report.id);
    }

    if (report.file) {
      try {
        const fileUrl = `${FRAPPE_URL}/assets/${report.file}`;
        await Linking.openURL(fileUrl);
      } catch (error) {
        console.error('Error opening file:', error);
        Alert.alert('Error', 'No se pudo abrir el archivo');
      }
    }
  };

  // Format last update time for offline indicator
  const lastUpdateText = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Boletines" />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.white} />
          <Text style={styles.offlineText}>
            Sin conexión - Datos de {lastUpdateText}
          </Text>
        </View>
      )}
      <FilterBar unreadCount={unreadCounts.boletines} />
    </View>
  );

  // Memoized keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: ReportListItem) => item.id, []);

  // Memoized renderItem to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }: { item: ReportListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.childSection}>
          <Text style={styles.childName}>{item.title}</Text>
        </View>
      );
    }

    const report = item.report;
    const reportIsUnread = !isRead(report.id);

    return (
      <View style={styles.reportWrapper}>
        <TouchableOpacity
          style={[styles.reportRow, reportIsUnread && styles.reportRowUnread]}
          onPress={() => handleDownload(report)}
        >
          <View style={styles.reportInfo}>
            <View style={styles.reportHeader}>
              <Text style={[styles.reportTitle, reportIsUnread && styles.reportTitleUnread]} numberOfLines={2}>
                {report.title}
              </Text>
              {reportIsUnread && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NUEVO</Text>
                </View>
              )}
            </View>
            {report.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{report.type}</Text>
              </View>
            )}
          </View>
          <View style={styles.downloadButton}>
            <Ionicons name="download-outline" size={20} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [isRead, handleDownload]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={listData}
          keyExtractor={keyExtractor}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay boletines disponibles</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  listHeader: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  childSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
  },
  childName: {
    ...TYPOGRAPHY.sectionTitle,
    marginBottom: SPACING.md,
  },
  reportWrapper: {
    paddingHorizontal: SPACING.screenPadding,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  reportRowUnread: {
    ...UNREAD_STYLES.borderLeft,
  },
  reportInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  reportTitle: {
    flex: 1,
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.darkGray,
    lineHeight: FONT_SIZES['5xl'] + SPACING.xxs,
  },
  reportTitleUnread: {
    fontWeight: '600',
    color: COLORS.black,
  },
  newBadge: {
    ...BADGE_STYLES.new,
    marginLeft: SPACING.sm,
  },
  newBadgeText: {
    color: COLORS.white,
    ...TYPOGRAPHY.badgeSmall,
  },
  downloadButton: {
    width: SIZES.buttonHeight,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.buttonHeight / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl + SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
  loadingContainer: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    ...BADGE_STYLES.type,
  },
  typeBadgeText: {
    color: COLORS.gray,
    ...TYPOGRAPHY.badge,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  offlineText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
