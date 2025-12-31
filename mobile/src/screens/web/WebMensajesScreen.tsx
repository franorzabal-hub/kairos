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
import { WebLayout, MasterDetailLayout, WebConversationCard, ResponsiveCardList } from '../../components/web';
import SegmentedControl from '../../components/SegmentedControl';
import { ChatBubble, FirstMessageCard, DateSeparator, MessageInput } from '../../components/chat';
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
  const { user, children } = useSession();
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
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
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
    <View className="flex-1 bg-white border-r border-gray-200 h-full overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">
          Bandeja de entrada
        </Text>
        {/* New Conversation Button */}
        <Pressable
          onPress={() => setViewMode(viewMode === 'new' ? 'list' : 'new')}
          style={(state) => ({
            opacity: (state as WebPressableState).hovered ? 0.9 : 1,
            transform: [{ scale: (state as WebPressableState).pressed ? 0.98 : 1 }],
          })}
          className="flex-row items-center bg-primary px-3 py-1.5 rounded-md shadow-sm transition-all"
        >
          <Ionicons name="add" size={16} color={COLORS.white} style={{ marginRight: 4 }} />
          <Text className="text-white text-xs font-bold uppercase tracking-wide">
            Nuevo
          </Text>
        </Pressable>
      </View>

      {/* Filter */}
      <View className="p-2 border-b border-gray-100 bg-gray-50/50">
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="chatbubbles-outline" size={40} color={COLORS.gray300} />
          <Text className="text-gray-400 mt-2 text-center text-sm">
            {messageFilter === 'unread' ? 'No tienes mensajes sin leer' : 'Bandeja vacía'}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 bg-white">
          <ResponsiveCardList gap={0}>
            {filteredConversations.map((conversation) => (
              <WebConversationCard
                key={conversation.id}
                conversation={conversation}
                children={children}
                currentUserId={user?.id}
                isSelected={conversation.id === selectedConversationId}
                onPress={handleSelectConversation}
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
        <View className="flex-1 bg-gray-50/50 flex-col h-full">
          {/* Header */}
          <View className="flex-row items-center px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <Pressable
              onPress={handleCloseDetail}
              className="p-2 mr-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </Pressable>
            <Text className="text-xl font-bold text-gray-900 flex-1">
              Nueva conversación
            </Text>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 24 }}>
            {/* Channel Selection & Form ... (same as before) */}
            {!newConversationChannel ? (
              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Selecciona un departamento
                </Text>
                <View className="gap-3">
                  {CONTACT_CHANNELS.map((channel) => (
                    <Pressable
                      key={channel.id}
                      onPress={() => setNewConversationChannel(channel)}
                      className="flex-row items-center p-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <View 
                        className="w-12 h-12 rounded-lg items-center justify-center mr-4"
                        style={{ backgroundColor: `${channel.color}15` }}
                      >
                        <Ionicons name={channel.icon} size={24} color={channel.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">{channel.name}</Text>
                        <Text className="text-sm text-gray-500">{channel.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <>
                {/* Selected Channel */}
                <View className="flex-row items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <View 
                    className="w-12 h-12 rounded-lg items-center justify-center mr-4"
                    style={{ backgroundColor: `${newConversationChannel.color}15` }}
                  >
                    <Ionicons name={newConversationChannel.icon} size={24} color={newConversationChannel.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">Para:</Text>
                    <Text className="text-base font-semibold text-gray-900">{newConversationChannel.name}</Text>
                  </View>
                  <Pressable
                    onPress={() => setNewConversationChannel(null)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.gray400} />
                  </Pressable>
                </View>

                {/* Subject Input */}
                <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Asunto
                  </Text>
                  <TextInput
                    className="text-base text-gray-900 border-b border-gray-200 py-2 focus:border-primary outline-none"
                    placeholder="¿De qué se trata tu consulta?"
                    placeholderTextColor={COLORS.gray400}
                    value={newSubject}
                    onChangeText={setNewSubject}
                    maxLength={100}
                  />
                  <Text className="text-xs text-gray-400 text-right mt-1">
                    {newSubject.length}/100
                  </Text>
                </View>

                {/* Message Input */}
                <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Mensaje
                  </Text>
                  <TextInput
                    className="text-base text-gray-900 min-h-[120px] pt-2 outline-none"
                    placeholder="Escribe tu mensaje aquí..."
                    placeholderTextColor={COLORS.gray400}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={2000}
                    style={{ textAlignVertical: 'top' }}
                  />
                  <Text className="text-xs text-gray-400 text-right mt-1">
                    {newMessage.length}/2000
                  </Text>
                </View>

                {/* Send Button */}
                <Pressable
                  onPress={handleCreateConversation}
                  disabled={!newSubject.trim() || !newMessage.trim() || createConversation.isPending}
                  className={`p-4 rounded-xl items-center justify-center transition-all ${
                    newSubject.trim() && newMessage.trim() 
                      ? 'bg-primary hover:opacity-90 cursor-pointer shadow-md' 
                      : 'bg-gray-200 cursor-not-allowed'
                  }`}
                >
                  {createConversation.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text className={`text-base font-bold ${
                      newSubject.trim() && newMessage.trim() ? 'text-white' : 'text-gray-400'
                    }`}>
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
        <View className="flex-1 bg-gray-50 items-center justify-center h-full">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.gray300} />
          </View>
          <Text className="text-lg font-medium text-gray-500">
            Selecciona una conversación para comenzar
          </Text>
        </View>
      );
    }

    // Chat view
    return (
      <View className="flex-1 bg-white flex-col h-full w-full overflow-hidden">
        {/* Chat Header (Fixed) */}
        <View className="flex-row items-center px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0 z-10">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
              {selectedConversation?.subject ?? 'Conversación'}
            </Text>
            <Text className="text-xs text-gray-500">
              {participantName}
              {otherParticipants.length > 1 && ` +${otherParticipants.length - 1}`}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-base font-bold text-primary">
              {participantInitials}
            </Text>
          </View>
        </View>

        {/* Messages List (Scrollable) */}
        <View className="flex-1 bg-gray-50">
          {loadingMessages ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
            >
              {messages.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-gray-400 text-sm">Sin mensajes</Text>
                  <Text className="text-gray-400 text-xs mt-1">
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
        </View>

        {/* Message Input (Fixed Bottom) */}
        <View className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          {canReply && !isClosed ? (
            <MessageInput
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSendMessage}
              isSending={sendMessage.isPending}
            />
          ) : (
            <View className="flex-row items-center justify-center py-4 bg-gray-50 rounded-lg gap-2">
              <Ionicons name="lock-closed" size={16} color={COLORS.gray500} />
              <Text className="text-gray-500 font-medium">
                {isClosed ? 'Esta conversación está cerrada' : 'Esta conversación es de solo lectura'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <WebLayout 
      title="Mensajes" 
      breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Mensajes', href: '/mensajes' }]}
      fullScreen={true}
    >
      {/* Main Workspace - Full Height, No Global Scroll */}
      <View className="flex-1 flex-row h-full w-full overflow-hidden">
        
        {/* LEFT COLUMN: Message List */}
        <View className="w-1/3 border-r border-gray-200 flex flex-col h-full bg-white flex-shrink-0">
          {/* Header (Sticky) */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-10 flex-shrink-0">
            <Text className="text-lg font-bold text-gray-800">
              Bandeja de entrada
            </Text>
            {/* New Conversation Button */}
            <Pressable
              onPress={() => setViewMode(viewMode === 'new' ? 'list' : 'new')}
              style={(state) => ({
                opacity: (state as WebPressableState).hovered ? 0.9 : 1,
                transform: [{ scale: (state as WebPressableState).pressed ? 0.98 : 1 }],
              })}
              className="flex-row items-center bg-primary px-3 py-1.5 rounded-md shadow-sm transition-all"
            >
              <Ionicons name="add" size={16} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text className="text-white text-xs font-bold uppercase tracking-wide">
                Nuevo
              </Text>
            </Pressable>
          </View>

          {/* Filter Bar */}
          <View className="p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <SegmentedControl
              segments={[
                { key: 'all', label: 'Todos' },
                { key: 'unread', label: 'No leídos', count: unreadCount },
              ]}
              selectedKey={messageFilter}
              onSelect={(key) => setMessageFilter(key as MessageFilter)}
            />
          </View>

          {/* Scrollable List */}
          <View className="flex-1 overflow-hidden bg-white">
            {loadingConversations ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : filteredConversations.length === 0 ? (
              <View className="flex-1 items-center justify-center p-8">
                <Ionicons name="chatbubbles-outline" size={40} color={COLORS.gray300} />
                <Text className="text-gray-400 mt-2 text-center text-sm">
                  {messageFilter === 'unread' ? 'No tienes mensajes sin leer' : 'Bandeja vacía'}
                </Text>
              </View>
            ) : (
              <ScrollView 
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
              >
                <ResponsiveCardList gap={0}>
                  {filteredConversations.map((conversation) => (
                    <WebConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      children={children}
                      currentUserId={user?.id}
                      isSelected={conversation.id === selectedConversationId}
                      onPress={handleSelectConversation}
                    />
                  ))}
                </ResponsiveCardList>
              </ScrollView>
            )}
          </View>
        </View>

        {/* RIGHT COLUMN: Detail / Chat */}
        <View className="flex-1 flex flex-col h-full bg-gray-50/50 overflow-hidden">
          {renderDetail()}
        </View>

      </View>
    </WebLayout>
  );
}
