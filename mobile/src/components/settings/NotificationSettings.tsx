import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ToggleRow from './ToggleRow';
import { COLORS } from '../../theme';

export interface NotificationPreferences {
  messages: boolean;
  announcements: boolean;
  events: boolean;
  reports: boolean;
  pickupRequests: boolean;
  quietHours: boolean;
}

export interface NotificationSettingsProps {
  notifications: NotificationPreferences;
  onUpdateNotification: (key: keyof NotificationPreferences, value: boolean) => void;
}

const NotificationSettings = React.memo(({
  notifications,
  onUpdateNotification
}: NotificationSettingsProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Notificaciones</Text>

    <ToggleRow
      icon={<Ionicons name="mail-outline" size={22} color={COLORS.primary} style={styles.icon} />}
      label="Mensajes"
      description="Nuevos mensajes del colegio"
      value={notifications.messages}
      onValueChange={(v) => onUpdateNotification('messages', v)}
    />

    <ToggleRow
      icon={<Ionicons name="megaphone-outline" size={22} color={COLORS.primary} style={styles.icon} />}
      label="Novedades"
      description="Anuncios y comunicados"
      value={notifications.announcements}
      onValueChange={(v) => onUpdateNotification('announcements', v)}
    />

    <ToggleRow
      icon={<Ionicons name="calendar-outline" size={22} color={COLORS.primary} style={styles.icon} />}
      label="Eventos"
      description="Recordatorios de eventos"
      value={notifications.events}
      onValueChange={(v) => onUpdateNotification('events', v)}
    />

    <ToggleRow
      icon={<Ionicons name="document-text-outline" size={22} color={COLORS.primary} style={styles.icon} />}
      label="Boletines"
      description="Nuevos reportes disponibles"
      value={notifications.reports}
      onValueChange={(v) => onUpdateNotification('reports', v)}
    />

    <ToggleRow
      icon={<Ionicons name="person-outline" size={22} color={COLORS.primary} style={styles.icon} />}
      label="Autorizaciones"
      description="Estado de solicitudes de retiro"
      value={notifications.pickupRequests}
      onValueChange={(v) => onUpdateNotification('pickupRequests', v)}
    />

    <View style={styles.divider} />

    <ToggleRow
      icon={<Ionicons name="moon-outline" size={22} color={COLORS.gray} style={styles.icon} />}
      label="Modo No Molestar"
      description="Silenciar de 22:00 a 07:00"
      value={notifications.quietHours}
      onValueChange={(v) => onUpdateNotification('quietHours', v)}
    />
  </View>
));

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;

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
  divider: {
    height: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
});
