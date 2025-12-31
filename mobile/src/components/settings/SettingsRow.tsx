import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

// Screen-specific semantic colors
const SETTINGS_COLORS = {
  danger: '#DC3545',
};

export interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

const SettingsRow = React.memo(({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false
}: SettingsRowProps) => (
  <TouchableOpacity
    style={styles.settingsRow}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={styles.settingsRowLeft}>
      {icon}
      <Text style={[styles.settingsRowLabel, destructive && styles.destructiveText]}>{label}</Text>
    </View>
    <View style={styles.settingsRowRight}>
      {value && <Text style={styles.settingsRowValue}>{value}</Text>}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      )}
    </View>
  </TouchableOpacity>
));

SettingsRow.displayName = 'SettingsRow';

export default SettingsRow;

const styles = StyleSheet.create({
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsRowLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingsRowValue: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
    maxWidth: 150,
  },
  destructiveText: {
    color: SETTINGS_COLORS.danger,
  },
});
