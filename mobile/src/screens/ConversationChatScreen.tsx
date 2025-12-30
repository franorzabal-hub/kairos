import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import {
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  useCloseConversation,
  useMuteConversation,
  useArchiveConversation,
  useToggleParticipantBlocked,
} from '../api/hooks';
import { ConversationMessage } from '../api/directus';
import { MensajesStackParamList } from '../navigation/types';
import { COLORS } from '../theme';

type NavigationProp = NativeStackNavigationProp<MensajesStackParamList, 'ConversationChat'>;
type ChatRouteProp = RouteProp<MensajesStackParamList, 'ConversationChat'>;

// Screen-specific colors for chat bubbles and urgent indicators
const CHAT_COLORS = {
  myBubble: '#DCF8C6',      // WhatsApp-style green for sent messages
  theirBubble: '#FFFFFF',   // White for received messages
  urgent: '#D32F2F',        // Urgent message indicator
  urgentLight: '#FFEBEE',   // Light red background for urgent toggle
};

export default function ConversationChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { conversationId, participantId, subject, canReply } = route.params;

  // Debug logging
  console.log('[ConversationChatScreen] Route params:', JSON.stringify(route.params, null, 2));
  console.log('[ConversationChatScreen] canReply value:', canReply, 'type:', typeof canReply);

  const { user } = useAppContext();
  const directusUserId = user?.directus_user_id;

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
  const flatListRef = useRef<FlatList>(null);

  // Check if user is teacher (can manage conversations)
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

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
        flatListRef.current?.scrollToEnd({ animated: true });
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
              navigation.goBack();
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
              navigation.goBack();
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
                participantId: participantId,
                isBlocked: true,
              });
              Alert.alert('Éxito', 'El participante ha sido bloqueado');
              navigation.goBack();
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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

  const shouldShowDateSeparator = (index: number, messages: ConversationMessage[]) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].date_created).toDateString();
    const prevDate = new Date(messages[index - 1].date_created).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }: { item: ConversationMessage; index: number }) => {
    const senderId = typeof item.sender_id === 'string' ? item.sender_id : item.sender_id?.id;
    const isMyMessage = senderId === directusUserId;
    const sender = typeof item.sender_id === 'object' ? item.sender_id : null;
    const senderName = sender ? [sender.first_name, sender.last_name].filter(Boolean).join(' ') : 'Usuario';
    const showDate = shouldShowDateSeparator(index, messages);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.date_created)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isMyMessage && styles.messageRowMine]}>
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myBubble : styles.theirBubble,
              item.is_urgent && styles.urgentBubble,
            ]}
          >
            {!isMyMessage && (
              <Text style={styles.senderName}>{senderName}</Text>
            )}
            {item.is_urgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="alert-circle" size={14} color={CHAT_COLORS.urgent} />
                <Text style={styles.urgentText}>Urgente</Text>
              </View>
            )}
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={[styles.messageTime, isMyMessage && styles.messageTimeMine]}>
              {formatTime(item.date_created)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {subject}
            </Text>
            <View style={styles.headerIndicators}>
              {!canReply && (
                <View style={styles.readOnlyIndicator}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.gray} />
                  <Text style={styles.readOnlyText}>Solo lectura</Text>
                </View>
              )}
              {isMuted && (
                <View style={styles.mutedIndicator}>
                  <Ionicons name="notifications-off" size={12} color={COLORS.gray} />
                  <Text style={styles.readOnlyText}>Silenciada</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
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
        {canReply ? (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
              onPress={() => setIsUrgent(!isUrgent)}
            >
              <Ionicons
                name="alert-circle"
                size={24}
                color={isUrgent ? CHAT_COLORS.urgent : COLORS.gray}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={COLORS.gray}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 12,
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: COLORS.gray,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: CHAT_COLORS.myBubble,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: CHAT_COLORS.theirBubble,
    borderBottomLeftRadius: 4,
  },
  urgentBubble: {
    borderWidth: 1,
    borderColor: CHAT_COLORS.urgent,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgentText: {
    fontSize: 11,
    color: CHAT_COLORS.urgent,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  messageTimeMine: {
    alignSelf: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  urgentToggle: {
    padding: 8,
  },
  urgentToggleActive: {
    backgroundColor: CHAT_COLORS.urgentLight,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  readOnlyBannerText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
});
