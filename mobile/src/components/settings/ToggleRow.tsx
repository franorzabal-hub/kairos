import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { COLORS } from '../../theme';

export interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleRow = React.memo(({
  icon,
  label,
  description,
  value,
  onValueChange
}: ToggleRowProps) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleRowLeft}>
      {icon}
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
      thumbColor={value ? COLORS.primary : COLORS.gray}
      ios_backgroundColor={COLORS.border}
    />
  </View>
));

ToggleRow.displayName = 'ToggleRow';

export default ToggleRow;

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  toggleDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});
