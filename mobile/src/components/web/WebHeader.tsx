/**
 * WebHeader - Sticky header with breadcrumbs for web
 *
 * Features:
 * - Breadcrumb navigation
 * - Current page title
 * - Quick actions area (notifications, search)
 *
 * Designed to be sticky at the top of the content area.
 */
import React from 'react';
import { View, Text, Pressable, PressableStateCallbackType } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Web-specific pressable state type (hovered is only available on web)
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

interface Breadcrumb {
  label: string;
  href?: string;
}

interface WebHeaderProps {
  /** Current page title */
  title?: string;
  /** Breadcrumb items */
  breadcrumbs?: Breadcrumb[];
}

export function WebHeader({ title, breadcrumbs }: WebHeaderProps) {
  const router = useRouter();

  const handleBreadcrumbPress = (href?: string) => {
    if (href) {
      router.push(href as never);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderBottomWidth: 1,
        minHeight: 64,
      }}
      className="bg-white border-content-border"
    >
      {/* Left side: Breadcrumbs + Title */}
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color="#9CA3AF"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
                <Pressable
                  onPress={() => handleBreadcrumbPress(crumb.href)}
                  disabled={!crumb.href}
                  style={(state) => ({
                    opacity: (state as WebPressableState).hovered && crumb.href ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: crumb.href ? '#6B7280' : '#9CA3AF',
                    }}
                  >
                    {crumb.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Page Title */}
        {title && (
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#1F2937',
            }}
          >
            {title}
          </Text>
        )}
      </View>

      {/* Right side: Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Search button */}
        <Pressable
          style={(state) => ({
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (state as WebPressableState).hovered ? '#F3F4F6' : 'transparent',
          })}
        >
          <Ionicons name="search" size={20} color="#6B7280" />
        </Pressable>

        {/* Notifications button */}
        <Pressable
          style={(state) => ({
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (state as WebPressableState).hovered ? '#F3F4F6' : 'transparent',
          })}
        >
          <View>
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            {/* Notification badge - uncomment when needed */}
            {/* <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#EF4444',
              }}
            /> */}
          </View>
        </Pressable>

        {/* Help button */}
        <Pressable
          style={(state) => ({
            width: 40,
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (state as WebPressableState).hovered ? '#F3F4F6' : 'transparent',
          })}
        >
          <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  );
}

export default WebHeader;
