import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts, useAppContext } from '../context/AppContext';

const COLORS = {
  primary: '#8B1538',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
};

// Mock data
const mockReports = {
  'Teodelina Orzabal': [
    { id: '1', title: 'Boletín', type: 'boletin', isNew: false },
    { id: '2', title: 'Inasistencias', type: 'inasistencias', isNew: false },
    { id: '3', title: 'Boletín de convivencia', type: 'convivencia', isNew: true },
    { id: '4', title: '1° Rúbrica primaria 2025 - 2do EP', type: 'rubrica', isNew: false },
    { id: '5', title: '2° Rúbrica primaria 2025 - 2do EP', type: 'rubrica', isNew: false },
    { id: '6', title: '3° Rúbrica primaria 2025 - 2do EP', type: 'rubrica', isNew: false },
  ],
  'Pedro Orzabal': [
    { id: '7', title: 'Boletín', type: 'boletin', isNew: false },
    { id: '8', title: 'Inasistencias', type: 'inasistencias', isNew: false },
    { id: '9', title: 'Boletín de convivencia', type: 'convivencia', isNew: false },
    { id: '10', title: 'Informe fin de año K4 2025', type: 'informe', isNew: true },
  ],
};

export default function BoletinesScreen() {
  const { selectedChildId, children } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDownload = (report: any) => {
    // TODO: Download file from Directus
    console.log('Downloading:', report.title);
  };

  // Filter reports based on selected child
  const displayReports = selectedChildId
    ? { [children.find(c => c.id === selectedChildId)?.first_name + ' ' + children.find(c => c.id === selectedChildId)?.last_name || '']: mockReports['Teodelina Orzabal'] }
    : mockReports;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FilterBar unreadCount={unreadCounts.boletines} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.entries(displayReports).map(([childName, reports]) => (
          <View key={childName} style={styles.childSection}>
            <Text style={styles.childName}>{childName}</Text>

            {(reports as any[]).map(report => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportRow}
                onPress={() => handleDownload(report)}
              >
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  {report.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NUEVO</Text>
                    </View>
                  )}
                </View>
                <View style={styles.downloadButton}>
                  <Text style={styles.downloadIcon}>📥</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {Object.keys(displayReports).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay boletines disponibles</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  childSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 16,
    color: '#333',
  },
  newBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
});
