import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DirectusImage from './DirectusImage';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../api/hooks';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SIZES, FONT_SIZES } from '../theme';

interface ScreenHeaderProps {
  title?: string; // Tab/section title (e.g., "Mensajes", "Agenda") - shows org branding if not provided
  showBackButton?: boolean;
  backTitle?: string; // Title for detail screens with back button
  rightAccessory?: React.ReactNode; // Optional custom element between title and avatar
}

// Helper to determine if a color is light or dark (for text contrast)
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function ScreenHeader({ title, showBackButton = false, backTitle, rightAccessory }: ScreenHeaderProps) {
  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const router = useRouter();

  // Get org color or fallback to primary
  const headerColor = organization?.primary_color || COLORS.primary;
  const isLight = isLightColor(headerColor);
  const textColor = isLight ? COLORS.black : COLORS.white;
  const avatarBgColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)';

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getOrgInitials = () => {
    return organization?.name?.charAt(0)?.toUpperCase() || 'K';
  };

  // Detail mode: back button + centered title + spacer
  if (showBackButton) {
    return (
      <View style={styles.detailHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.detailTitle} numberOfLines={1}>{backTitle || ''}</Text>
        <View style={styles.headerSpacer} />
      </View>
    );
  }

  // Main header with consistent org color background
  return (
    <View style={[styles.header, { backgroundColor: headerColor }]}>
      {/* Left side: Title OR Organization logo + name */}
      {title ? (
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      ) : (
        <TouchableOpacity
          style={styles.orgContainer}
          onPress={() => {
            // TODO: Open workspace settings/switcher
          }}
          accessibilityLabel="Configuración del colegio"
          accessibilityRole="button"
        >
          <DirectusImage
            fileId={organization?.logo}
            style={styles.orgLogo}
            resizeMode="cover"
            fallback={
              <View style={[styles.orgLogoPlaceholder, { backgroundColor: avatarBgColor }]}>
                <Text style={[styles.orgLogoInitial, { color: textColor }]}>{getOrgInitials()}</Text>
              </View>
            }
          />
          <Text style={[styles.orgName, { color: textColor }]} numberOfLines={1}>
            {organization?.name || 'Kairos'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Right side: Optional accessory + User avatar */}
      <View style={styles.rightContainer}>
        {rightAccessory}
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={[styles.avatarButton, { backgroundColor: avatarBgColor }]}
          accessibilityLabel="Ir a configuración"
          accessibilityRole="button"
        >
          <Text style={[styles.avatarText, { color: textColor }]}>{getInitials()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  // Organization (left side - for home tab)
  orgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  orgLogo: {
    width: SIZES.buttonHeightSm,
    height: SIZES.buttonHeightSm,
    borderRadius: BORDERS.radius.md,
  },
  orgLogoPlaceholder: {
    width: SIZES.buttonHeightSm,
    height: SIZES.buttonHeightSm,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgLogoInitial: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '700',
  },
  orgName: {
    ...TYPOGRAPHY.screenTitle,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  // Section title (for other tabs)
  sectionTitle: {
    ...TYPOGRAPHY.screenTitle,
    flex: 1,
  },
  // Right container (accessory + avatar)
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  // Avatar (right side)
  avatarButton: {
    width: SIZES.buttonHeightSm,
    height: SIZES.buttonHeightSm,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  // Detail header styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: SIZES.avatarMd,
    height: SIZES.avatarMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    flex: 1,
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  headerSpacer: {
    width: SIZES.avatarMd,
  },
});

// Memoize to prevent unnecessary re-renders
export default React.memo(ScreenHeader);
