/**
 * MessageInput - Chat message input with attachments and send button
 *
 * Includes attachment picker, urgent toggle (for teachers), and send button.
 */
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';

const CHAT_COLORS = {
  urgent: '#D32F2F',
  urgentLight: '#FFEBEE',
};

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending?: boolean;
  isTeacher?: boolean;
  isUrgent?: boolean;
  onToggleUrgent?: () => void;
}

function MessageInput({
  value,
  onChangeText,
  onSend,
  isSending = false,
  isTeacher = false,
  isUrgent = false,
  onToggleUrgent,
}: MessageInputProps) {
  const handleAttachPress = () => {
    Alert.alert('Adjuntar', 'Selecciona el tipo de archivo', [
      { text: 'Cámara', onPress: () => console.log('Camera') },
      { text: 'Galería', onPress: () => console.log('Gallery') },
      { text: 'Archivo', onPress: () => console.log('File') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const canSend = value.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      {/* Attachment button */}
      <TouchableOpacity style={styles.attachButton} onPress={handleAttachPress}>
        <Ionicons name="add" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={2000}
      />

      {/* Urgent toggle (only for teachers) */}
      {isTeacher && onToggleUrgent && (
        <TouchableOpacity
          style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
          onPress={onToggleUrgent}
        >
          <Ionicons
            name="alert-circle"
            size={20}
            color={isUrgent ? CHAT_COLORS.urgent : COLORS.gray}
          />
        </TouchableOpacity>
      )}

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="send" size={20} color={COLORS.white} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
    maxHeight: 100,
  },
  urgentToggle: {
    width: 36,
    height: 36,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentToggleActive: {
    backgroundColor: CHAT_COLORS.urgentLight,
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
});

export default React.memo(MessageInput);
