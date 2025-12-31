/**
 * WebFooter - VS Code style status bar for web
 *
 * Features:
 * - Connection status indicator
 * - Current user info
 * - Version info
 * - Quick links
 *
 * Thin footer at the bottom of the content area.
 */
import React from 'react';
import { View, Text, Pressable, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../hooks';
import { useOrganization } from '../../api/hooks';
import { COLORS } from '../../theme';

// Web-specific pressable state type (hovered is only available on web)
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export function WebFooter() {
  const { user } = useSession();
  const { data: organization } = useOrganization();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 28,
        borderTopWidth: 1,
      }}
      className="bg-sidebar-bg border-sidebar-border"
    >
      {/* Left side */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Connection status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.successBright,
            }}
          />
          <Text style={{ fontSize: 12, color: COLORS.gray400 }}>Conectado</Text>
        </View>

        {/* Organization */}
        {organization?.name && (
          <Text style={{ fontSize: 12, color: COLORS.gray500 }}>
            {organization.name}
          </Text>
        )}
      </View>

      {/* Right side */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* User info */}
        {user && (
          <Text style={{ fontSize: 12, color: COLORS.gray500 }}>
            {user.first_name} {user.last_name}
          </Text>
        )}

        {/* Help link */}
        <Pressable
          style={(state) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: (state as WebPressableState).hovered ? 0.8 : 1,
          })}
        >
          <Ionicons name="help-circle-outline" size={14} color={COLORS.gray500} />
          <Text style={{ fontSize: 12, color: COLORS.gray500 }}>Ayuda</Text>
        </Pressable>

        {/* Version */}
        <Text style={{ fontSize: 12, color: COLORS.gray600 }}>v1.0.0</Text>
      </View>
    </View>
  );
}

export default WebFooter;
