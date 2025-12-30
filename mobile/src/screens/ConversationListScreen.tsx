import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useAuth, useFilters, useUnreadCounts } from '../context/AppContext';
import { useConversations, ConversationWithMeta } from '../api/hooks';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, UNREAD_STYLES } from '../theme';

// Screen-specific colors for conversation list
const LIST_COLORS = {
  urgent: '#D32F2F',        // Urgent message indicator
  urgentLight: '#FFEBEE',   // Light red background for urgent avatars
};

export default function ConversationListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();
  const queryResult = useConversations();
  const { data: conversations = [], isLoading, refetch, isRefetching } = queryResult;

  // Apply filters
  const filteredConversations = useMemo(() => {
    if (filterMode === 'unread') {
      return conversations.filter(conv => conv.unreadCount > 0);
    }
    return conversations;
  }, [conversations, filterMode]);

  const onRefresh = async () => {
    await refetch();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('es-AR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getParticipantName = (conversation: ConversationWithMeta) => {
    if (conversation.otherParticipants.length === 0) return 'Sin participantes';
    const participant = conversation.otherParticipants[0];
    const name = [participant.first_name, participant.last_name].filter(Boolean).join(' ');
    return name || participant.email || 'Usuario';
  };

  const getLastMessagePreview = (conversation: ConversationWithMeta) => {
    if (!conversation.lastMessage) return 'Sin mensajes';
    const sender = typeof conversation.lastMessage.sender_id === 'object'
      ? conversation.lastMessage.sender_id
      : null;
    const senderId = typeof conversation.lastMessage.sender_id === 'string'
      ? conversation.lastMessage.sender_id
      : conversation.lastMessage.sender_id?.id;
    const senderName = sender?.first_name || 'Usuario';
    const isMe = senderId === user?.directus_user_id;
    const prefix = isMe ? 'Tú: ' : `${senderName}: `;
    return prefix + conversation.lastMessage.content;
  };

  const handleConversationPress = (conversation: ConversationWithMeta) => {
    router.push({ pathname: '/mensajes/[id]', params: { id: conversation.id } });
  };

  const renderConversation = ({ item }: { item: ConversationWithMeta }) => {
    const hasUnread = item.unreadCount > 0;
    const isUrgent = item.lastMessage?.is_urgent;
    const isClosed = item.status === 'closed';

    return (
      <TouchableOpacity
        style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
        onPress={() => handleConversationPress(item)}
        disabled={item.isBlocked}
      >
        {/* Avatar */}
        <View style={[styles.avatar, isUrgent && styles.avatarUrgent]}>
          <Ionicons
            name={item.type === 'group' ? 'people' : 'person'}
            size={24}
            color={isUrgent ? LIST_COLORS.urgent : COLORS.primary}
          />
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, hasUnread && styles.unreadText]} numberOfLines={1}>
              {getParticipantName(item)}
            </Text>
            <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
              {formatDate(item.lastMessage?.date_created || item.date_created)}
            </Text>
          </View>

          <View style={styles.subjectRow}>
            <Text style={styles.subject} numberOfLines={1}>
              {item.subject}
            </Text>
            {isClosed && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>Cerrado</Text>
              </View>
            )}
          </View>

          <View style={styles.previewRow}>
            <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
              {getLastMessagePreview(item)}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Status indicators */}
          <View style={styles.statusRow}>
            {!item.canReply && (
              <View style={styles.statusIndicator}>
                <Ionicons name="lock-closed" size={12} color={COLORS.gray} />
                <Text style={styles.statusText}>Solo lectura</Text>
              </View>
            )}
            {item.isBlocked && (
              <View style={styles.statusIndicator}>
                <Ionicons name="ban" size={12} color={LIST_COLORS.urgent} />
                <Text style={[styles.statusText, { color: LIST_COLORS.urgent }]}>Bloqueado</Text>
              </View>
            )}
          </View>
        </View>
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
        <FlashList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={renderConversation}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No hay conversaciones</Text>
              <Text style={styles.emptyText}>
                Los profesores pueden iniciar conversaciones contigo
              </Text>
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
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.screenPadding,
    padding: SPACING.cardPadding,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  conversationCardUnread: {
    ...UNREAD_STYLES.borderLeft,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarUrgent: {
    backgroundColor: LIST_COLORS.urgentLight,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  participantName: {
    flex: 1,
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.black,
    marginRight: SPACING.sm,
  },
  unreadText: {
    ...TYPOGRAPHY.listItemTitleBold,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  timestampUnread: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  subject: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.gray,
  },
  closedBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
    marginLeft: SPACING.sm,
  },
  closedBadgeText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.gray,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  previewUnread: {
    color: COLORS.darkGray,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  unreadBadgeText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.white,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
