/**
 * WebLoginScreen - Web-optimized login screen
 *
 * Features:
 * - Centered card layout for desktop
 * - Proper focus states on inputs
 * - Enter key to submit form
 * - Hover effects on button
 * - No SafeAreaView (web doesn't need it)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  PressableStateCallbackType,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useAuth } from '../../context/AppContext';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export default function WebLoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  // Handle Enter key press on form fields
  const handleKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter' && !loading) {
      handleLogin();
    }
  }, [handleLogin, loading]);

  const getInputStyle = (field: 'email' | 'password') => ({
    borderWidth: 1,
    borderColor: focusedField === field ? COLORS.primary : COLORS.border,
    borderRadius: BORDERS.radius.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: COLORS.lightGray,
    color: COLORS.darkGray,
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: focusedField === field ? `0 0 0 3px ${COLORS.primary}20` : 'none',
    } as any),
  });

  return (
    <View style={{
      flex: 1,
      backgroundColor: COLORS.lightGray,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.lg,
    }}>
      {/* Login Card */}
      <View style={{
        backgroundColor: COLORS.white,
        borderRadius: BORDERS.radius.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 420,
        ...(Platform.OS === 'web' && {
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        } as any),
      }}>
        {/* Logo */}
        <View style={{
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}>
          <Text style={{
            fontSize: 64,
            marginBottom: SPACING.sm,
          }}>
            🏫
          </Text>
          <Text style={{
            fontSize: 32,
            fontWeight: '700',
            color: COLORS.primary,
          }}>
            Kairos
          </Text>
          <Text style={{
            ...TYPOGRAPHY.body,
            color: COLORS.gray,
            marginTop: 4,
          }}>
            Comunicación Escolar
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: SPACING.md }}>
          {/* Email Field */}
          <View>
            <Text style={{
              ...TYPOGRAPHY.caption,
              fontWeight: '600',
              color: COLORS.gray,
              marginBottom: SPACING.xs,
            }}>
              Email
            </Text>
            <TextInput
              style={getInputStyle('email')}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              onKeyPress={handleKeyPress}
            />
          </View>

          {/* Password Field */}
          <View>
            <Text style={{
              ...TYPOGRAPHY.caption,
              fontWeight: '600',
              color: COLORS.gray,
              marginBottom: SPACING.xs,
            }}>
              Contraseña
            </Text>
            <TextInput
              style={getInputStyle('password')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={true}
              editable={!loading}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              onKeyPress={handleKeyPress}
            />
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={{
              ...TYPOGRAPHY.body,
              color: COLORS.error,
              textAlign: 'center',
            }}>
              {error}
            </Text>
          ) : null}

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={(state) => ({
              backgroundColor: loading ? COLORS.gray : COLORS.primary,
              paddingVertical: 16,
              borderRadius: BORDERS.radius.full,
              alignItems: 'center',
              marginTop: SPACING.sm,
              opacity: loading ? 0.7 : 1,
              ...(Platform.OS === 'web' && {
                cursor: loading ? 'not-allowed' : 'pointer',
                transform: !loading && (state as WebPressableState).hovered
                  ? [{ scale: 1.02 }]
                  : [],
                transition: 'transform 0.2s, opacity 0.2s',
              } as any),
            })}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={{
                color: COLORS.white,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Iniciar Sesión
              </Text>
            )}
          </Pressable>

          {/* Forgot Password Link */}
          <Pressable
            style={(state) => ({
              alignItems: 'center',
              paddingVertical: SPACING.sm,
              ...(Platform.OS === 'web' && {
                cursor: 'pointer',
                opacity: (state as WebPressableState).hovered ? 0.7 : 1,
              } as any),
            })}
          >
            <Text style={{
              ...TYPOGRAPHY.body,
              color: COLORS.primary,
            }}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={{
          alignItems: 'center',
          marginTop: SPACING.xl,
          paddingTop: SPACING.lg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}>
          <Text style={{
            ...TYPOGRAPHY.caption,
            color: COLORS.gray,
            textAlign: 'center',
          }}>
            ¿No tenés cuenta? Contacta a tu institución
          </Text>
        </View>
      </View>

      {/* Branding Footer */}
      <Text style={{
        ...TYPOGRAPHY.caption,
        color: COLORS.gray,
        marginTop: SPACING.xl,
      }}>
        © 2024 Kairos. Todos los derechos reservados.
      </Text>
    </View>
  );
}
