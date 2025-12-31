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
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        overflow: 'hidden',
      }}
      className="h-screen bg-gray-50"
    >
      {/* Sidebar - Fixed width, full height */}
      {!hideSidebar && <WebSidebar />}

      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column', position: 'relative' }}>
        {/* Header - Sticky at top */}
        {!hideHeader && <WebHeader title={title} breadcrumbs={breadcrumbs} />}

        {/* Content - Scrollable area */}
        <View
          style={{
            flex: 1,
            overflow: fullScreen ? 'hidden' : ('auto' as unknown as 'visible'),
          }}
          className={fullScreen ? "bg-white" : "bg-content-bg"}
        >
          {fullScreen ? (
             // Full screen mode: direct children render
             children
          ) : (
            // Standard mode: Centered container with padding
            <View
              style={{
                maxWidth: 1600, // Increased max-width for modern ultrawide feel
                marginHorizontal: 'auto',
                width: '100%',
                paddingHorizontal: 24,
                paddingVertical: 24,
              }}
            >
              {children}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default WebLayout;
