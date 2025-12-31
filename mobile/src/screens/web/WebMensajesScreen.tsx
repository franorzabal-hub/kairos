/**
 * WebMensajesScreen - Web-optimized Messages screen
 *
 * Features:
 * - WebLayout with sidebar navigation
 * - MasterDetailLayout for conversation list + chat
 * - WebConversationCard with hover effects
 * - Inline chat view (no navigation)
 * - New conversation panel (replaces modal)
 * - Keyboard shortcuts (Escape to close, Arrow keys to navigate)
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, TextInput, ScrollView, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebLayout, MasterDetailLayout, WebConversationCard, WebMessageInput, ResponsiveCardList } from '../../components/web';
import SegmentedControl from '../../components/SegmentedControl';
import { ChatBubble, FirstMessageCard, DateSeparator } from '../../components/chat';
import {
  useConversations,
  useConversation,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  useCreateConversation,
} from '../../api/hooks';
import { useSession } from '../../hooks';
import { Conversation, ConversationMessage, DirectusUser } from '../../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

type MessageFilter = 'all' | 'unread';
type ViewMode = 'list' | 'chat' | 'new';

interface ContactChannel {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CONTACT_CHANNELS: ContactChannel[] = [
  { id: 'secretaria', name: 'Secretaría', description: 'Pagos, documentación, trámites', icon: 'document-text-outline', color: '#6366F1' },
  { id: 'enfermeria', name: 'Enfermería', description: 'Salud, medicamentos, accidentes', icon: 'medkit-outline', color: '#EF4444' },
  { id: 'transporte', name: 'Transporte', description: 'Rutas, horarios, cambios', icon: 'bus-outline', color: '#F59E0B' },
  { id: 'comedor', name: 'Comedor', description: 'Menú, alergias, dietas', icon: 'restaurant-outline', color: '#10B981' },
];

export default function WebMensajesScreen() {
  const { user } = useSession();
  const directusUserId = user?.directus_user_id;

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newConversationChannel, setNewConversationChannel] = useState<ContactChannel | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef<View>(null);

  // Data fetching
  const { data: conversations = [], isLoading: loadingConversations, refetch: refetchConversations } = useConversations();
  const { data: selectedConversation } = useConversation(selectedConversationId ?? '');
  const { data: messages = [], isLoading: loadingMessages, refetch: refetchMessages } = useConversationMessages(selectedConversationId ?? '');

  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationRead();
  const createConversation = useCreateConversation();

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (messageFilter === 'unread') {
      return conversations.filter(conv => conv.unreadCount > 0);
    }
    return conversations;
  }, [conversations, messageFilter]);

  // Count unread
  const unreadCount = useMemo(() => {
    return conversations.filter(conv => conv.unreadCount > 0).length;
  }, [conversations]);

  // Get participant info for selected conversation
  const { participantName, participantInitials, otherParticipants, currentParticipant } = useMemo(() => {
    if (!selectedConversation) {
      return { participantName: '', participantInitials: '', otherParticipants: [], currentParticipant: null };
    }

    const participants = selectedConversation.participants ?? [];
    const current = participants.find(p => {
      const userId = typeof p.user_id === 'string' ? p.user_id : p.user_id?.id;
      return userId === directusUserId;
    });
    const others = participants.filter(p => {
      const userId = typeof p.user_id === 'string' ? p.user_id : p.user_id?.id;
      return userId !== directusUserId;
    });

    const primary = others[0];
    const primaryUser = primary?.user_id as DirectusUser | undefined;
    const name = primaryUser
      ? [primaryUser.first_name, primaryUser.last_name?.charAt(0)].filter(Boolean).join(' ')
      : 'Participante';
    const initials = primaryUser
      ? `${primaryUser.first_name?.charAt(0) ?? ''}${primaryUser.last_name?.charAt(0) ?? ''}`
      : '?';

    return {
      participantName: name,
      participantInitials: initials,
      otherParticipants: others,
      currentParticipant: current,
    };
  }, [selectedConversation, directusUserId]);

  const canReply = currentParticipant?.can_reply ?? true;
  const isClosed = selectedConversation?.status === 'closed';
  const participantId = currentParticipant?.id ?? '';

  // Mark conversation as read when selected
  useEffect(() => {
    if (participantId && selectedConversationId) {
      markAsRead.mutate(participantId);
    }
  }, [participantId, selectedConversationId, markAsRead]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setViewMode('chat');
    setNewConversationChannel(null);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: inputText.trim(),
        isUrgent: false,
      });
      setInputText('');
      refetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [inputText, selectedConversationId, sendMessage, refetchMessages]);

  // Handle new conversation
  const handleNewConversation = useCallback((channel: ContactChannel) => {
    setNewConversationChannel(channel);
    setViewMode('new');
    setSelectedConversationId(null);
    setNewSubject('');
    setNewMessage('');
  }, []);

  // Handle create conversation
  const handleCreateConversation = useCallback(async () => {
    if (!newSubject.trim() || !newMessage.trim() || !newConversationChannel) return;

    try {
      const result = await createConversation.mutateAsync({
        subject: newSubject.trim(),
        channelId: newConversationChannel.id,
        initialMessage: newMessage.trim(),
        isUrgent: false,
      });

      // Select the new conversation
      setSelectedConversationId(result.conversationId);
      setViewMode('chat');
      setNewConversationChannel(null);
      setNewSubject('');
      setNewMessage('');
      refetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [newSubject, newMessage, newConversationChannel, createConversation, refetchConversations]);

  // Handle close detail view
  const handleCloseDetail = useCallback(() => {
    setSelectedConversationId(null);
    setViewMode('list');
    setNewConversationChannel(null);
  }, []);

  // Format date for separators
  const formatDate = useCallback((dateStr: string) => {
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
  }, []);

  // Check if should show date separator
  const shouldShowDateSeparator = useCallback((index: number, msgs: ConversationMessage[]) => {
    if (index === 0) return true;
    const currentDate = new Date(msgs[index].date_created).toDateString();
    const prevDate = new Date(msgs[index - 1].date_created).toDateString();
    return currentDate !== prevDate;
  }, []);

  // Render conversation list (master panel)
  const renderMaster = () => (
    <View style={{
      flex: 1,
      backgroundColor: COLORS.white,
      borderRightWidth: 1,
      borderRightColor: COLORS.border,
      ...(Platform.OS === 'web' && {
        overflow: 'hidden',
      } as any),
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}>
        <Text style={{
          ...TYPOGRAPHY.sectionTitle,
          color: COLORS.darkGray,
        }}>
          Mensajes
        </Text>
        {/* New Conversation Button */}
        <Pressable
          onPress={() => setViewMode(viewMode === 'new' ? 'list' : 'new')}
          style={(state) => ({
            width: 36,
            height: 36,
            borderRadius: BORDERS.radius.full,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...(Platform.OS === 'web' && {
              cursor: 'pointer',
              opacity: (state as WebPressableState).hovered ? 0.85 : 1,
              transition: 'all 0.15s ease',
            } as any),
          })}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
        </Pressable>
      </View>

      {/* Filter */}
      <View style={{ padding: SPACING.sm }}>
        <SegmentedControl
          segments={[
            { key: 'all', label: 'Todos' },
            { key: 'unread', label: 'No leídos', count: unreadCount },
          ]}
          selectedKey={messageFilter}
          onSelect={(key) => setMessageFilter(key as MessageFilter)}
        />
      </View>

      {/* Conversation List */}
      {loadingConversations ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
          <Ionicons name="chatbubbles-outline" size={48} color={COLORS.gray} />
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray, marginTop: SPACING.md, textAlign: 'center' }}>
            {messageFilter === 'unread' ? 'No hay mensajes sin leer' : 'No hay conversaciones'}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          <ResponsiveCardList gap={0}>
            {filteredConversations.map((conversation) => (
              <WebConversationCard
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                isUnread={conversation.unreadCount > 0}
                onPress={() => handleSelectConversation(conversation.id)}
              />
            ))}
          </ResponsiveCardList>
        </ScrollView>
      )}
    </View>
  );

  // Render chat view (detail panel)
  const renderDetail = () => {
    // New conversation mode
    if (viewMode === 'new') {
      return (
        <View style={{
          flex: 1,
          backgroundColor: COLORS.lightGray,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.md,
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}>
            <Pressable
              onPress={handleCloseDetail}
              style={(state) => ({
                padding: SPACING.sm,
                marginRight: SPACING.sm,
                borderRadius: BORDERS.radius.md,
                ...(Platform.OS === 'web' && {
                  cursor: 'pointer',
                  backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                } as any),
              })}
            >
              <Ionicons name="close" size={24} color={COLORS.gray} />
            </Pressable>
            <Text style={{ ...TYPOGRAPHY.sectionTitle, color: COLORS.black, flex: 1 }}>
              Nueva conversación
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}>
            {/* Channel Selection */}
            {!newConversationChannel ? (
              <View>
                <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray, marginBottom: SPACING.md, textTransform: 'uppercase' }}>
                  Selecciona un departamento
                </Text>
                <View style={{ gap: SPACING.sm }}>
                  {CONTACT_CHANNELS.map((channel) => (
                    <Pressable
                      key={channel.id}
                      onPress={() => setNewConversationChannel(channel)}
                      style={(state) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: SPACING.md,
                        backgroundColor: COLORS.white,
                        borderRadius: BORDERS.radius.lg,
                        gap: SPACING.md,
                        ...(Platform.OS === 'web' && {
                          cursor: 'pointer',
                          boxShadow: (state as WebPressableState).hovered
                            ? '0 4px 12px rgba(0,0,0,0.1)'
                            : '0 1px 3px rgba(0,0,0,0.08)',
                          transition: 'box-shadow 0.2s ease',
                        } as any),
                      })}
                    >
                      <View style={{
                        width: 48,
                        height: 48,
                        borderRadius: BORDERS.radius.md,
                        backgroundColor: `${channel.color}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name={channel.icon} size={24} color={channel.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...TYPOGRAPHY.listItemTitle, color: COLORS.black }}>{channel.name}</Text>
                        <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray }}>{channel.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <>
                {/* Selected Channel */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  backgroundColor: COLORS.white,
                  borderRadius: BORDERS.radius.lg,
                  gap: SPACING.md,
                  ...SHADOWS.card,
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: BORDERS.radius.md,
                    backgroundColor: `${newConversationChannel.color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name={newConversationChannel.icon} size={24} color={newConversationChannel.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray }}>Para:</Text>
                    <Text style={{ ...TYPOGRAPHY.listItemTitle, color: COLORS.black }}>{newConversationChannel.name}</Text>
                  </View>
                  <Pressable
                    onPress={() => setNewConversationChannel(null)}
                    style={(state) => ({
                      padding: SPACING.sm,
                      borderRadius: BORDERS.radius.full,
                      ...(Platform.OS === 'web' && {
                        cursor: 'pointer',
                        backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                      } as any),
                    })}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.gray} />
                  </Pressable>
                </View>

                {/* Subject Input */}
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: BORDERS.radius.lg,
                  padding: SPACING.md,
                  ...SHADOWS.card,
                }}>
                  <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray, textTransform: 'uppercase', marginBottom: SPACING.sm }}>
                    Asunto
                  </Text>
                  <TextInput
                    style={{
                      ...TYPOGRAPHY.body,
                      color: COLORS.black,
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.border,
                      paddingVertical: SPACING.sm,
                      ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
                    }}
                    placeholder="¿De qué se trata tu consulta?"
                    placeholderTextColor={COLORS.gray}
                    value={newSubject}
                    onChangeText={setNewSubject}
                    maxLength={100}
                  />
                  <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray, textAlign: 'right', marginTop: SPACING.xs }}>
                    {newSubject.length}/100
                  </Text>
                </View>

                {/* Message Input */}
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: BORDERS.radius.lg,
                  padding: SPACING.md,
                  ...SHADOWS.card,
                }}>
                  <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray, textTransform: 'uppercase', marginBottom: SPACING.sm }}>
                    Mensaje
                  </Text>
                  <TextInput
                    style={{
                      ...TYPOGRAPHY.body,
                      color: COLORS.black,
                      minHeight: 120,
                      paddingTop: SPACING.sm,
                      ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
                    }}
                    placeholder="Escribe tu mensaje aquí..."
                    placeholderTextColor={COLORS.gray}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={2000}
                  />
                  <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray, textAlign: 'right', marginTop: SPACING.xs }}>
                    {newMessage.length}/2000
                  </Text>
                </View>

                {/* Send Button */}
                <Pressable
                  onPress={handleCreateConversation}
                  disabled={!newSubject.trim() || !newMessage.trim() || createConversation.isPending}
                  style={(state) => ({
                    backgroundColor: newSubject.trim() && newMessage.trim() ? COLORS.primary : COLORS.border,
                    padding: SPACING.md,
                    borderRadius: BORDERS.radius.lg,
                    alignItems: 'center',
                    ...(Platform.OS === 'web' && {
                      cursor: newSubject.trim() && newMessage.trim() ? 'pointer' : 'not-allowed',
                      opacity: newSubject.trim() && newMessage.trim() && (state as WebPressableState).hovered ? 0.85 : 1,
                    } as any),
                  })}
                >
                  {createConversation.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={{ ...TYPOGRAPHY.body, fontWeight: '600', color: COLORS.white }}>
                      Enviar mensaje
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      );
    }

    // No conversation selected
    if (!selectedConversationId) {
      return (
        <View style={{
          flex: 1,
          backgroundColor: COLORS.lightGray,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.border} />
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray, marginTop: SPACING.md }}>
            Selecciona una conversación
          </Text>
        </View>
      );
    }

    // Chat view
    return (
      <View style={{
        flex: 1,
        backgroundColor: COLORS.lightGray,
        ...(Platform.OS === 'web' && {
          display: 'flex',
          flexDirection: 'column',
        } as any),
      }}>
        {/* Chat Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}>
          <Pressable
            onPress={handleCloseDetail}
            style={(state) => ({
              padding: SPACING.sm,
              marginRight: SPACING.sm,
              borderRadius: BORDERS.radius.md,
              ...(Platform.OS === 'web' && {
                cursor: 'pointer',
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
              } as any),
            })}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ ...TYPOGRAPHY.sectionTitle, color: COLORS.black }} numberOfLines={1}>
              {selectedConversation?.subject ?? 'Conversación'}
            </Text>
            <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray }}>
              {participantName}
              {otherParticipants.length > 1 && ` +${otherParticipants.length - 1}`}
            </Text>
          </View>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: BORDERS.radius.full,
            backgroundColor: COLORS.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ ...TYPOGRAPHY.body, fontWeight: '600', color: COLORS.primary }}>
              {participantInitials}
            </Text>
          </View>
        </View>

        {/* Messages */}
        {loadingMessages ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.md }}
          >
            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
                <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray }}>Sin mensajes</Text>
                <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.gray, marginTop: SPACING.xs }}>
                  Sé el primero en escribir
                </Text>
              </View>
            ) : (
              messages.map((message, index) => {
                const senderId = typeof message.sender_id === 'string' ? message.sender_id : message.sender_id?.id;
                const isMyMessage = senderId === directusUserId;
                const showDate = shouldShowDateSeparator(index, messages);
                const isFirstMessage = index === 0;

                return (
                  <View key={message.id}>
                    {showDate && <DateSeparator date={formatDate(message.date_created)} />}
                    {isFirstMessage ? (
                      <FirstMessageCard message={message} />
                    ) : (
                      <ChatBubble message={message} isMyMessage={isMyMessage} />
                    )}
                  </View>
                );
              })
            )}
            <View ref={messagesEndRef} />
          </ScrollView>
        )}

        {/* Message Input */}
        {canReply && !isClosed ? (
          <WebMessageInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSendMessage}
            isSending={sendMessage.isPending}
          />
        ) : (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.md,
            backgroundColor: COLORS.lightGray,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            gap: SPACING.sm,
          }}>
            <Ionicons name="lock-closed" size={18} color={COLORS.gray} />
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray }}>
              {isClosed ? 'Esta conversación está cerrada' : 'Esta conversación es de solo lectura'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <WebLayout>
      <View style={{
        flex: 1,
        ...(Platform.OS === 'web' && {
          height: 'calc(100vh - 60px)', // Subtract header height
        } as any),
      }}>
        <MasterDetailLayout
          master={renderMaster()}
          detail={renderDetail()}
          masterWidth={380}
        />
      </View>
    </WebLayout>
  );
}
