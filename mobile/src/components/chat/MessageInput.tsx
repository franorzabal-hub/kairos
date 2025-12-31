/**
 * MessageInput - Unified chat message input with attachments and send button
 *
 * Cross-platform component that handles both mobile and web:
 * - Mobile: Uses Alert.alert for attachment picker
 * - Web: Uses dropdown menu with hover effects and keyboard shortcuts
 *
 * Features:
 * - Attachment picker (camera, gallery, file)
 * - Urgent toggle (for teachers)
 * - Send button with loading state
 * - Web: Enter to send, Shift+Enter for newline
 * - Web: Click outside to close dropdown
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  PressableStateCallbackType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';
import { logger } from '../../utils';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const CHAT_COLORS = {
  urgent: COLORS.errorDark,
  urgentLight: COLORS.errorLight,
};

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending?: boolean;
  isTeacher?: boolean;
  isUrgent?: boolean;
  onToggleUrgent?: () => void;
  // Optional attachment handlers (web can pass custom handlers)
  onAttachCamera?: () => void;
  onAttachGallery?: () => void;
  onAttachFile?: () => void;
}

function MessageInput({
  value,
  onChangeText,
  onSend,
  isSending = false,
  isTeacher = false,
  isUrgent = false,
  onToggleUrgent,
  onAttachCamera,
  onAttachGallery,
  onAttachFile,
}: MessageInputProps) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const menuRef = useRef<View>(null);
  const isWeb = Platform.OS === 'web';

  const canSend = value.trim().length > 0 && !isSending;

  // Mobile: Use Alert.alert for attachment options
  const handleAttachPressMobile = () => {
    Alert.alert('Adjuntar', 'Selecciona el tipo de archivo', [
      {
        text: 'Camara',
        onPress: () => {
          if (onAttachCamera) {
            onAttachCamera();
          } else {
            logger.debug('Camera attachment selected');
          }
        },
      },
      {
        text: 'Galeria',
        onPress: () => {
          if (onAttachGallery) {
            onAttachGallery();
          } else {
            logger.debug('Gallery attachment selected');
          }
        },
      },
      {
        text: 'Archivo',
        onPress: () => {
          if (onAttachFile) {
            onAttachFile();
          } else {
            logger.debug('File attachment selected');
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // Web: Toggle dropdown menu
  const handleAttachPressWeb = (e: any) => {
    e?.stopPropagation?.();
    setShowAttachMenu(!showAttachMenu);
  };

  // Web: Close dropdown when clicking outside
  useEffect(() => {
    if (!isWeb || !showAttachMenu) return;

    const handleClickOutside = () => {
      setShowAttachMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isWeb, showAttachMenu]);

  // Web: Handle keyboard shortcuts
  const handleKeyDown = (e: any) => {
    if (!isWeb) return;

    // Enter without Shift sends the message
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  // Handle dropdown option selection
  const handleAttachOption = (handler?: () => void, defaultAction?: string) => {
    setShowAttachMenu(false);
    if (handler) {
      handler();
    } else {
      logger.debug(`${defaultAction} attachment selected`);
    }
  };

  // Platform-specific container styles
  const containerStyle = Platform.select({
    web: {
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
    },
    default: {
      paddingHorizontal: SPACING.sm,
      gap: SPACING.xs,
    },
  });

  // Platform-specific input styles
  const inputStyle = Platform.select({
    web: {
      borderRadius: BORDERS.radius.lg,
      maxHeight: 120,
      minHeight: 40,
    },
    default: {
      borderRadius: BORDERS.radius.full,
      maxHeight: 100,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Attachment button - different behavior for mobile vs web */}
      <View style={isWeb ? styles.attachButtonWrapper : undefined}>
        {isWeb ? (
          <Pressable
            onPress={handleAttachPressWeb}
            style={(state) => ({
              width: 40,
              height: 40,
              borderRadius: BORDERS.radius.full,
              backgroundColor: showAttachMenu ? COLORS.primaryLight : COLORS.lightGray,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              cursor: 'pointer',
              opacity: (state as WebPressableState).hovered ? 0.8 : 1,
              transition: 'all 0.15s ease',
            } as any)}
          >
            <Ionicons
              name={showAttachMenu ? 'close' : 'add'}
              size={24}
              color={showAttachMenu ? COLORS.primary : COLORS.darkGray}
            />
          </Pressable>
        ) : (
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachPressMobile}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Web: Attachment dropdown menu */}
        {isWeb && showAttachMenu && (
          <View
            ref={menuRef}
            style={[styles.attachMenu, { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } as any]}
          >
            <Pressable
              onPress={() => handleAttachOption(onAttachCamera, 'Camera')}
              style={(state) => ({
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: BORDERS.radius.sm,
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                gap: SPACING.sm,
              })}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.darkGray} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.darkGray }]}>Camara</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAttachOption(onAttachGallery, 'Gallery')}
              style={(state) => ({
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: BORDERS.radius.sm,
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                gap: SPACING.sm,
              })}
            >
              <Ionicons name="images-outline" size={20} color={COLORS.darkGray} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.darkGray }]}>Galeria</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAttachOption(onAttachFile, 'File')}
              style={(state) => ({
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: BORDERS.radius.sm,
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                gap: SPACING.sm,
              })}
            >
              <Ionicons name="document-outline" size={20} color={COLORS.darkGray} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.darkGray }]}>Archivo</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Text input */}
      <TextInput
        style={[
          styles.input,
          inputStyle,
          isWeb && ({ outlineStyle: 'none', resize: 'none' } as any),
        ]}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={2000}
        onKeyPress={isWeb ? handleKeyDown : undefined}
      />

      {/* Urgent toggle (only for teachers) */}
      {isTeacher && onToggleUrgent && (
        isWeb ? (
          <Pressable
            onPress={onToggleUrgent}
            style={(state) => ({
              width: 36,
              height: 36,
              borderRadius: BORDERS.radius.full,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              backgroundColor: isUrgent ? CHAT_COLORS.urgentLight : 'transparent',
              cursor: 'pointer',
              opacity: (state as WebPressableState).hovered ? 0.8 : 1,
            } as any)}
          >
            <Ionicons
              name="alert-circle"
              size={20}
              color={isUrgent ? CHAT_COLORS.urgent : COLORS.gray}
            />
          </Pressable>
        ) : (
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
        )
      )}

      {/* Send button */}
      {isWeb ? (
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={(state) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: canSend ? COLORS.primary : COLORS.gray,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: canSend && (state as WebPressableState).hovered ? 0.85 : 1,
            transition: 'all 0.15s ease',
          } as any)}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.white} />
          )}
        </Pressable>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachButtonWrapper: {
    position: 'relative',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMenu: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.xs,
    minWidth: 160,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
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
