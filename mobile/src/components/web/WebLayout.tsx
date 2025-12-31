/**
 * WebLayout - Main layout wrapper for web version
 *
 * Implements a Slack-style layout with:
 * - Fixed sidebar (260px, dark theme)
 * - Sticky header with breadcrumbs
 * - Scrollable main content area
 * - Status bar footer
 *
 * Uses Platform.OS to only render on web.
 * On mobile, children are rendered directly without the layout wrapper.
 */
import React, { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { WebSidebar } from './WebSidebar';
import { WebHeader } from './WebHeader';
import { WebFooter } from './WebFooter';

interface WebLayoutProps {
  children: ReactNode;
  /** Current page title for the header */
  title?: string;
  /** Breadcrumb items: [{ label: 'Home', href: '/' }, ...] */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Hide sidebar (for full-screen pages like login) */
  hideSidebar?: boolean;
  /** Hide header */
  hideHeader?: boolean;
  /** Use full screen width/height without inner padding (SPA mode) */
  fullScreen?: boolean;
}

export function WebLayout({
  children,
  title,
  breadcrumbs,
  hideSidebar = false,
  hideHeader = false,
  fullScreen = false,
}: WebLayoutProps) {
  // On mobile, just render children without the layout wrapper
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    // 1. Contenedor Raíz (Page Wrapper)
    // flex-col because Footer is at the bottom
    <View className="flex-1 h-screen flex-col bg-white overflow-hidden">
      
      {/* 2. Área Central (Main Workspace) */}
      {/* Ocupa todo el espacio menos el Footer */}
      <View className="flex-1 flex-row overflow-hidden">
        
        {/* Sidebar */}
        {!hideSidebar && <WebSidebar />}

        {/* Content Column */}
        <View className="flex-1 flex-col relative">
          {/* Header - Sticky at top */}
          {!hideHeader && <WebHeader title={title} breadcrumbs={breadcrumbs} />}

          {/* Main Content Area */}
          <View className={`flex-1 overflow-hidden ${fullScreen ? 'bg-white' : 'bg-content-bg'}`}>
            {fullScreen ? (
               // Full Screen Mode (SPA) - No scrolling here, direct children
               children
            ) : (
              // Standard Mode - Centered container with scroll
              <View 
                style={{ flex: 1, overflow: 'auto' as any }} // CSS scroll
              >
                <View
                  style={{
                    maxWidth: 1600,
                    marginHorizontal: 'auto',
                    width: '100%',
                    paddingHorizontal: 24,
                    paddingVertical: 24,
                  }}
                >
                  {children}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 4. Footer Global (System Status Bar) */}
      <WebFooter />
    </View>
  );
}

export default WebLayout;
