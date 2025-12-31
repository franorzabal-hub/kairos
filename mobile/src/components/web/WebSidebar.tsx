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
import { CHILD_COLORS, COLORS } from '../../theme';

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
        width: 256, // w-64
        height: '100%',
        flexDirection: 'column',
      }}
      className="bg-sidebar-bg border-r border-sidebar-border"
    >
      {/* School Logo & Name */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          height: 56, // Standard header height
        }}
        className="border-b border-sidebar-border hover:bg-sidebar-hover"
      >
        <DirectusImage
          fileId={organization?.logo}
          style={{ width: 24, height: 24, borderRadius: 4, marginRight: 10 }} // Smaller, denser
          contentFit="cover"
          fallback={
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                marginRight: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="bg-sidebar-accent"
            >
              <Ionicons name="school" size={14} color="#fff" />
            </View>
          }
        />
        <Text
          style={{ flex: 1, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}
          className="text-sidebar-textActive"
          numberOfLines={1}
        >
          {organization?.name || 'Kairos'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.sidebarMuted} />
      </Pressable>

      {/* Main Navigation */}
      <View style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => handleNavigation(item.href)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 6,
                marginBottom: 2,
                backgroundColor: active
                  ? COLORS.primary
                  : (state as WebPressableState).hovered
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
              })}
            >
              <Ionicons
                name={item.icon}
                size={16} // Smaller icons
                color={active ? '#fff' : '#94A3B8'} // slate-400 inactive
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: active ? '500' : '400',
                }}
                className={active ? 'text-sidebar-textActive' : 'text-sidebar-text'}
              >
                {item.label}
              </Text>
              {item.badge && item.badge > 0 && (
                <View
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : COLORS.primary,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '600' }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* My Children Section - Accordion */}
      {children && children.length > 0 && (
        <View style={{ paddingHorizontal: 8, flex: 1 }}>
          <Pressable
            onPress={() => setIsChildrenExpanded(!isChildrenExpanded)}
            style={(state) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 8,
              marginTop: 8,
              opacity: (state as WebPressableState).hovered ? 1 : 0.8,
            })}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
              className="text-sidebar-textMuted"
            >
              Mis Hijos
            </Text>
            <Ionicons
              name={isChildrenExpanded ? 'chevron-down' : 'add'}
              size={12}
              color="#94A3B8"
            />
          </Pressable>

          {isChildrenExpanded &&
            children.map((child, index) => {
              const isExpanded = expandedChildId === child.id;
              return (
                <View key={child.id} style={{ marginBottom: 4 }}>
                  <Pressable
                    onPress={() => toggleChildExpanded(child.id)}
                    style={(state) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: isExpanded
                        ? 'rgba(255, 255, 255, 0.05)'
                        : (state as WebPressableState).hovered
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        backgroundColor: getChildColor(index),
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '700' }}>
                        {getChildInitial(child.first_name || 'H')}
                      </Text>
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: isExpanded ? '500' : '400',
                      }}
                      className={isExpanded ? 'text-sidebar-textActive' : 'text-sidebar-text'}
                    >
                      {child.first_name}
                    </Text>
                  </Pressable>

                  {/* Child sub-navigation - Indented */}
                  {isExpanded && (
                    <View style={{ marginLeft: 36, marginTop: 2, borderLeftWidth: 1, borderColor: '#334155' }}>
                      {childNavItems.map((navItem) => (
                        <Pressable
                          key={navItem.suffix}
                          onPress={() =>
                            handleNavigation(`/(tabs)/mishijos/${child.id}${navItem.suffix}`)
                          }
                          style={(state) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 5,
                            paddingHorizontal: 8,
                            marginLeft: 4,
                            borderRadius: 4,
                            backgroundColor: (state as WebPressableState).hovered
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'transparent',
                          })}
                        >
                          <Text style={{ fontSize: 13 }} className="text-sidebar-textMuted hover:text-sidebar-textActive">
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

      {/* User Profile / Settings - Fixed at bottom */}
      <View style={{ padding: 8, borderTopWidth: 1 }} className="border-sidebar-border bg-sidebar-bg">
        <Pressable
          onPress={() => handleNavigation('/settings')}
          style={(state) => ({
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            borderRadius: 6,
            backgroundColor: (state as WebPressableState).hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          })}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              backgroundColor: COLORS.primary,
            }}
          >
            <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>
              {user?.first_name?.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '500' }} className="text-sidebar-textActive" numberOfLines={1}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={{ fontSize: 11 }} className="text-sidebar-textMuted" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <Ionicons name="settings-sharp" size={16} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );
}

export default WebSidebar;
