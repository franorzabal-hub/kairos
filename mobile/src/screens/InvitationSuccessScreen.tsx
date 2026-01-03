/**
 * InvitationSuccessScreen - Pantalla de confirmacion de invitacion aceptada
 *
 * Esta pantalla se muestra despues de que el usuario acepta una invitacion
 * exitosamente. Muestra:
 * - Mensaje de exito
 * - Nombre de la escuela
 * - Cantidad de estudiantes vinculados
 * - Boton para ir al Home
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, SPACING, BORDERS, FONT_SIZES, SHADOWS } from '../theme';

export default function InvitationSuccessScreen() {
  const router = useRouter();
  const { institutionName, studentsCount } = useLocalSearchParams<{
    institutionName?: string;
    studentsCount?: string;
  }>();

  const schoolName = institutionName || 'la escuela';
  const numStudents = parseInt(studentsCount || '0', 10);

  // Animaciones
  const checkmarkScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const confettiScale = useSharedValue(0);

  useEffect(() => {
    // Animacion secuencial de entrada
    checkmarkScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    contentTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));
    confettiScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      )
    );
  }, []);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
  }));

  const handleGoToHome = () => {
    router.replace('/(tabs)/inicio');
  };

  const handleGoToChildren = () => {
    router.replace('/(tabs)/mishijos');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icono de exito animado */}
        <View style={styles.successIconWrapper}>
          {/* Confetti decorativo */}
          <Animated.View style={[styles.confettiContainer, confettiStyle]}>
            <View style={[styles.confetti, styles.confetti1]} />
            <View style={[styles.confetti, styles.confetti2]} />
            <View style={[styles.confetti, styles.confetti3]} />
            <View style={[styles.confetti, styles.confetti4]} />
          </Animated.View>

          <Animated.View style={[styles.successIconContainer, checkmarkStyle]}>
            <Ionicons name="checkmark-circle" size={96} color={COLORS.success} />
          </Animated.View>
        </View>

        {/* Contenido principal */}
        <Animated.View style={[styles.content, contentStyle]}>
          <Text style={styles.title}>Invitacion Aceptada!</Text>
          <Text style={styles.subtitle}>
            Te has vinculado exitosamente con {schoolName}
          </Text>

          {/* Card con resumen */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="people" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryTitle}>
              {numStudents > 0
                ? `${numStudents} estudiante${numStudents > 1 ? 's' : ''} vinculado${numStudents > 1 ? 's' : ''}`
                : 'Estudiantes vinculados'}
            </Text>
            <Text style={styles.summaryDescription}>
              Ahora puedes recibir novedades, mensajes y estar al tanto de todas
              las actividades escolares de tus hijos.
            </Text>
          </View>

          {/* Que puedes hacer ahora */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Ahora puedes:</Text>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="notifications" size={24} color={COLORS.info} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Recibir Notificaciones</Text>
                <Text style={styles.featureDescription}>
                  Enterate de novedades y comunicados importantes
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="chatbubbles" size={24} color={COLORS.success} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Comunicarte con la Escuela</Text>
                <Text style={styles.featureDescription}>
                  Envia mensajes directamente a profesores y administrativos
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="calendar" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Ver la Agenda Escolar</Text>
                <Text style={styles.featureDescription}>
                  Consulta eventos, reuniones y actividades programadas
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer con botones */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoToChildren}
        >
          <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Ver Mis Hijos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleGoToHome}>
          <Ionicons name="home-outline" size={22} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Ir al Inicio</Text>
        </TouchableOpacity>
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
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },

  // Success icon
  successIconWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Confetti decorativo
  confettiContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  confetti1: {
    backgroundColor: COLORS.primary,
    top: 10,
    left: 30,
  },
  confetti2: {
    backgroundColor: COLORS.warning,
    top: 20,
    right: 20,
  },
  confetti3: {
    backgroundColor: COLORS.info,
    bottom: 30,
    left: 15,
  },
  confetti4: {
    backgroundColor: COLORS.success,
    bottom: 20,
    right: 30,
  },

  // Content
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES['7xl'],
    fontWeight: '700',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },

  // Summary card
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  summaryTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  summaryDescription: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: FONT_SIZES['6xl'],
  },

  // Features section
  featuresSection: {
    width: '100%',
  },
  featuresTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDERS.radius.lg,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray,
    lineHeight: FONT_SIZES['5xl'],
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: SPACING.screenPadding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radius.full,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.full,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
});
