import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AppContext';
import { useSession } from '../hooks';
import { clearAllReadStatus } from '../services/readStatusService';
import { isBiometricEnabled, setBiometricEnabled } from '../api/directus';
import Constants from 'expo-constants';
import { SettingsRow, ToggleRow } from '../components/settings';
import { COLORS, SPACING, BORDERS, FONT_SIZES, SIZES } from '../theme';
import { logger } from '../utils';

// Screen-specific semantic colors
const SETTINGS_COLORS = {
  danger: '#DC3545',
  dangerLight: '#FEE2E2',
};

// School contact info (would come from organization settings in production)
const SCHOOL_INFO = {
  name: 'Colegio San Martin',
  phone: '+54 11 4567-8900',
  email: 'info@colegiosanmartin.edu.ar',
  address: 'Av. Libertador 1234, Buenos Aires',
  website: 'https://colegiosanmartin.edu.ar',
};

export default function SettingsScreen() {
  const router = useRouter();
  // Centralized session state - user, children, permissions
  const { user, children } = useSession();
  const { logout } = useAuth();

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

  // Biometric authentication state
  const [biometricEnabled, setBiometricState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometria');

  // Check biometric status on mount
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    // Biometric auth is only available on native platforms
    if (Platform.OS === 'web') {
      setBiometricAvailable(false);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);

      // Determine biometric type for display
      if (hasHardware) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }

      const enabled = await isBiometricEnabled();
      setBiometricState(enabled);
    } catch (error) {
      logger.error('Error checking biometric status:', error);
    }
  };

  const handleToggleBiometric = async (newValue: boolean) => {
    // Guard against web platform (should never be called, but defensive)
    if (Platform.OS === 'web') return;

    if (newValue) {
      // Activating - verify biometric first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma para activar autenticacion biometrica',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });

      if (result.success) {
        await setBiometricEnabled(true);
        setBiometricState(true);
        Alert.alert('Activado', `${biometricType} habilitado para inicio de sesion rapido.`);
      }
    } else {
      // Deactivating
      await setBiometricEnabled(false);
      setBiometricState(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesion',
      'Estas seguro que queres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesion', style: 'destructive', onPress: logout },
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
      'Cambiar Contrasena',
      'Se enviara un enlace a tu correo electronico para restablecer tu contrasena.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar Enlace',
          onPress: () => {
            // TODO: Implement password reset
            Alert.alert('Enlace Enviado', 'Revisa tu correo electronico para cambiar tu contrasena.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta accion es irreversible. Todos tus datos seran eliminados permanentemente. Estas seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion request
            Alert.alert(
              'Solicitud Enviada',
              'Tu solicitud de eliminacion de cuenta ha sido recibida. Te contactaremos pronto.'
            );
          },
        },
      ]
    );
  };

  const handleManageAuthorizedPersons = () => {
    Alert.alert(
      'Personas Autorizadas',
      'Esta funcionalidad estara disponible proximamente. Por ahora, usa la seccion "Cambios" para autorizar retiros.',
      [{ text: 'Entendido' }]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Tema de la App',
      'Selecciona el tema visual',
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

  const handleClearReadStatus = () => {
    if (!user?.id) return;
    Alert.alert(
      'Marcar Todo Como No Leido',
      'Estas seguro? Todas las novedades, eventos, mensajes y boletines apareceran como no leidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar No Leido',
          onPress: async () => {
            await clearAllReadStatus(user.id);
            Alert.alert('Listo', 'Todo el contenido ha sido marcado como no leido.');
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Configuracion</Text>
        <TouchableOpacity
          onPress={() => router.back()}
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
              Alert.alert('Historial', 'Accede desde la seccion Cambios para ver el historial.');
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
            value="Espanol"
            onPress={() => Alert.alert('Idioma', 'Por ahora solo espanol esta disponible.')}
          />

          <SettingsRow
            icon={<Ionicons name="eye-off-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Marcar Todo No Leido"
            onPress={handleClearReadStatus}
          />
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayuda y Soporte</Text>

          <SettingsRow
            icon={<Ionicons name="help-circle-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Preguntas Frecuentes"
            onPress={() => Alert.alert('FAQ', 'Proximamente: seccion de preguntas frecuentes.')}
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
            label="Direccion"
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
            label="Cambiar Contrasena"
            onPress={handleChangePassword}
          />

          {biometricAvailable ? (
            <ToggleRow
              icon={<Ionicons name="finger-print-outline" size={22} color={COLORS.primary} style={styles.icon} />}
              label={biometricType}
              description="Inicio de sesion rapido"
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
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

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <SettingsRow
            icon={<Ionicons name="document-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Terminos y Condiciones"
            onPress={() => Alert.alert('Terminos', 'Proximamente: terminos y condiciones.')}
          />

          <SettingsRow
            icon={<Ionicons name="shield-outline" size={22} color={COLORS.primary} style={styles.icon} />}
            label="Politica de Privacidad"
            onPress={() => Alert.alert('Privacidad', 'Proximamente: politica de privacidad.')}
          />
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacion de la App</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
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
            accessibilityLabel="Cerrar sesion"
          >
            <Ionicons name="log-out-outline" size={20} color={SETTINGS_COLORS.danger} />
            <Text style={styles.logoutText}>Cerrar Sesion</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    fontSize: FONT_SIZES['3xl'],
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
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: SIZES.avatarXl + SIZES.iconLg,
    height: SIZES.avatarXl + SIZES.iconLg,
    borderRadius: BORDERS.radius.xxl + BORDERS.radius.xxl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarText: {
    fontSize: FONT_SIZES['7xl'],
    fontWeight: '700',
    color: COLORS.white,
  },
  userName: {
    fontSize: FONT_SIZES['5xl'],
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray,
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  childAvatar: {
    width: SIZES.avatarMd,
    height: SIZES.avatarMd,
    borderRadius: BORDERS.radius.xxl,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  childAvatarText: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
    color: COLORS.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '500',
    color: '#333',
  },
  icon: {
    marginRight: SPACING.md,
    width: SIZES.iconLg,
  },
  divider: {
    height: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  // Info Row styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES['2xl'],
    color: '#333',
  },
  infoValue: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
  },
  // Action buttons
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.listItemPadding,
    backgroundColor: SETTINGS_COLORS.dangerLight,
    borderRadius: BORDERS.radius.md,
    marginBottom: SPACING.md,
  },
  logoutText: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
    color: SETTINGS_COLORS.danger,
    marginLeft: SPACING.sm,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  deleteAccountText: {
    fontSize: FONT_SIZES.lg,
    color: SETTINGS_COLORS.danger,
    marginLeft: SPACING.xs + SPACING.xxs,
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});
