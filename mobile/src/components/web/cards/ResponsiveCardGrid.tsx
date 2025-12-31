/**
 * ResponsiveCardGrid - Responsive grid layout for cards on web
 *
 * Features:
 * - Auto-adjusts columns based on container width
 * - CSS Grid on web, flex wrap on mobile
 * - Configurable gap and min column width
 * - Works with any card component
 */
import React, { ReactNode } from 'react';
import { View, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { SPACING } from '../../../theme';

interface ResponsiveCardGridProps {
  children: ReactNode;
  /** Minimum width of each column (default: 320) */
  minColumnWidth?: number;
  /** Gap between cards (default: 16) */
  gap?: number;
  /** Maximum number of columns (default: 3) */
  maxColumns?: number;
  /** Style overrides */
  style?: any;
}

export function ResponsiveCardGrid({
  children,
  minColumnWidth = 320,
  gap = SPACING.lg,
  maxColumns = 3,
  style,
}: ResponsiveCardGridProps) {
  const { width } = useWindowDimensions();

  // On mobile, render as a simple vertical list
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.mobileContainer, style]}>
        {children}
      </View>
    );
  }

  // Calculate optimal number of columns based on container width
  // Account for padding in WebLayout (32px * 2 = 64px) and sidebar (260px)
  const contentWidth = Math.min(width - 260 - 64, 1280 - 64);
  const possibleColumns = Math.floor((contentWidth + gap) / (minColumnWidth + gap));
  const columns = Math.max(1, Math.min(possibleColumns, maxColumns));

  return (
    <View
      style={[
        {
          // CSS Grid layout for web
          display: 'grid' as any,
          gridTemplateColumns: `repeat(${columns}, 1fr)` as any,
          gap: gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * ResponsiveCardList - Simple vertical list with proper spacing
 * Use this for single-column layouts on both mobile and web
 */
export function ResponsiveCardList({
  children,
  gap = SPACING.md,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: any;
}) {
  return (
    <View
      style={[
        Platform.OS === 'web'
          ? { display: 'flex' as any, flexDirection: 'column', gap }
          : styles.mobileContainer,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * TwoColumnGrid - Fixed two-column layout
 * Useful for dashboard-style layouts
 */
export function TwoColumnGrid({
  children,
  gap = SPACING.lg,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: any;
}) {
  const { width } = useWindowDimensions();

  // On narrow screens, stack vertically
  if (Platform.OS !== 'web' || width < 768) {
    return (
      <View style={[styles.mobileContainer, style]}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          display: 'grid' as any,
          gridTemplateColumns: '1fr 1fr' as any,
          gap: gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * ThreeColumnGrid - Fixed three-column layout
 * For wide screens only
 */
export function ThreeColumnGrid({
  children,
  gap = SPACING.lg,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: any;
}) {
  const { width } = useWindowDimensions();

  // On narrow screens, use 2 columns
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.mobileContainer, style]}>
        {children}
      </View>
    );
  }

  const columns = width < 1024 ? (width < 768 ? 1 : 2) : 3;

  return (
    <View
      style={[
        {
          display: 'grid' as any,
          gridTemplateColumns: `repeat(${columns}, 1fr)` as any,
          gap: gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * MasterDetailLayout - Classic master-detail layout
 * Left column for list, right column for detail view
 */
export function MasterDetailLayout({
  master,
  detail,
  masterWidth = 380,
  gap = 0,
  style,
}: {
  master: ReactNode;
  detail: ReactNode;
  masterWidth?: number;
  gap?: number;
  style?: any;
}) {
  const { width } = useWindowDimensions();

  // On narrow screens, show only master or detail (not both)
  if (Platform.OS !== 'web' || width < 768) {
    return (
      <View style={[{ flex: 1 }, style]}>
        {master}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          display: 'grid' as any,
          gridTemplateColumns: `${masterWidth}px 1fr` as any,
          gap: gap,
          height: '100%' as any,
        },
        style,
      ]}
    >
      {master}
      {detail}
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flexDirection: 'column',
  },
});

export default ResponsiveCardGrid;
