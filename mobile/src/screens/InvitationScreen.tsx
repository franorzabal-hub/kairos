/**
 * InvitationScreen - Pantalla para ver y aceptar invitaciones
 *
 * Esta pantalla se muestra cuando un padre/tutor recibe una invitacion
 * para vincularse con estudiantes en una escuela.
 *
 * La pantalla maneja los siguientes estados:
 * - loading: Cargando datos de la invitacion
 * - error: Error al cargar la invitacion
 * - expired: Invitacion expirada o revocada
 * - accepted: Invitacion ya aceptada
 * - pending: Invitacion valida, esperando accion del usuario
 *
 * Si el usuario no esta logueado, muestra boton para ir a login.
 * Si el usuario esta logueado, muestra boton para aceptar.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { useInvitation, useAcceptInvitation, type InvitationStudent } from '../api/hooks';
import { getAssetUrl } from '../api/frappe';
import { COLORS, SPACING, BORDERS, FONT_SIZES, SHADOWS } from '../theme';

// =============================================================================
// COMPONENTS
// =============================================================================

interface StudentCardProps {
  student: InvitationStudent;
}

function StudentCard({ student }: StudentCardProps) {
  const photoUrl = getAssetUrl(student.photo);

  return (
    <View style={styles.studentCard}>
      <View style={styles.studentAvatar}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.studentPhoto} />
        ) : (
          <View style={styles.studentPhotoPlaceholder}>
            <Text style={styles.studentInitials}>
              {student.first_name?.[0]?.toUpperCase() || ''}
              {student.last_name?.[0]?.toUpperCase() || ''}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {student.first_name} {student.last_name}
        </Text>
        {(student.current_grade || student.current_section) && (
          <Text style={styles.studentGrade}>
            {student.current_grade}
            {student.current_section ? ` - ${student.current_section}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

interface StatusMessageProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  message: string;
  actionButton?: React.ReactNode;
}

function StatusMessage({ icon, iconColor, title, message, actionButton }: StatusMessageProps) {
  return (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={48} color={iconColor} />
      </View>
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.statusMessage}>{message}</Text>
      {actionButton}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function InvitationScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const invitationToken = typeof token === 'string' ? token : '';

  const { isAuthenticated, user } = useAuth();
  const {
    invitation,
    isLoading,
    error,
    isValid,
    isExpired,
    isAccepted,
  } = useInvitation(invitationToken);

  const {
    acceptInvitation,
    isLoading: isAccepting,
    error: acceptError,
  } = useAcceptInvitation();

  const handleAcceptInvitation = async () => {
    if (!invitationToken) return;

    try {
      await acceptInvitation({ token: invitationToken });
      // Navegar a pantalla de exito con los datos
      router.replace({
        pathname: '/invitation-success',
        params: {
          institutionName: invitation?.institution_name || '',
          studentsCount: String(invitation?.students?.length || 0),
        },
      });
    } catch (err) {
      // El error se maneja en el estado del hook
      console.error('Error accepting invitation:', err);
    }
  };

  const handleGoToLogin = () => {
    // Guardar el deep link pendiente para despues del login
    router.push('/');
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // =============================================================================
  // RENDER STATES
  // =============================================================================

  // Sin token
  if (!invitationToken) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusMessage
          icon="alert-circle-outline"
          iconColor={COLORS.error}
          title="Invitacion Invalida"
          message="No se proporciono un token de invitacion valido."
          actionButton={
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando invitacion...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusMessage
          icon="alert-circle-outline"
          iconColor={COLORS.error}
          title="Error"
          message={error instanceof Error ? error.message : 'Error al cargar la invitacion'}
          actionButton={
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  // Invitacion expirada
  if (isExpired) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusMessage
          icon="time-outline"
          iconColor={COLORS.warning}
          title="Invitacion Expirada"
          message="Esta invitacion ya no es valida. Por favor solicita una nueva invitacion a la escuela."
          actionButton={
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  // Invitacion ya aceptada
  if (isAccepted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusMessage
          icon="checkmark-circle-outline"
          iconColor={COLORS.success}
          title="Invitacion Aceptada"
          message="Esta invitacion ya fue aceptada. Los estudiantes ya estan vinculados a tu cuenta."
          actionButton={
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Text style={styles.primaryButtonText}>Ir al Inicio</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  // No hay datos de invitacion
  if (!invitation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusMessage
          icon="document-outline"
          iconColor={COLORS.gray}
          title="Invitacion no encontrada"
          message="No pudimos encontrar los datos de esta invitacion."
          actionButton={
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  // =============================================================================
  // RENDER INVITACION VALIDA
  // =============================================================================

  const logoUrl = getAssetUrl(invitation.institution_logo);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con logo de la escuela */}
        <View style={styles.header}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.schoolLogo} resizeMode="contain" />
          ) : (
            <View style={styles.schoolLogoPlaceholder}>
              <MaterialCommunityIcons name="school" size={48} color={COLORS.primary} />
            </View>
          )}
          <Text style={styles.invitationLabel}>Has sido invitado a</Text>
          <Text style={styles.schoolName}>{invitation.institution_name}</Text>
        </View>

        {/* Mensaje de bienvenida */}
        <View style={styles.welcomeCard}>
          <Ionicons name="mail-open-outline" size={32} color={COLORS.primary} />
          <Text style={styles.welcomeTitle}>
            {invitation.invited_name
              ? `Hola ${invitation.invited_name}!`
              : 'Hola!'}
          </Text>
          <Text style={styles.welcomeMessage}>
            La escuela te ha invitado a conectarte con los siguientes estudiantes
            a traves de la aplicacion Kairos.
          </Text>
        </View>

        {/* Lista de estudiantes */}
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>
            Estudiantes ({invitation.students.length})
          </Text>
          {invitation.students.map((student) => (
            <StudentCard key={student.name} student={student} />
          ))}
        </View>

        {/* Informacion adicional */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              Recibiras notificaciones sobre novedades y eventos escolares
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              Podras comunicarte directamente con la escuela
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>
              Accederas a la agenda y actividades escolares
            </Text>
          </View>
        </View>

        {/* Error de aceptacion */}
        {acceptError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>
              {acceptError instanceof Error ? acceptError.message : 'Error al aceptar la invitacion'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer con botones */}
      <View style={styles.footer}>
        {isAuthenticated ? (
          <TouchableOpacity
            style={[styles.primaryButton, isAccepting && styles.buttonDisabled]}
            onPress={handleAcceptInvitation}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Aceptar Invitacion</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.loginHint}>
              Debes iniciar sesion para aceptar esta invitacion
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToLogin}>
              <Ionicons name="log-in-outline" size={24} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Iniciar Sesion para Aceptar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.xxxl,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
  },

  // Status messages
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.lg,
  },
  statusIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  statusTitle: {
    fontSize: FONT_SIZES['5xl'],
    fontWeight: '700',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: FONT_SIZES['6xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  schoolLogo: {
    width: 80,
    height: 80,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
  },
  schoolLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDERS.radius.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  invitationLabel: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  schoolName: {
    fontSize: FONT_SIZES['6xl'],
    fontWeight: '700',
    color: COLORS.darkGray,
    textAlign: 'center',
  },

  // Welcome card
  welcomeCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  welcomeMessage: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: FONT_SIZES['6xl'],
  },

  // Students section
  studentsSection: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
  },

  // Student card
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  studentAvatar: {
    marginRight: SPACING.lg,
  },
  studentPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  studentPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitials: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.primary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  studentGrade: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray,
  },

  // Info section
  infoSection: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray600,
    lineHeight: FONT_SIZES['5xl'],
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
  },

  // Footer
  footer: {
    padding: SPACING.screenPadding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  loginHint: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radius.full,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
