import React, { useMemo, useState, useCallback } from 'react';
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
import ChildSelector from '../components/ChildSelector';
import SegmentedControl from '../components/SegmentedControl';
import {
  ConversationCard,
  ChannelSelectorModal,
  ContactChannel,
} from '../components/conversation';
import { useUnreadCounts } from '../context/UIContext';
import { useConversations, ConversationWithMeta } from '../api/hooks';
import { useSession } from '../hooks';
import { COLORS, CHILD_COLORS, SPACING, SIZES, SHADOWS } from '../theme';

// Available contact channels - defined by the school
// TODO: Later this could come from Frappe configuration
const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: 'secretaria',
    name: 'Secretaria',
    description: 'Pagos, documentacion, tramites',
    icon: 'document-text-outline',
    color: '#6366F1',
  },
  {
    id: 'enfermeria',
    name: 'Enfermeria',
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
    description: 'Menu, alergias, dietas',
    icon: 'restaurant-outline',
    color: '#10B981',
  },
];

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

  const handleConversationPress = useCallback((conversation: ConversationWithMeta) => {
    router.push({ pathname: '/mensajes/[id]', params: { id: conversation.id } });
  }, [router]);

  // Memoized keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: ConversationWithMeta) => item.id, []);

  // Memoized renderItem using extracted ConversationCard component
  const renderConversation = useCallback(({ item }: { item: ConversationWithMeta }) => (
    <ConversationCard
      conversation={item}
      children={children}
      currentUserId={user?.id}
      onPress={handleConversationPress}
    />
  ), [children, user?.id, handleConversationPress]);

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
            { key: 'unread', label: 'No leidos', count: unreadCount },
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
          keyExtractor={keyExtractor}
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
      <ChannelSelectorModal
        visible={showChannelSelector}
        channels={CONTACT_CHANNELS}
        onSelectChannel={handleChannelSelect}
        onClose={() => setShowChannelSelector(false)}
      />
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  // FAB - Floating Action Button
  fab: {
    position: 'absolute',
    right: SPACING.screenPadding,
    bottom: SPACING.tabBarOffset + SPACING.md,
    width: SIZES.fabSize,
    height: SIZES.fabSize,
    borderRadius: SIZES.fabSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.fab,
  },
});
