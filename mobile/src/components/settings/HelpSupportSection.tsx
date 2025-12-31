import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsRow from './SettingsRow';
import { COLORS } from '../../theme';

export interface SchoolInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
}

export interface HelpSupportSectionProps {
  schoolInfo: SchoolInfo;
}

const HelpSupportSection = React.memo(({ schoolInfo }: HelpSupportSectionProps) => {
  const handleCall = () => {
    Linking.openURL(`tel:${schoolInfo.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${schoolInfo.email}`);
  };

  const handleWebsite = () => {
    Linking.openURL(schoolInfo.website);
  };

  const handleAddress = () => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(schoolInfo.address)}`);
  };

  const handleFAQ = () => {
    Alert.alert('FAQ', 'Proximamente: seccion de preguntas frecuentes.');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ayuda y Soporte</Text>

      <SettingsRow
        icon={<Ionicons name="help-circle-outline" size={22} color={COLORS.primary} style={styles.icon} />}
        label="Preguntas Frecuentes"
        onPress={handleFAQ}
      />

      <SettingsRow
        icon={<Ionicons name="call-outline" size={22} color={COLORS.primary} style={styles.icon} />}
        label="Llamar al Colegio"
        value={schoolInfo.phone}
        onPress={handleCall}
      />

      <SettingsRow
        icon={<Ionicons name="mail-outline" size={22} color={COLORS.primary} style={styles.icon} />}
        label="Email de Contacto"
        value={schoolInfo.email}
        onPress={handleEmail}
        showChevron={false}
      />

      <SettingsRow
        icon={<Ionicons name="globe-outline" size={22} color={COLORS.primary} style={styles.icon} />}
        label="Sitio Web"
        onPress={handleWebsite}
      />

      <SettingsRow
        icon={<Ionicons name="location-outline" size={22} color={COLORS.primary} style={styles.icon} />}
        label="Direccion"
        value={schoolInfo.address}
        showChevron={false}
        onPress={handleAddress}
      />
    </View>
  );
});

HelpSupportSection.displayName = 'HelpSupportSection';

export default HelpSupportSection;

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
