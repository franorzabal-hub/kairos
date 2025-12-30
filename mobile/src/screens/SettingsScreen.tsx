import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useAppContext } from '../context/AppContext';
import Constants from 'expo-constants';
import { COLORS, SPACING, BORDERS } from '../theme';

// Screen-specific semantic colors
const SETTINGS_COLORS = {
  danger: '#DC3545',
  dangerLight: '#FEE2E2',
};

// School contact info (would come from organization settings in production)
const SCHOOL_INFO = {
  name: 'Colegio San Martín',
  phone: '+54 11 4567-8900',
  email: 'info@colegiosanmartin.edu.ar',
  address: 'Av. Libertador 1234, Buenos Aires',
  website: 'https://colegiosanmartin.edu.ar',
};

type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
};

const SettingsRow = ({ icon, label, value, onPress, showChevron = true, destructive = false }: SettingsRowProps) => (
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
);

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const ToggleRow = ({ icon, label, description, value, onValueChange }: ToggleRowProps) => (
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
);

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { children } = useAppContext();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    messages: true,
    announcements: true,
    events: true,
    reports: true,
    pickupRequests: true,
    quietHours: false,
  });

  // App preferences state
  const [preferences, setPreferences] = useState({
    theme: 'system', // 'light' | 'dark' | 'system'
    language: 'es',
  });

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const handleCall = () => {
    Linking.openURL(`tel:${SCHOOL_INFO.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SCHOOL_INFO.email}`);
  };

  const handleWebsite = () => {
    Linking.openURL(SCHOOL_INFO.website);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Cambiar Contraseña',
      'Se enviará un enlace a tu correo electrónico para restablecer tu contraseña.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar Enlace',
          onPress: () => {
            // TODO: Implement password reset
            Alert.alert('Enlace Enviado', 'Revisá tu correo electrónico para cambiar tu contraseña.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción es irreversible. Todos tus datos serán eliminados permanentemente. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion request
            Alert.alert(
              'Solicitud Enviada',
              'Tu solicitud de eliminación de cuenta ha sido recibida. Te contactaremos pronto.'
            );
          },
        },
      ]
    );
  };

  const handleManageAuthorizedPersons = () => {
    Alert.alert(
      'Personas Autorizadas',
      'Esta funcionalidad estará disponible próximamente. Por ahora, usá la sección "Cambios" para autorizar retiros.',
      [{ text: 'Entendido' }]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Tema de la App',
      'Seleccioná el tema visual',
      [
        {
          text: 'Claro',
          onPress: () => setPreferences(prev => ({ ...prev, theme: 'light' })),
        },
        {
          text: 'Oscuro',
          onPress: () => setPreferences(prev => ({ ...prev, theme: 'dark' })),
        },
        {
          text: 'Sistema',
          onPress: () => setPreferences(prev => ({ ...prev, theme: 'system' })),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const getThemeLabel = () => {
    switch (preferences.theme) {
      case 'light': return 'Claro';
      case 'dark': return 'Oscuro';
      default: return 'Sistema';
    }
  };

  const updateNotification = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // TODO: Sync with backend
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Modal style with X close button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Configuración</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Children Section */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis Hijos</Text>
            {children.map((child, index) => (
              <View
                key={child.id}
                style={[
                  styles.childRow,
                  index === children.length - 1 && styles.lastRow,
                ]}
              >
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>
                    {child.first_name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>
                    {child.first_name} {child.last_name}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>

          <ToggleRow
            icon={<Ionicons name="mail-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Mensajes"
            description="Nuevos mensajes del colegio"
            value={notifications.messages}
            onValueChange={(v) => updateNotification('messages', v)}
          />

          <ToggleRow
            icon={<Ionicons name="megaphone-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Novedades"
            description="Anuncios y comunicados"
            value={notifications.announcements}
            onValueChange={(v) => updateNotification('announcements', v)}
          />

          <ToggleRow
            icon={<Ionicons name="calendar-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Eventos"
            description="Recordatorios de eventos"
            value={notifications.events}
            onValueChange={(v) => updateNotification('events', v)}
          />

          <ToggleRow
            icon={<Ionicons name="document-text-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Boletines"
            description="Nuevos reportes disponibles"
            value={notifications.reports}
            onValueChange={(v) => updateNotification('reports', v)}
          />

          <ToggleRow
            icon={<Ionicons name="person-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Autorizaciones"
            description="Estado de solicitudes de retiro"
            value={notifications.pickupRequests}
            onValueChange={(v) => updateNotification('pickupRequests', v)}
          />

          <View style={styles.divider} />

          <ToggleRow
            icon={<Ionicons name="moon-outline" size={22} color={COLORS.gray} style={styles.icon} />}
            label="Modo No Molestar"
            description="Silenciar de 22:00 a 07:00"
            value={notifications.quietHours}
            onValueChange={(v) => updateNotification('quietHours', v)}
          />
        </View>

        {/* Authorized Persons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autorizaciones</Text>

          <SettingsRow
            icon={<Ionicons name="people-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Personas Autorizadas"
            onPress={handleManageAuthorizedPersons}
          />

          <SettingsRow
            icon={<MaterialCommunityIcons name="car-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Historial de Retiros"
            onPress={() => {
              // Navigate to CambiosScreen history tab
              Alert.alert('Historial', 'Accedé desde la sección Cambios para ver el historial.');
            }}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>

          <SettingsRow
            icon={<Ionicons name="contrast-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Tema"
            value={getThemeLabel()}
            onPress={handleThemeChange}
          />

          <SettingsRow
            icon={<Ionicons name="language-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Idioma"
            value="Español"
            onPress={() => Alert.alert('Idioma', 'Por ahora solo español está disponible.')}
          />
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayuda y Soporte</Text>

          <SettingsRow
            icon={<Ionicons name="help-circle-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Preguntas Frecuentes"
            onPress={() => Alert.alert('FAQ', 'Próximamente: sección de preguntas frecuentes.')}
          />

          <SettingsRow
            icon={<Ionicons name="call-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Llamar al Colegio"
            value={SCHOOL_INFO.phone}
            onPress={handleCall}
          />

          <SettingsRow
            icon={<Ionicons name="mail-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Email de Contacto"
            value={SCHOOL_INFO.email}
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
            label="Dirección"
            value={SCHOOL_INFO.address}
            showChevron={false}
            onPress={() => {
              Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(SCHOOL_INFO.address)}`);
            }}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad y Seguridad</Text>

          <SettingsRow
            icon={<Ionicons name="key-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Cambiar Contraseña"
            onPress={handleChangePassword}
          />

          <SettingsRow
            icon={<Ionicons name="finger-print-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Autenticación Biométrica"
            onPress={() => Alert.alert('Biometría', 'Próximamente: inicio de sesión con huella o Face ID.')}
          />
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <SettingsRow
            icon={<Ionicons name="document-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Términos y Condiciones"
            onPress={() => Alert.alert('Términos', 'Próximamente: términos y condiciones.')}
          />

          <SettingsRow
            icon={<Ionicons name="shield-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Política de Privacidad"
            onPress={() => Alert.alert('Privacidad', 'Próximamente: política de privacidad.')}
          />
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la App</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Desarrollado por</Text>
            <Text style={styles.infoValue}>Kairos</Text>
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Ionicons name="log-out-outline" size={20} color={SETTINGS_COLORS.danger} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            accessibilityLabel="Eliminar cuenta"
          >
            <Ionicons name="trash-outline" size={18} color={SETTINGS_COLORS.danger} />
            <Text style={styles.deleteAccountText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
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
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Settings Row styles
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
  icon: {
    marginRight: 12,
    width: 24,
  },
  // Toggle Row styles
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
  divider: {
    height: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  // Info Row styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.gray,
  },
  // Action buttons
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
  bottomSpacing: {
    height: 32,
  },
});
