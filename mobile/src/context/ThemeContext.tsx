import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDoc, Institution } from '../api/frappe';
import { useAuth } from './AppContext';
import { COLORS as DEFAULT_COLORS } from '../theme';

interface ThemeColors {
  primary: string;
  primaryLight: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  isLoading: boolean;
  organizationName: string | null;
  organizationLogo: string | null;
}

const defaultTheme: ThemeContextType = {
  colors: {
    primary: DEFAULT_COLORS.primary,
    primaryLight: DEFAULT_COLORS.primaryLight,
  },
  isLoading: false,
  organizationName: null,
  organizationLogo: null,
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

/**
 * Generates a lighter version of a hex color (for backgrounds)
 */
function getLighterColor(hex: string): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Mix with white (factor 0.9 = 90% white, 10% original)
  const factor = 0.9;
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      return getDoc<Institution>('Institution', organizationId);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 60, // 1 hour - org colors rarely change
  });

  const value = useMemo<ThemeContextType>(() => {
    const primaryColor = organization?.primary_color || DEFAULT_COLORS.primary;

    return {
      colors: {
        primary: primaryColor,
        primaryLight: organization?.primary_color
          ? getLighterColor(primaryColor)
          : DEFAULT_COLORS.primaryLight,
      },
      isLoading,
      organizationName: organization?.institution_name || null,
      organizationLogo: organization?.logo || null,
    };
  }, [organization, isLoading]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access the current organization's theme colors.
 * Falls back to default colors if no organization theme is available.
 *
 * Usage:
 * ```tsx
 * const { colors } = useTheme();
 * <View style={{ backgroundColor: colors.primary }} />
 * ```
 */
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

export default ThemeContext;
