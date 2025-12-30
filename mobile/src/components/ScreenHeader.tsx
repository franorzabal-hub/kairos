import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DirectusImage from './DirectusImage';
import { useAuth } from '../context/AppContext';
import { useOrganization } from '../api/hooks';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface ScreenHeaderProps {
  showBackButton?: boolean;
  backTitle?: string; // Title for detail screens with back button
}

export default function ScreenHeader({ showBackButton = false, backTitle }: ScreenHeaderProps) {
  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const router = useRouter();

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

  // Main header: Slack-style with org logo/name on left, avatar on right
  return (
    <View style={styles.header}>
      {/* Left side: Organization logo + name */}
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
            <View style={styles.orgLogoPlaceholder}>
              <Text style={styles.orgLogoInitial}>{getOrgInitials()}</Text>
            </View>
          }
        />
        <Text style={styles.orgName} numberOfLines={1}>
          {organization?.name || 'Kairos'}
        </Text>
      </TouchableOpacity>

      {/* Right side: User avatar */}
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        style={styles.avatarButton}
        accessibilityLabel="Ir a configuración"
        accessibilityRole="button"
      >
        <Text style={styles.avatarText}>{getInitials()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  // Organization (left side)
  orgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  orgLogo: {
    width: 36,
    height: 36,
    borderRadius: BORDERS.radius.md,
  },
  orgLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: BORDERS.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgLogoInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  orgName: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.black,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  // Avatar (right side)
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  headerSpacer: {
    width: 40,
  },
});
