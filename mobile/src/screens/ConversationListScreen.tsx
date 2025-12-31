import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import ChildSelector from '../components/ChildSelector';
import SegmentedControl from '../components/SegmentedControl';
import { useUnreadCounts } from '../context/AppContext';
import { useConversations, ConversationWithMeta } from '../api/hooks';
import { useSession } from '../hooks';
import { COLORS, CHILD_COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, UNREAD_STYLES } from '../theme';

// Screen-specific colors for conversation list
const LIST_COLORS = {
  urgent: '#D32F2F',        // Urgent message indicator
  urgentLight: '#FFEBEE',   // Light red background for urgent avatars
};

// Avatar colors palette - varied colors for different participants
const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
];

// Available contact channels - defined by the school
// TODO: Later this could come from Directus configuration
interface ContactChannel {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: 'secretaria',
    name: 'Secretaría',
    description: 'Pagos, documentación, trámites',
    icon: 'document-text-outline',
    color: '#6366F1',
  },
  {
    id: 'enfermeria',
    name: 'Enfermería',
    description: 'Salud, medicamentos, accidentes',
    icon: 'medkit-outline',
    color: '#EF4444',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    description: 'Rutas, horarios, cambios',
    icon: 'bus-outline',
    color: '#F59E0B',
  },
  {
    id: 'comedor',
    name: 'Comedor',
    description: 'Menú, alergias, dietas',
    icon: 'restaurant-outline',
    color: '#10B981',
  },
];

// Get a consistent color based on user ID hash
function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type MessageFilter = 'all' | 'unread';

