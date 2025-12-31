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
import { useAuth } from '../context/AppContext';
import { COLORS, SPACING, BORDERS } from '../theme';

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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: COLORS.lightGray,
  },
  inputDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  lockoutContainer: {
    backgroundColor: COLORS.error + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  lockoutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockoutTimer: {
    color: COLORS.error,
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
});
