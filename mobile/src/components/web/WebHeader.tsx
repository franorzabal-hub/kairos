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
import { COLORS } from '../../theme';

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
        paddingHorizontal: 24, // Matches new sidebar padding
        paddingVertical: 12, // Compact vertical padding
        borderBottomWidth: 1,
        minHeight: 56, // Fixed height for consistency
        position: 'sticky', // Ensure stickiness for web
        top: 0,
        zIndex: 50,
      } as any}
      className="bg-white/80 backdrop-blur-md border-gray-200"
    >
      {/* Left side: Breadcrumbs + Title Context */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             {/* Base Crumb (e.g. Home icon or first item) */}
            <Pressable
              onPress={() => router.push('/')}
              style={(state) => ({
                opacity: (state as WebPressableState).hovered ? 0.7 : 1,
                marginRight: 8,
              })}
            >
               <Ionicons name="home-outline" size={14} color={COLORS.gray500} />
            </Pressable>

            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={COLORS.gray300}
                  style={{ marginHorizontal: 6 }}
                />
                <Pressable
                  onPress={() => handleBreadcrumbPress(crumb.href)}
                  disabled={!crumb.href}
                  style={(state) => ({
                    opacity: (state as WebPressableState).hovered && crumb.href ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: index === breadcrumbs.length - 1 ? '600' : '400',
                      color: index === breadcrumbs.length - 1 ? COLORS.gray800 : COLORS.gray500,
                    }}
                  >
                    {crumb.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        ) : (
          /* Fallback if no breadcrumbs, show title */
          title && (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.gray800,
              }}
            >
              {title}
            </Text>
          )
        )}
      </View>

      {/* Right side: Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {/* Search Input (Mock) */}
        <View 
          className="hidden md:flex flex-row items-center bg-gray-100 rounded-md px-3 py-1.5 mr-2"
          style={{ width: 200 }}
        >
          <Ionicons name="search" size={14} color={COLORS.gray400} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 13, color: COLORS.gray400 }}>Buscar...</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 10, color: COLORS.gray400, borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 4, paddingHorizontal: 4 }}>⌘K</Text>
        </View>

        {/* Notifications button */}
        <Pressable
          style={(state) => ({
            width: 32,
            height: 32,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (state as WebPressableState).hovered ? COLORS.gray100 : 'transparent',
          })}
        >
          <View>
            <Ionicons name="notifications-outline" size={18} color={COLORS.gray600} />
          </View>
        </Pressable>

        {/* Help button */}
        <Pressable
          style={(state) => ({
            width: 32,
            height: 32,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (state as WebPressableState).hovered ? COLORS.gray100 : 'transparent',
          })}
        >
          <Ionicons name="help-circle-outline" size={18} color={COLORS.gray600} />
        </Pressable>
      </View>
    </View>
  );
}

export default WebHeader;
