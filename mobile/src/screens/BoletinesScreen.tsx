import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts, useAppContext } from '../context/AppContext';
import { useReports, useChildren } from '../api/hooks';
import { useReadStatus } from '../hooks';
import { Report } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, BADGE_STYLES, SHADOWS } from '../theme';

export default function BoletinesScreen() {
  const { selectedChildId, children, filterMode } = useFilters();
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
    // Mark as read when downloading
    if (!isRead(report.id)) {
      markAsRead(report.id);
    }

    if (report.file) {
      try {
        // Construct the file URL from Directus
        const fileUrl = `https://kairos-directus-684614817316.us-central1.run.app/assets/${report.file}`;
        await Linking.openURL(fileUrl);
      } catch (error) {
        console.error('Error opening file:', error);
      }
    }
  };

  // Group filtered reports by student
  const reportsByStudent = filteredReports.reduce((acc: Record<string, Report[]>, report) => {
    const child = children.find(c => c.id === report.student_id);
    const childName = child ? `${child.first_name} ${child.last_name}` : 'Estudiante';

    if (!acc[childName]) {
      acc[childName] = [];
    }
    acc[childName].push(report);
    return acc;
  }, {});

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Boletines" />
      <FilterBar unreadCount={unreadCounts.boletines} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
        >
          <ListHeader />
          {Object.entries(reportsByStudent).map(([childName, studentReports]) => (
            <View key={childName} style={styles.childSection}>
              <Text style={styles.childName}>{childName}</Text>

              {studentReports.map((report) => {
                const reportIsUnread = !isRead(report.id);
                return (
                <TouchableOpacity
                  key={report.id}
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
              );
              })}
            </View>
          ))}

          {Object.keys(reportsByStudent).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay boletines disponibles</Text>
            </View>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
