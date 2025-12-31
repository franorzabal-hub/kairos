import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

// Screen-specific semantic colors
const SETTINGS_COLORS = {
  danger: '#DC3545',
  dangerLight: '#FEE2E2',
};

export interface AccountActionsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const AccountActions = React.memo(({ onLogout, onDeleteAccount }: AccountActionsProps) => (
  <View style={styles.section}>
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={onLogout}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesion"
    >
      <Ionicons name="log-out-outline" size={20} color={SETTINGS_COLORS.danger} />
      <Text style={styles.logoutText}>Cerrar Sesion</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.deleteAccountButton}
      onPress={onDeleteAccount}
      accessibilityRole="button"
      accessibilityLabel="Eliminar cuenta"
    >
      <Ionicons name="trash-outline" size={18} color={SETTINGS_COLORS.danger} />
      <Text style={styles.deleteAccountText}>Eliminar Cuenta</Text>
    </TouchableOpacity>
  </View>
));

AccountActions.displayName = 'AccountActions';

export default AccountActions;

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: SETTINGS_COLORS.dangerLight,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: SETTINGS_COLORS.danger,
    marginLeft: 8,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: 14,
    color: SETTINGS_COLORS.danger,
    marginLeft: 6,
  },
});
