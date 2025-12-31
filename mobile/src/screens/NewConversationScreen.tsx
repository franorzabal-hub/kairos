import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCreateConversation } from '../api/hooks';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, SIZES, FONT_SIZES } from '../theme';

// Channel definitions - same as ConversationListScreen
// TODO: Move to shared constants file
interface ContactChannel {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CONTACT_CHANNELS: Record<string, ContactChannel> = {
  secretaria: {
    id: 'secretaria',
    name: 'Secretaría',
    description: 'Pagos, documentación, trámites',
    icon: 'document-text-outline',
    color: '#6366F1',
  },
  enfermeria: {
    id: 'enfermeria',
    name: 'Enfermería',
    description: 'Salud, medicamentos, accidentes',
    icon: 'medkit-outline',
    color: '#EF4444',
  },
  transporte: {
    id: 'transporte',
    name: 'Transporte',
    description: 'Rutas, horarios, cambios',
    icon: 'bus-outline',
    color: '#F59E0B',
  },
  comedor: {
    id: 'comedor',
    name: 'Comedor',
    description: 'Menú, alergias, dietas',
    icon: 'restaurant-outline',
    color: '#10B981',
  },
};

export default function NewConversationScreen() {
  const router = useRouter();
  const { channelId, channelName } = useLocalSearchParams<{
    channelId: string;
    channelName: string;
  }>();

  const createConversation = useCreateConversation();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Get channel info
  const channel = CONTACT_CHANNELS[channelId ?? ''] ?? {
    id: channelId ?? 'unknown',
    name: channelName ?? 'Contacto',
    description: '',
    icon: 'chatbubble-outline' as const,
    color: COLORS.primary,
  };

  const canSend = subject.trim().length > 0 && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;

    try {
      const result = await createConversation.mutateAsync({
        subject: subject.trim(),
        channelId: channel.id,
        initialMessage: message.trim(),
        isUrgent: false,
      });

      // Navigate to the new conversation
      router.replace({
        pathname: '/mensajes/[id]',
        params: { id: result.conversationId },
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert(
        'Error',
        'No se pudo crear la conversación. Por favor intenta de nuevo.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo mensaje</Text>
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend || createConversation.isPending}
          >
            {createConversation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={[styles.sendButtonText, !canSend && styles.sendButtonTextDisabled]}>
                Enviar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Channel Info Card */}
          <View style={styles.channelCard}>
            <View style={[styles.channelIcon, { backgroundColor: `${channel.color}15` }]}>
              <Ionicons name={channel.icon} size={28} color={channel.color} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelLabel}>Para:</Text>
              <Text style={styles.channelName}>{channel.name}</Text>
              {channel.description && (
                <Text style={styles.channelDescription}>{channel.description}</Text>
              )}
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Asunto</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder="¿De qué se trata tu consulta?"
              placeholderTextColor={COLORS.gray}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
              autoFocus
            />
            <Text style={styles.charCount}>{subject.length}/100</Text>
          </View>

          {/* Message Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mensaje</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor={COLORS.gray}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{message.length}/2000</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
              <Text style={styles.tipsTitle}>Consejos</Text>
            </View>
            <Text style={styles.tipsText}>
              • Sé claro y específico en tu consulta{'\n'}
              • Incluye información relevante (nombre del alumno, fecha, etc.){'\n'}
              • Recibirás una respuesta en horario de atención
            </Text>
          </View>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.black,
    textAlign: 'center',
    marginRight: SIZES.avatarMd, // Balance with back button
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    minWidth: SPACING.xxxl + SPACING.xxxl + SPACING.lg,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  sendButtonTextDisabled: {
    color: COLORS.gray,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.screenPadding,
    gap: SPACING.lg,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  channelIcon: {
    width: SIZES.fabSize,
    height: SIZES.fabSize,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xxs,
  },
  channelName: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.black,
  },
  channelDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xxs,
  },
  inputGroup: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subjectInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  messageInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    minHeight: SPACING.tabBarOffset + SPACING.xl,
    paddingTop: SPACING.sm,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  tipsCard: {
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tipsTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tipsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    lineHeight: FONT_SIZES['5xl'] + SPACING.xxs,
  },
});
