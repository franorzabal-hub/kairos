import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts } from '../context/AppContext';
import { useMessages, useMarkMessageRead, MessageWithReadStatus } from '../api/hooks';
import { MensajesStackParamList } from '../navigation/types';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, UNREAD_STYLES, SHADOWS } from '../theme';

type MensajesScreenNavigationProp = NativeStackNavigationProp<MensajesStackParamList, 'MensajesList'>;

export default function MensajesScreen() {
  const navigation = useNavigation<MensajesScreenNavigationProp>();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();

  const { data: messages = [], isLoading, refetch, isRefetching } = useMessages();
  const markAsRead = useMarkMessageRead();

  // Apply filters - messages use server-side read_at tracking
  const filteredMessages = useMemo(() => {
    if (filterMode === 'unread') {
      return messages.filter(msg => !msg.read_at);
    }
    return messages;
  }, [messages, filterMode]);

  const onRefresh = async () => {
    await refetch();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMessagePress = (item: MessageWithReadStatus) => {
    if (!item.read_at && item.recipientId) {
      markAsRead.mutate(item.recipientId);
    }
    navigation.navigate('MessageDetail', { message: item });
  };

  const renderMessage = (item: MessageWithReadStatus) => {
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.messageCard, isUnread && styles.messageCardUnread]}
        onPress={() => handleMessagePress(item)}
      >
        <View style={styles.messageHeader}>
          <View style={styles.subjectRow}>
            {isUnread && <View style={styles.unreadDot} />}
            <Text style={[styles.messageSubject, isUnread && styles.unreadText]} numberOfLines={1}>
              {item.subject}
            </Text>
          </View>
          <Ionicons
            name={isUnread ? 'mail-unread-outline' : 'mail-outline'}
            size={20}
            color={isUnread ? COLORS.primary : COLORS.gray}
          />
        </View>
        <Text style={styles.messageMeta}>
          {formatDate(item.created_at)}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Mensajes" />
      <FilterBar unreadCount={unreadCounts.mensajes} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => renderMessage(item)}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay mensajes</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="create-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  messageCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.screenPadding,
    padding: SPACING.cardPadding,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  messageCardUnread: {
    ...UNREAD_STYLES.borderLeft,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  subjectRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  unreadDot: {
    ...UNREAD_STYLES.dotSmall,
    marginRight: SPACING.sm,
  },
  messageSubject: {
    flex: 1,
    ...TYPOGRAPHY.listItemTitle,
  },
  unreadText: {
    ...TYPOGRAPHY.listItemTitleBold,
    color: COLORS.black,
  },
  messageMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  messagePreview: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginHorizontal: SPACING.screenPadding,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.tabBarOffset,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.fab,
  },
});
