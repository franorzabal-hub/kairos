import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, BORDERS, FONT_SIZES } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rate limiting state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockout, setRemainingLockout] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if currently locked out
  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;
  const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts;

  // Effect to update lockout countdown timer
  useEffect(() => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      // Update remaining time immediately
      setRemainingLockout(Math.ceil((lockoutUntil - Date.now()) / 1000));

      // Start countdown interval
      timerRef.current = setInterval(() => {
        const remaining = lockoutUntil - Date.now();
        if (remaining <= 0) {
          // Lockout expired - reset state
          setLockoutUntil(null);
          setRemainingLockout(0);
          setLoginAttempts(0);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } else {
          setRemainingLockout(Math.ceil(remaining / 1000));
        }
      }, 1000);
    }

    // Cleanup interval on unmount or when lockoutUntil changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lockoutUntil]);

  const handleLogin = async () => {
    // Check if locked out
    if (isLockedOut) {
      setError(`Demasiados intentos. Espera ${remainingLockout} segundos.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      // Reset attempts on successful login
      setLoginAttempts(0);
      setLockoutUntil(null);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.';

      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock out user
        const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockoutTime);
        setError(`Demasiados intentos fallidos. Bloqueado por 30 segundos.`);
      } else {
        const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;
        setError(
          `${errorMessage}\n` +
          `Intentos restantes: ${attemptsLeft}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🏫</Text>
            <Text style={styles.logoText}>Kairos</Text>
            <Text style={styles.subtitle}>Comunicación Escolar</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, isLockedOut && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !isLockedOut}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, isLockedOut && styles.inputDisabled]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={true}
              editable={!loading && !isLockedOut}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Lockout countdown display */}
            {isLockedOut && (
              <View style={styles.lockoutContainer}>
                <Text style={styles.lockoutText}>
                  Cuenta bloqueada temporalmente
                </Text>
                <Text style={styles.lockoutTimer}>
                  Intenta de nuevo en {remainingLockout}s
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton,
                (loading || isLockedOut) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading || isLockedOut}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : isLockedOut ? (
                <Text style={styles.loginButtonText}>
                  Bloqueado ({remainingLockout}s)
                </Text>
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tenés cuenta? Contacta a tu institución
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl + SPACING.lg,
  },
  logoIcon: {
    fontSize: FONT_SIZES['10xl'],
    marginBottom: SPACING.sm,
  },
  logoText: {
    fontSize: FONT_SIZES['9xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radius.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.listItemPadding,
    fontSize: FONT_SIZES['2xl'],
    backgroundColor: COLORS.lightGray,
  },
  inputDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.xxl + BORDERS.radius.sm + BORDERS.radius.sm,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
  },
  lockoutContainer: {
    backgroundColor: COLORS.error + '15',
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  lockoutText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  lockoutTimer: {
    color: COLORS.error,
    fontSize: FONT_SIZES['5xl'],
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.lg,
  },
});
