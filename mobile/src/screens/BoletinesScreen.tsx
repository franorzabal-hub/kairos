import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useReports, useChildren } from '../api/hooks';
import { useReadStatus } from '../hooks';
import { Report } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, BADGE_STYLES, SHADOWS } from '../theme';

type ReportListItem =
  | { type: 'header'; id: string; title: string }
  | { type: 'report'; id: string; report: Report };

export default function BoletinesScreen() {
  const { children, filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const { isRead, filterUnread, markAsRead } = useReadStatus('boletines');

  // Fetch children on mount
  useChildren();

  // Fetch reports
  const { data: reports = [], isLoading, refetch, isRefetching } = useReports();

  // Apply filters
  const filteredReports = useMemo(() => {
    if (filterMode === 'unread') {
      return filterUnread(reports);
    }
    return reports;
  }, [reports, filterMode, filterUnread]);

  const onRefresh = async () => {
    await refetch();
  };

  const handleDownload = async (report: Report) => {
    if (!isRead(report.id)) {
      markAsRead(report.id);
    }

    if (report.file) {
      try {
        const fileUrl = `https://kairos-directus-684614817316.us-central1.run.app/assets/${report.file}`;
        await Linking.openURL(fileUrl);
      } catch (error) {
        console.error('Error opening file:', error);
      }
    }
  };

  const reportsByStudent = useMemo(() => {
    return filteredReports.reduce((acc: Record<string, Report[]>, report) => {
      const child = children.find(c => c.id === report.student_id);
      const childName = child ? `${child.first_name} ${child.last_name}` : 'Estudiante';

      if (!acc[childName]) {
        acc[childName] = [];
      }
      acc[childName].push(report);
      return acc;
    }, {});
  }, [filteredReports, children]);

  const listData = useMemo<ReportListItem[]>(() => {
    const items: ReportListItem[] = [];
    Object.entries(reportsByStudent).forEach(([childName, studentReports]) => {
      items.push({ type: 'header', id: `header-${childName}`, title: childName });
      studentReports.forEach((report) => {
        items.push({ type: 'report', id: report.id, report });
      });
    });
    return items;
  }, [reportsByStudent]);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Boletines" />
      <FilterBar unreadCount={unreadCounts.boletines} />
    </View>
  );

  const renderItem = ({ item }: { item: ReportListItem }) => {
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
  };

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
          keyExtractor={(item) => item.id}
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
    lineHeight: 22,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
});