export default function ConversationListScreen() {
  const router = useRouter();
  // Centralized session state - user, children, permissions
  const { user, children, selectedChildId, setSelectedChildId } = useSession();
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('unread');
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const { unreadCounts } = useUnreadCounts();
  const queryResult = useConversations();
  const { data: conversations = [], isLoading, refetch, isRefetching } = queryResult;

  // Apply filters
  const filteredConversations = useMemo(() => {
    if (messageFilter === 'unread') {
      return conversations.filter(conv => conv.unreadCount > 0);
    }
    return conversations;
  }, [conversations, messageFilter]);

  // Count for tabs
  const allCount = conversations.length;
  const unreadCount = useMemo(() =>
    conversations.filter(conv => conv.unreadCount > 0).length,
    [conversations]
  );

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleSelectAll = () => {
    setSelectedChildId(null);
  };

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

  // Get participant info with name and role
  const getParticipantInfo = (conversation: ConversationWithMeta) => {
    if (conversation.otherParticipants.length === 0) {
      return { name: 'Administración', initials: 'AD', color: AVATAR_COLORS[0], userId: '' };
    }
    const participant = conversation.otherParticipants[0];
    const firstName = participant.first_name || '';
    const lastName = participant.last_name || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || participant.email || 'Usuario';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    const userId = participant.id || '';
    const color = getAvatarColor(userId);

    return { name, initials, color, userId };
  };

  // Get role display label based on participant relationship
  const getParticipantRole = (conversation: ConversationWithMeta): string | null => {
    // Check who started the conversation for role context
    const startedBy = conversation.started_by;
    if (typeof startedBy === 'object' && startedBy?.role) {
      // Could show role like "Secretaría", "Docente", etc.
      // For now, return null - can be enhanced with role lookup
    }
    return null;
  };

  // Try to detect which child the conversation is about from the subject
  const getRelatedChildName = (conversation: ConversationWithMeta): string | null => {
    const subject = conversation.subject.toLowerCase();
    for (const child of children) {
      const childName = child.first_name?.toLowerCase();
      if (childName && subject.includes(childName)) {
        return child.first_name;
      }
    }
    return null;
  };

  // Get child color if conversation is about a specific child
  const getChildColor = (childName: string | null): string | null => {
    if (!childName) return null;
    const index = children.findIndex(c => c.first_name?.toLowerCase() === childName.toLowerCase());
    if (index >= 0) {
      return CHILD_COLORS[index % CHILD_COLORS.length];
    }
    return null;
  };

  const getParticipantName = (conversation: ConversationWithMeta) => {
    if (conversation.otherParticipants.length === 0) return 'Administración';
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

    // Get participant info for avatar
    const participantInfo = getParticipantInfo(item);
    // Detect related child from subject
    const relatedChildName = getRelatedChildName(item);
    const childColor = getChildColor(relatedChildName);

    return (
      <TouchableOpacity
        style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
        onPress={() => handleConversationPress(item)}
        disabled={item.isBlocked}
      >
        {/* Avatar with Initials */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isUrgent ? LIST_COLORS.urgentLight : `${participantInfo.color}20` },
            ]}
          >
            <Text style={[styles.avatarText, { color: isUrgent ? LIST_COLORS.urgent : participantInfo.color }]}>
              {participantInfo.initials}
            </Text>
          </View>
          {/* Urgent indicator dot */}
          {isUrgent && (
            <View style={styles.urgentDot} />
          )}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          {/* Row 1: Sender Name + Timestamp */}
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, hasUnread && styles.unreadText]} numberOfLines={1}>
              {participantInfo.name}
            </Text>
            <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
              {formatDate(item.lastMessage?.date_created || item.date_created)}
            </Text>
          </View>

          {/* Row 2: Subject + Closed badge */}
          <View style={styles.subjectRow}>
            <Text style={[styles.subject, hasUnread && styles.subjectUnread]} numberOfLines={1}>
              {item.subject}
            </Text>
            {isClosed && (
              <View style={styles.closedBadge}>
                <Ionicons name="checkmark-circle" size={10} color={COLORS.gray} />
                <Text style={styles.closedBadgeText}>Cerrado</Text>
              </View>
            )}
          </View>

          {/* Row 3: Preview + Child indicator + Unread count */}
          <View style={styles.previewRow}>
            <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
              {getLastMessagePreview(item)}
            </Text>

            {/* Right side indicators */}
            <View style={styles.rowIndicators}>
              {/* Child indicator (small colored dot with initial) */}
              {relatedChildName && children.length > 1 && (
                <View style={[styles.childIndicator, { backgroundColor: childColor || COLORS.gray }]}>
                  <Text style={styles.childIndicatorText}>
                    {relatedChildName.charAt(0)}
                  </Text>
                </View>
              )}

              {/* Unread badge */}
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status indicators (subtle, only when needed) */}
          {(!item.canReply || item.isBlocked) && (
            <View style={styles.statusRow}>
              {!item.canReply && !isClosed && (
                <View style={styles.statusIndicator}>
                  <Ionicons name="eye-outline" size={10} color={COLORS.gray} />
                  <Text style={styles.statusText}>Solo lectura</Text>
                </View>
              )}
              {item.isBlocked && (
                <View style={styles.statusIndicator}>
                  <Ionicons name="ban-outline" size={10} color={LIST_COLORS.urgent} />
                  <Text style={[styles.statusText, { color: LIST_COLORS.urgent }]}>Bloqueado</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Screen Header */}
      <ScreenHeader title="Mensajes" />

      {/* Child Selector - always show if there are children */}
      {children.length > 0 && (
        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onSelectChild={handleSelectChild}
          showAllOption={children.length > 1}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Message filter */}
      <View style={styles.filterContainer}>
        <SegmentedControl
          segments={[
            { key: 'unread', label: 'No leídos', count: unreadCount },
            { key: 'all', label: 'Todos', count: allCount },
          ]}
          selectedKey={messageFilter}
          onSelect={(key) => setMessageFilter(key as MessageFilter)}
          accentColor={selectedChildId
            ? CHILD_COLORS[children.findIndex(c => c.id === selectedChildId) % CHILD_COLORS.length]
            : undefined
          }
        />
      </View>
    </View>
  );

  // Handle channel selection
  const handleChannelSelect = useCallback((channel: ContactChannel) => {
    setShowChannelSelector(false);
    // Navigate to the channel's conversation (or create new)
    router.push({
      pathname: '/mensajes/nuevo',
      params: { channelId: channel.id, channelName: channel.name },
    });
  }, [router]);

  // Open channel selector - if only one channel, go directly
  const handleNewConversation = useCallback(() => {
    if (CONTACT_CHANNELS.length === 1) {
      // Single channel - go directly
      handleChannelSelect(CONTACT_CHANNELS[0]);
    } else {
      // Multiple channels - show selector
      setShowChannelSelector(true);
    }
  }, [handleChannelSelect]);

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

      {/* FAB - New Conversation */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewConversation}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Channel Selector Modal */}
      <Modal
        visible={showChannelSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChannelSelector(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowChannelSelector(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Title */}
            <Text style={styles.modalTitle}>Nuevo mensaje</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona el área con la que deseas comunicarte
            </Text>

            {/* Channel options */}
            <View style={styles.channelList}>
              {CONTACT_CHANNELS.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  style={styles.channelItem}
                  onPress={() => handleChannelSelect(channel)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.channelIcon, { backgroundColor: `${channel.color}15` }]}>
                    <Ionicons name={channel.icon} size={24} color={channel.color} />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.channelDescription}>{channel.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowChannelSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  },
  filterContainer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
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
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  urgentDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LIST_COLORS.urgent,
    borderWidth: 2,
    borderColor: COLORS.white,
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
  subjectUnread: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  rowIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  childIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
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
  // FAB - Floating Action Button
  fab: {
    position: 'absolute',
    right: SPACING.screenPadding,
    bottom: SPACING.tabBarOffset + SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.fab,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDERS.radius.xl,
    borderTopRightRadius: BORDERS.radius.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.screenPadding,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  channelList: {
    gap: SPACING.sm,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  channelDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  cancelButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
