/**
 * WebSidebar - Slack-style navigation sidebar for web
 *
 * Features:
 * - School logo and name at top
 * - Main navigation menu (Home, Eventos, Mensajes)
 * - Collapsible "Mis Hijos" section with sub-navigation
 * - User profile and settings at bottom
 *
 * Uses dark theme colors from tailwind.config.js (sidebar.*)
 */
import React, { useState } from 'react';
import { View, Text, Pressable, PressableStateCallbackType } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DirectusImage from '../DirectusImage';
import { useSession } from '../../hooks';
import { useOrganization } from '../../api/hooks';
import { CHILD_COLORS } from '../../theme';

// Web-specific pressable state type (hovered is only available on web)
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { label: 'Inicio', icon: 'home', href: '/(tabs)/inicio' },
  { label: 'Agenda', icon: 'calendar', href: '/(tabs)/agenda' },
  { label: 'Mensajes', icon: 'chatbubbles', href: '/(tabs)/mensajes' },
];

const childNavItems = [
  { label: 'Boletín', icon: 'document-text' as const, suffix: '/boletin' },
  { label: 'Asistencia', icon: 'checkmark-circle' as const, suffix: '/asistencia' },
  { label: 'Salud', icon: 'medical' as const, suffix: '/salud' },
];

export function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, children } = useSession();
  const { data: organization } = useOrganization();
  const [isChildrenExpanded, setIsChildrenExpanded] = useState(true);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);

  const isActive = (href: string) => {
    return pathname.startsWith(href.replace('(tabs)', ''));
  };

  const handleNavigation = (href: string) => {
    router.push(href as never);
  };

  const toggleChildExpanded = (childId: string) => {
    setExpandedChildId(expandedChildId === childId ? null : childId);
  };

  const getChildInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getChildColor = (index: number) => {
    return CHILD_COLORS[index % CHILD_COLORS.length];
  };

  return (
    <View
      style={{
        width: 260,
        height: '100%',
        flexDirection: 'column',
      }}
      className="bg-sidebar-bg"
    >
      {/* School Logo & Name */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
        }}
        className="border-sidebar-border"
      >
        <DirectusImage
          fileId={organization?.logo}
          style={{ width: 32, height: 32, borderRadius: 6, marginRight: 12 }}
          contentFit="cover"
          fallback={
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="bg-sidebar-accent"
            >
              <Ionicons name="school" size={18} color="#fff" />
            </View>
          }
        />
        <Text
          style={{ flex: 1, fontSize: 15, fontWeight: '600' }}
          className="text-sidebar-text"
          numberOfLines={1}
        >
          {organization?.name || 'Kairos'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6C7086" />
      </Pressable>

      {/* Main Navigation */}
      <View style={{ padding: 8 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            paddingHorizontal: 8,
            paddingVertical: 8,
          }}
          className="text-sidebar-textMuted"
        >
          Menu Principal
        </Text>

        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => handleNavigation(item.href)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                marginBottom: 2,
                backgroundColor: active
                  ? 'rgba(139, 21, 56, 0.2)'
                  : (state as WebPressableState).hovered
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'transparent',
              })}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? '#8B1538' : '#CDD6F4'}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: active ? '600' : '400',
                }}
                className={active ? 'text-sidebar-textActive' : 'text-sidebar-text'}
              >
                {item.label}
              </Text>
              {item.badge && item.badge > 0 && (
                <View
                  style={{
                    backgroundColor: '#FF3B30',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* My Children Section */}
      {children && children.length > 0 && (
        <View style={{ padding: 8, flex: 1 }}>
          <Pressable
            onPress={() => setIsChildrenExpanded(!isChildrenExpanded)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name={isChildrenExpanded ? 'chevron-down' : 'chevron-forward'}
              size={12}
              color="#6C7086"
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              className="text-sidebar-textMuted"
            >
              Mis Hijos
            </Text>
          </Pressable>

          {isChildrenExpanded &&
            children.map((child, index) => {
              const isExpanded = expandedChildId === child.id;
              return (
                <View key={child.id}>
                  <Pressable
                    onPress={() => toggleChildExpanded(child.id)}
                    style={(state) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      marginBottom: 2,
                      backgroundColor: (state as WebPressableState).hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        backgroundColor: getChildColor(index),
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                        {getChildInitial(child.first_name || 'H')}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14 }} className="text-sidebar-text">
                      {child.first_name} {child.last_name?.charAt(0)}.
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={14}
                      color="#6C7086"
                    />
                  </Pressable>

                  {/* Child sub-navigation */}
                  {isExpanded && (
                    <View style={{ marginLeft: 24 }}>
                      {childNavItems.map((navItem) => (
                        <Pressable
                          key={navItem.suffix}
                          onPress={() =>
                            handleNavigation(`/(tabs)/mishijos/${child.id}${navItem.suffix}`)
                          }
                          style={(state) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            marginBottom: 2,
                            backgroundColor: (state as WebPressableState).hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                          })}
                        >
                          <Ionicons
                            name={navItem.icon}
                            size={14}
                            color="#6C7086"
                            style={{ marginRight: 10 }}
                          />
                          <Text style={{ fontSize: 13 }} className="text-sidebar-textMuted">
                            {navItem.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* User Profile / Settings */}
      <View style={{ padding: 8, borderTopWidth: 1 }} className="border-sidebar-border">
        <Pressable
          onPress={() => handleNavigation('/settings')}
          style={(state) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 6,
            backgroundColor: (state as WebPressableState).hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          })}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            className="bg-sidebar-bgActive"
          >
            <Ionicons name="person" size={18} color="#CDD6F4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '500' }} className="text-sidebar-text">
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={{ fontSize: 12 }} className="text-sidebar-textMuted">
              {user?.email}
            </Text>
          </View>
          <Ionicons name="settings-outline" size={18} color="#6C7086" />
        </Pressable>
      </View>
    </View>
  );
}

export default WebSidebar;
