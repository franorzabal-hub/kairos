import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AppContext';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showAvatar?: boolean;
}

type RootStackParamList = {
  Settings: undefined;
};

export default function ScreenHeader({ title, subtitle, showBackButton = false, showAvatar = true }: ScreenHeaderProps) {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Detail mode: back button + centered title + spacer
  if (showBackButton) {
    return (
      <View style={styles.detailHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.detailTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
    );
  }

  // List mode: left-aligned title + avatar
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showAvatar && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.avatarButton}
          accessibilityLabel="Ir a configuración"
          accessibilityRole="button"
        >
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.screenTitle,
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: {
    fontSize: 15,
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
