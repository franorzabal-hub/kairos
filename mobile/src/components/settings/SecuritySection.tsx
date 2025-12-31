import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsRow from './SettingsRow';
import ToggleRow from './ToggleRow';
import { COLORS } from '../../theme';

export interface SecuritySectionProps {
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: string;
  onChangePassword: () => void;
  onToggleBiometric: (value: boolean) => void;
}

const SecuritySection = React.memo(({
  biometricAvailable,
  biometricEnabled,
  biometricType,
  onChangePassword,
  onToggleBiometric,
}: SecuritySectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Privacidad y Seguridad</Text>

    <SettingsRow
      icon={<Ionicons name="key-outline" size={22} color={COLORS.primary} style={styles.icon} />}
      label="Cambiar Contrasena"
      onPress={onChangePassword}
    />

    {biometricAvailable ? (
      <ToggleRow
        icon={<Ionicons name="finger-print-outline" size={22} color={COLORS.primary} style={styles.icon} />}
        label={biometricType}
        description="Inicio de sesion rapido"
        value={biometricEnabled}
        onValueChange={onToggleBiometric}
      />
    ) : (
      <SettingsRow
        icon={<Ionicons name="finger-print-outline" size={22} color={COLORS.gray} style={styles.icon} />}
        label="Autenticacion Biometrica"
        value="No disponible"
        showChevron={false}
      />
    )}
  </View>
));

SecuritySection.displayName = 'SecuritySection';

export default SecuritySection;

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
    width: 24,
  },
});
