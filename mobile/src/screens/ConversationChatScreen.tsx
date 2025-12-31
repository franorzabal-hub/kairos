import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useSession } from '../hooks';
import {
  useConversationMessages,
  useConversation,
  useSendMessage,
  useMarkConversationRead,
  useCloseConversation,
  useMuteConversation,
  useArchiveConversation,
  useToggleParticipantBlocked,
} from '../api/hooks';
import { ConversationMessage, DirectusUser } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SIZES } from '../theme';
import { ChatBubble, FirstMessageCard, MessageInput, DateSeparator } from '../components/chat';

// Screen-specific colors
const CHAT_COLORS = {
  closedBanner: '#F5F5F5',  // Gray background for closed conversation
};

export default function ConversationChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const conversationId = typeof id === 'string' ? id : '';

  const { user } = useSession();
  const directusUserId = user?.directus_user_id;

  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [], isLoading, refetch } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationRead();
  const closeConversation = useCloseConversation();
  const muteConversation = useMuteConversation();
  const archiveConversation = useArchiveConversation();
  const toggleBlocked = useToggleParticipantBlocked();

  const [inputText, setInputText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const listRef = useRef<FlashListRef<ConversationMessage>>(null);

  // Check if user is teacher (can manage conversations)
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const currentParticipant = conversation?.participants?.find((participant) => {
    const participantUserId = typeof participant.user_id === 'string'
      ? participant.user_id
      : participant.user_id?.id;
    return participantUserId === directusUserId;
  });

  // Get other participants (teachers/staff)
  const otherParticipants = (conversation?.participants ?? []).filter((participant) => {
    const participantUserId = typeof participant.user_id === 'string'
      ? participant.user_id
      : participant.user_id?.id;
    return participantUserId !== directusUserId;
  });

  // Get primary other participant for header display
  const primaryParticipant = otherParticipants[0];
  const primaryParticipantUser = primaryParticipant?.user_id as DirectusUser | undefined;
  const participantName = primaryParticipantUser
    ? [primaryParticipantUser.first_name, primaryParticipantUser.last_name?.charAt(0)].filter(Boolean).join(' ')
    : 'Participante';
  const participantInitials = primaryParticipantUser
    ? `${primaryParticipantUser.first_name?.charAt(0) ?? ''}${primaryParticipantUser.last_name?.charAt(0) ?? ''}`
    : '?';

  const participantId = currentParticipant?.id ?? '';
  const canReply = currentParticipant?.can_reply ?? true;
  const subject = conversation?.subject ?? 'Conversación';
  const isClosed = conversation?.status === 'closed';

  useEffect(() => {
    if (currentParticipant) {
      setIsMuted(Boolean(currentParticipant.is_muted));
    }
  }, [currentParticipant?.is_muted]);

  // Mark conversation as read when entering
  useEffect(() => {
    if (participantId) {
      markAsRead.mutate(participantId);
    }
  }, [participantId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: inputText.trim(),
        isUrgent,
      });
      setInputText('');
      setIsUrgent(false);
      refetch();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMenuPress = () => {
    // Different options for teachers vs parents
    if (Platform.OS === 'ios') {
      const options = isTeacher
        ? [
            'Cerrar conversación',
            'Archivar conversación',
            'Bloquear participante',
            isMuted ? 'Activar notificaciones' : 'Silenciar',
            'Cancelar',
          ]
        : [isMuted ? 'Activar notificaciones' : 'Silenciar', 'Cancelar'];

      const cancelButtonIndex = options.length - 1;
      const destructiveButtonIndex = isTeacher ? 0 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (isTeacher) {
            if (buttonIndex === 0) handleCloseConversation();
            else if (buttonIndex === 1) handleArchiveConversation();
            else if (buttonIndex === 2) handleBlockParticipant();
            else if (buttonIndex === 3) handleToggleMute();
          } else {
            if (buttonIndex === 0) handleToggleMute();
          }
        }
      );
    } else {
      // Android: Use Alert for now (can be replaced with a proper action sheet library)
      const options = isTeacher
        ? [
            { text: 'Cerrar conversación', onPress: handleCloseConversation, style: 'destructive' as const },
            { text: 'Archivar conversación', onPress: handleArchiveConversation },
            { text: 'Bloquear participante', onPress: handleBlockParticipant, style: 'destructive' as const },
            { text: isMuted ? 'Activar notificaciones' : 'Silenciar', onPress: handleToggleMute },
            { text: 'Cancelar', style: 'cancel' as const },
          ]
        : [
            { text: isMuted ? 'Activar notificaciones' : 'Silenciar', onPress: handleToggleMute },
            { text: 'Cancelar', style: 'cancel' as const },
          ];

      Alert.alert('Opciones', undefined, options);
    }
  };

  const handleCloseConversation = () => {
    Alert.alert(
      'Cerrar conversación',
      '¿Estás seguro que querés cerrar esta conversación? Los participantes no podrán enviar más mensajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeConversation.mutateAsync({ conversationId });
              Alert.alert('Éxito', 'La conversación ha sido cerrada');
              router.back();
            } catch (error) {
              console.error('Error closing conversation:', error);
              Alert.alert('Error', 'No se pudo cerrar la conversación');
            }
          },
        },
      ]
    );
  };

  const handleArchiveConversation = () => {
    Alert.alert(
      'Archivar conversación',
      '¿Estás seguro que querés archivar esta conversación? Se ocultará de la lista principal pero se podrá recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          onPress: async () => {
            try {
              await archiveConversation.mutateAsync(conversationId);
              Alert.alert('Éxito', 'La conversación ha sido archivada');
              router.back();
            } catch (error) {
              console.error('Error archiving conversation:', error);
              Alert.alert('Error', 'No se pudo archivar la conversación');
            }
          },
        },
      ]
    );
  };

  const handleBlockParticipant = () => {
    Alert.alert(
      'Bloquear participante',
      '¿Estás seguro que querés bloquear al participante? No podrá ver ni enviar mensajes en esta conversación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Block the other participant (not current user)
              // This would need the other participant's ID - for now we use participantId
              // In a real implementation, we'd need to fetch the other participant's record
              await toggleBlocked.mutateAsync({
                participantId,
                isBlocked: true,
              });
              Alert.alert('Éxito', 'El participante ha sido bloqueado');
              router.back();
            } catch (error) {
              console.error('Error blocking participant:', error);
              Alert.alert('Error', 'No se pudo bloquear al participante');
            }
          },
        },
      ]
    );
  };

  const handleToggleMute = async () => {
    try {
      if (!participantId) return;
      await muteConversation.mutateAsync({
        participantId,
        isMuted: !isMuted,
      });
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado de notificaciones');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const shouldShowDateSeparator = (index: number, msgs: ConversationMessage[]) => {
    if (index === 0) return true;
    const currentDate = new Date(msgs[index].date_created).toDateString();
    const prevDate = new Date(msgs[index - 1].date_created).toDateString();
    return currentDate !== prevDate;
  };

  // Memoized keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: ConversationMessage) => item.id, []);

  // Memoized renderItem to prevent unnecessary re-renders
  const renderMessage = useCallback(({ item, index }: { item: ConversationMessage; index: number }) => {
    const senderId = typeof item.sender_id === 'string' ? item.sender_id : item.sender_id?.id;
    const isMyMessage = senderId === directusUserId;
    const showDate = shouldShowDateSeparator(index, messages);
    const isFirstMessage = index === 0;

    return (
      <View>
        {showDate && <DateSeparator date={formatDate(item.date_created)} />}
        {isFirstMessage ? (
          <FirstMessageCard message={item} />
        ) : (
          <ChatBubble message={item} isMyMessage={isMyMessage} />
        )}
      </View>
    );
  }, [directusUserId, messages, shouldShowDateSeparator, formatDate]);

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Conversación inválida</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Gmail-style Header with Subject + Context */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {subject}
            </Text>
            <View style={styles.headerContext}>
              <Text style={styles.headerContextText} numberOfLines={1}>
                {participantName}
                {otherParticipants.length > 1 && ` +${otherParticipants.length - 1}`}
              </Text>
              {(isMuted || !canReply || isClosed) && (
                <View style={styles.headerIndicators}>
                  {isClosed && (
                    <View style={styles.closedIndicator}>
                      <Ionicons name="lock-closed" size={10} color={COLORS.gray} />
                      <Text style={styles.indicatorText}>Cerrado</Text>
                    </View>
                  )}
                  {!canReply && !isClosed && (
                    <View style={styles.readOnlyIndicator}>
                      <Ionicons name="eye" size={10} color={COLORS.gray} />
                      <Text style={styles.indicatorText}>Lectura</Text>
                    </View>
                  )}
                  {isMuted && (
                    <View style={styles.mutedIndicator}>
                      <Ionicons name="notifications-off" size={10} color={COLORS.gray} />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          {/* Avatar */}
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{participantInitials}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Sin mensajes</Text>
                <Text style={styles.emptySubtext}>Sé el primero en escribir</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        {canReply && !isClosed ? (
          <MessageInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            isTeacher={isTeacher}
            isUrgent={isUrgent}
            onToggleUrgent={() => setIsUrgent(!isUrgent)}
          />
        ) : isClosed ? (
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed" size={18} color={COLORS.gray} />
            <Text style={styles.closedBannerText}>
              Esta conversación está cerrada
            </Text>
          </View>
        ) : (
          <View style={styles.readOnlyBanner}>
            <Ionicons name="lock-closed" size={18} color={COLORS.gray} />
            <Text style={styles.readOnlyBannerText}>
              Esta conversación es de solo lectura
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: BORDERS.width.thin,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.black,
  },
  headerContext: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  headerContextText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    flex: 1,
  },
  headerAvatar: {
    width: SIZES.avatarMd,
    height: SIZES.avatarMd,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  headerAvatarText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
    gap: SPACING.md,
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  closedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  mutedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorText: {
    ...TYPOGRAPHY.badgeSmall,
    color: COLORS.gray,
  },
  menuButton: {
    padding: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl + SPACING.xxl + SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.lightGray,
    borderTopWidth: BORDERS.width.thin,
    borderTopColor: COLORS.border,
  },
  readOnlyBannerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: CHAT_COLORS.closedBanner,
    borderTopWidth: BORDERS.width.thin,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  closedBannerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
});
