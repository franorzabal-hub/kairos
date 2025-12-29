import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts } from '../context/AppContext';

const COLORS = {
  primary: '#8B1538',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
};

// Mock data
const mockMessages = [
  {
    id: '1',
    subject: 'Fecha de inicio ciclo lectivo 2026',
    preview: 'Queridas familias: Aún no tenemos la fecha oficial...',
    author: 'De Carolis, Amorina',
    recipients: ['Francisco Orzabal', 'Magdalena Carlucci'],
    date: '22/12/2025 12:34',
    isRead: false,
  },
  {
    id: '2',
    subject: 'Proyecto solidario "Cajas navideñas"',
    preview: 'Queridas Familias: Queremos contarles que esta...',
    author: 'Magdalena Carlucci',
    recipients: ['Francisco Orzabal'],
    date: '22/12/2025 08:49',
    isRead: false,
  },
  {
    id: '3',
    subject: 'Confirmación Campamento 5°EP',
    preview: 'Estimadas familias: Con el fin de poder mantener l...',
    author: 'Magdalena Carlucci',
    recipients: ['Francisco Orzabal'],
    date: '15/12/2025 11:02',
    isRead: true,
  },
];

export default function MensajesScreen() {
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const [refreshing, setRefreshing] = useState(false);

  const filteredMessages = mockMessages.filter(m => {
    if (filterMode === 'unread' && m.isRead) return false;
    return true;
  });

  const unreadMessages = filteredMessages.filter(m => !m.isRead);
  const readMessages = filteredMessages.filter(m => m.isRead);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderMessage = (item: typeof mockMessages[0]) => (
    <TouchableOpacity key={item.id} style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <Text style={[styles.messageSubject, !item.isRead && styles.unreadText]} numberOfLines={1}>
          {item.subject}
        </Text>
        <Text style={styles.messageIcon}>{item.isRead ? '✉️' : '📩'}</Text>
      </View>
      <Text style={styles.messageMeta}>
        {item.date} | {item.recipients.join(', ')}
      </Text>
      <Text style={styles.messagePreview} numberOfLines={1}>
        {item.preview}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FilterBar unreadCount={unreadCounts.mensajes} />

      <FlatList
        data={[{ type: 'content' }]}
        keyExtractor={() => 'content'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={() => (
          <View>
            {unreadMessages.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Mensajes no leídos</Text>
                {unreadMessages.map(renderMessage)}
              </>
            )}

            {readMessages.length > 0 && filterMode === 'all' && (
              <>
                <Text style={styles.sectionHeader}>Mensajes leídos</Text>
                {readMessages.map(renderMessage)}
              </>
            )}

            {filteredMessages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay mensajes</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.lightGray,
  },
  messageCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
    color: '#000',
  },
  messageIcon: {
    fontSize: 18,
  },
  messageMeta: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: COLORS.gray,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
  },
});
