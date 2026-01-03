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
import FrappeImage from '../FrappeImage';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    return pathname.startsWith(href.replace('(tabs)', ''));
  };

  const handleNavigation = (href: string) => {
    router.push(href as never);
  };

  const toggleChildExpanded = (childId: string) => {
    if (isCollapsed) {
       // If collapsed, navigation directly to child root
       handleNavigation(`/(tabs)/mishijos/${childId}`);
       return;
    }
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
        width: isCollapsed ? 64 : 256,
        height: '100%',
        flexDirection: 'column',
      }}
      className="bg-sidebar-bg border-r border-sidebar-border transition-all duration-300"
    >
      {/* School Logo & Name & Toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: isCollapsed ? 0 : 16,
          justifyContent: isCollapsed ? 'center' : 'space-between',
          height: 56,
        }}
        className="border-b border-sidebar-border"
      >
        {!isCollapsed && (
          <Pressable
             onPress={() => router.push('/(tabs)/inicio')}
             style={{ flexDirection: 'row', alignItems: 'center', flex: 1, overflow: 'hidden' }}
          >
            <FrappeImage
              fileId={organization?.logo}
              style={{ width: 24, height: 24, borderRadius: 4, marginRight: 10 }}
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
          </Pressable>
        )}

        <Pressable
          onPress={() => setIsCollapsed(!isCollapsed)}
          style={(state) => ({
            padding: 8,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (state as WebPressableState).hovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          })}
        >
           {isCollapsed ? (
             <FrappeImage
              fileId={organization?.logo}
              style={{ width: 24, height: 24, borderRadius: 4 }}
              contentFit="cover"
              fallback={<Ionicons name="menu" size={20} color={COLORS.sidebarText} />}
            />
           ) : (
             <Ionicons name="chevron-back" size={16} color={COLORS.sidebarMuted} />
           )}
        </Pressable>
      </View>

      {/* Main Navigation */}
      <View style={{ paddingVertical: 12, paddingHorizontal: 8, alignItems: isCollapsed ? 'center' : 'stretch' }}>
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => handleNavigation(item.href)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                paddingVertical: 6,
                paddingHorizontal: isCollapsed ? 0 : 8,
                width: isCollapsed ? 40 : 'auto',
                height: isCollapsed ? 40 : 'auto',
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
                size={16}
                color={active ? '#fff' : '#94A3B8'}
                style={{ marginRight: isCollapsed ? 0 : 10 }}
              />
              {!isCollapsed && (
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
              )}
              {item.badge && item.badge > 0 && (
                <View
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : COLORS.primary,
                    borderRadius: 10,
                    minWidth: isCollapsed ? 8 : 18,
                    height: isCollapsed ? 8 : 18,
                    width: isCollapsed ? 8 : undefined,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: isCollapsed ? 0 : 4,
                    position: isCollapsed ? 'absolute' : 'relative',
                    top: isCollapsed ? 4 : undefined,
                    right: isCollapsed ? 4 : undefined,
                  }}
                >
                  {!isCollapsed && (
                    <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '600' }}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* My Children Section */}
      {children && children.length > 0 && (
        <View style={{ paddingHorizontal: 8, flex: 1, marginTop: 16, alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {!isCollapsed ? (
            <Pressable
              onPress={() => setIsChildrenExpanded(!isChildrenExpanded)}
              style={(state) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                opacity: (state as WebPressableState).hovered ? 1 : 0.8,
              })}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: '#64748B',
                }}
              >
                Mis Hijos
              </Text>
              <Ionicons
                name={isChildrenExpanded ? 'chevron-down' : 'add'}
                size={12}
                color="#64748B"
              />
            </Pressable>
          ) : (
             /* Collapsed Header - Just a separator or icon */
             <View style={{ height: 1, backgroundColor: '#334155', width: 32, marginVertical: 8 }} />
          )}

          {/* Children List */}
          {((!isCollapsed && isChildrenExpanded) || isCollapsed) &&
            children.map((child, index) => {
              const isExpanded = expandedChildId === child.id;
              return (
                <View key={child.id} style={{ marginBottom: 2, alignItems: isCollapsed ? 'center' : 'stretch' }}>
                  <Pressable
                    onPress={() => toggleChildExpanded(child.id)}
                    style={(state) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      paddingVertical: 6,
                      paddingHorizontal: isCollapsed ? 0 : 8,
                      marginLeft: isCollapsed ? 0 : 8,
                      width: isCollapsed ? 36 : 'auto',
                      height: isCollapsed ? 36 : 'auto',
                      borderRadius: 6,
                      backgroundColor: isExpanded && !isCollapsed
                        ? 'rgba(255, 255, 255, 0.1)'
                        : (state as WebPressableState).hovered
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: isCollapsed ? 0 : 8,
                        backgroundColor: getChildColor(index),
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 9, fontWeight: '700' }}>
                        {getChildInitial(child.first_name || 'H')}
                      </Text>
                    </View>
                    {!isCollapsed && (
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
                    )}
                  </Pressable>

                  {/* Child sub-navigation - Indented (Only when expanded) */}
                  {isExpanded && !isCollapsed && (
                    <View style={{ marginLeft: 24, marginTop: 1, borderLeftWidth: 1, borderColor: '#334155' }}>
                      {childNavItems.map((navItem) => (
                        <Pressable
                          key={navItem.suffix}
                          onPress={() =>
                            handleNavigation(`/(tabs)/mishijos/${child.id}${navItem.suffix}`)
                          }
                          style={(state) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            marginLeft: 8,
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
      <View style={{ padding: 8, marginBottom: 8, alignItems: isCollapsed ? 'center' : 'stretch' }}>
        <Pressable
          onPress={() => handleNavigation('/settings')}
          style={(state) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: 8,
            borderRadius: 6,
            backgroundColor: (state as WebPressableState).hovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          })}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: isCollapsed ? 0 : 10,
              backgroundColor: COLORS.primary,
            }}
          >
            <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>
              {user?.first_name?.charAt(0)}
            </Text>
          </View>
          {!isCollapsed && (
            <>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '500' }} className="text-sidebar-textActive" numberOfLines={1}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Ionicons name="settings-sharp" size={14} color="#64748B" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default WebSidebar;
