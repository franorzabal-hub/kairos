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
  /** Hide footer */
  hideFooter?: boolean;
}

export function WebLayout({
  children,
  title,
  breadcrumbs,
  hideSidebar = false,
  hideHeader = false,
  hideFooter = false,
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
        height: '100vh' as unknown as number, // CSS value for web
        overflow: 'hidden',
      }}
    >
      {/* Sidebar - Fixed width, full height */}
      {!hideSidebar && <WebSidebar />}

      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Header - Sticky at top */}
        {!hideHeader && <WebHeader title={title} breadcrumbs={breadcrumbs} />}

        {/* Content - Scrollable area */}
        <View
          style={{
            flex: 1,
            overflow: 'auto' as unknown as 'visible', // CSS for scrolling
          }}
          className="bg-content-bg"
        >
          <View
            style={{
              maxWidth: 1280, // max-w-7xl equivalent
              marginHorizontal: 'auto',
              width: '100%',
              padding: 32, // p-8 equivalent
            }}
          >
            {children}
          </View>
        </View>

        {/* Footer - Status bar */}
        {!hideFooter && <WebFooter />}
      </View>
    </View>
  );
}

export default WebLayout;
