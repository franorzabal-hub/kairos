/**
 * WebMessageInput - Chat message input for web with dropdown menu instead of Alert
 *
 * Features:
 * - Dropdown menu for attachments (replaces Alert.alert)
 * - Hover effects on buttons
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Auto-resize textarea
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Platform, ActivityIndicator, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const CHAT_COLORS = {
  urgent: '#D32F2F',
  urgentLight: '#FFEBEE',
};

interface WebMessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending?: boolean;
  isTeacher?: boolean;
  isUrgent?: boolean;
  onToggleUrgent?: () => void;
  onAttachCamera?: () => void;
  onAttachGallery?: () => void;
  onAttachFile?: () => void;
}

export function WebMessageInput({
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
}: WebMessageInputProps) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const menuRef = useRef<View>(null);

  const canSend = value.trim().length > 0 && !isSending;

  // Handle keyboard shortcuts
  const handleKeyDown = (e: any) => {
    if (Platform.OS !== 'web') return;

    // Enter without Shift sends the message
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (Platform.OS !== 'web' || !showAttachMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      setShowAttachMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAttachMenu]);

  const handleAttachClick = (e: any) => {
    e.stopPropagation();
    setShowAttachMenu(!showAttachMenu);
  };

  const handleAttachOption = (handler?: () => void) => {
    setShowAttachMenu(false);
    handler?.();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: SPACING.sm,
      }}
    >
      {/* Attachment button with dropdown */}
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={handleAttachClick}
          style={(state) => ({
            width: 40,
            height: 40,
            borderRadius: BORDERS.radius.full,
            backgroundColor: showAttachMenu ? COLORS.primaryLight : COLORS.lightGray,
            alignItems: 'center',
            justifyContent: 'center',
            ...(Platform.OS === 'web' && {
              cursor: 'pointer',
              opacity: (state as WebPressableState).hovered ? 0.8 : 1,
              transition: 'all 0.15s ease',
            } as any),
          })}
        >
          <Ionicons
            name={showAttachMenu ? 'close' : 'add'}
            size={24}
            color={showAttachMenu ? COLORS.primary : COLORS.darkGray}
          />
        </Pressable>

        {/* Attachment dropdown menu */}
        {showAttachMenu && Platform.OS === 'web' && (
          <View
            ref={menuRef}
            style={{
              position: 'absolute',
              bottom: 48,
              left: 0,
              backgroundColor: COLORS.white,
              borderRadius: BORDERS.radius.md,
              padding: SPACING.xs,
              minWidth: 160,
              ...(Platform.OS === 'web' && {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              } as any),
            }}
          >
            <Pressable
              onPress={() => handleAttachOption(onAttachCamera)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: BORDERS.radius.sm,
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                gap: SPACING.sm,
              })}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.darkGray} />
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.darkGray }}>Cámara</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAttachOption(onAttachGallery)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: BORDERS.radius.sm,
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                gap: SPACING.sm,
              })}
            >
              <Ionicons name="images-outline" size={20} color={COLORS.darkGray} />
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.darkGray }}>Galería</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAttachOption(onAttachFile)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: BORDERS.radius.sm,
                backgroundColor: (state as WebPressableState).hovered ? COLORS.lightGray : 'transparent',
                gap: SPACING.sm,
              })}
            >
              <Ionicons name="document-outline" size={20} color={COLORS.darkGray} />
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.darkGray }}>Archivo</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Text input */}
      <TextInput
        style={{
          flex: 1,
          backgroundColor: COLORS.lightGray,
          borderRadius: BORDERS.radius.lg,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          ...TYPOGRAPHY.body,
          maxHeight: 120,
          minHeight: 40,
          ...(Platform.OS === 'web' && {
            outlineStyle: 'none',
            resize: 'none',
          } as any),
        }}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={2000}
        onKeyPress={handleKeyDown}
      />

      {/* Urgent toggle (only for teachers) */}
      {isTeacher && onToggleUrgent && (
        <Pressable
          onPress={onToggleUrgent}
          style={(state) => ({
            width: 36,
            height: 36,
            borderRadius: BORDERS.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isUrgent ? CHAT_COLORS.urgentLight : 'transparent',
            ...(Platform.OS === 'web' && {
              cursor: 'pointer',
              opacity: (state as WebPressableState).hovered ? 0.8 : 1,
            } as any),
          })}
        >
          <Ionicons
            name="alert-circle"
            size={20}
            color={isUrgent ? CHAT_COLORS.urgent : COLORS.gray}
          />
        </Pressable>
      )}

      {/* Send button */}
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={(state) => ({
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: canSend ? COLORS.primary : COLORS.gray,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'web' && {
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: canSend && (state as WebPressableState).hovered ? 0.85 : 1,
            transition: 'all 0.15s ease',
          } as any),
        })}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="send" size={20} color={COLORS.white} />
        )}
      </Pressable>
    </View>
  );
}

export default React.memo(WebMessageInput);
