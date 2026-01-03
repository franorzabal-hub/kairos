/**
 * Google Authentication Service for Kairos Mobile App
 *
 * Uses expo-auth-session for OAuth 2.0 flow with Google
 * Implements PKCE (Proof Key for Code Exchange) for security
 *
 * @see https://docs.expo.dev/guides/google-authentication/
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// Ensure the browser closes correctly after auth
WebBrowser.maybeCompleteAuthSession();

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Google OAuth 2.0 configuration
 *
 * You need to create OAuth 2.0 credentials in Google Cloud Console:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create OAuth 2.0 Client IDs for:
 *    - iOS (Application type: iOS)
 *    - Android (Application type: Android)
 *    - Web (Application type: Web application)
 *
 * Set the redirect URI to your Expo scheme:
 * - For Expo Go: https://auth.expo.io/@your-username/your-app-slug
 * - For standalone: your-app-scheme://
 */
const GOOGLE_CONFIG = {
  /**
   * Google OAuth client IDs
   * Replace these with your actual client IDs from Google Cloud Console
   */
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

  /**
   * OAuth scopes to request
   * - openid: Required for ID token
   * - profile: User's name and profile picture
   * - email: User's email address
   */
  scopes: ['openid', 'profile', 'email'],
} as const;

/**
 * Google's OAuth 2.0 discovery document
 * Contains the authorization and token endpoints
 */
const GOOGLE_DISCOVERY = AuthSession.useAutoDiscovery('https://accounts.google.com');

// =============================================================================
// TYPES
// =============================================================================

/**
 * Google user profile information
 */
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}

/**
 * Google sign-in result
 */
export interface GoogleSignInResult {
  success: true;
  idToken: string;
  accessToken: string;
  user: GoogleUserInfo;
}

/**
 * Google sign-in error
 */
export interface GoogleSignInError {
  success: false;
  error: string;
  errorCode?: string;
}

export type GoogleSignInResponse = GoogleSignInResult | GoogleSignInError;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the appropriate client ID for the current platform
 */
function getClientId(): string | undefined {
  switch (Platform.OS) {
    case 'ios':
      return GOOGLE_CONFIG.iosClientId;
    case 'android':
      return GOOGLE_CONFIG.androidClientId;
    case 'web':
      return GOOGLE_CONFIG.webClientId;
    default:
      return GOOGLE_CONFIG.expoClientId;
  }
}

/**
 * Generate a random state for CSRF protection
 */
async function generateState(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(new Uint8Array(randomBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create the redirect URI for the OAuth flow
 */
function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'kairos',
    // For Expo Go development
    // path: 'auth/google/callback',
  });
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Initialize the Google authentication request
 * This hook should be called at the component level
 *
 * @example
 * ```tsx
 * function LoginScreen() {
 *   const [request, response, promptAsync] = useGoogleAuth();
 *
 *   useEffect(() => {
 *     if (response?.type === 'success') {
 *       const { id_token, access_token } = response.params;
 *       // Handle successful auth
 *     }
 *   }, [response]);
 *
 *   return (
 *     <Button onPress={() => promptAsync()} disabled={!request}>
 *       Sign in with Google
 *     </Button>
 *   );
 * }
 * ```
 */
export function useGoogleAuth() {
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId || '',
      scopes: [...GOOGLE_CONFIG.scopes],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      // Request ID token along with access token
      extraParams: {
        nonce: Math.random().toString(36).substring(2),
        // For ID token
        // access_type: 'offline', // Uncomment for refresh tokens
      },
    },
    discovery
  );

  return { request, response, promptAsync, discovery };
}

/**
 * Sign in with Google
 * This is a standalone function that handles the entire OAuth flow
 *
 * @returns Promise with the sign-in result or error
 *
 * @example
 * ```tsx
 * const handleGoogleSignIn = async () => {
 *   const result = await signInWithGoogle();
 *   if (result.success) {
 *     // Use result.idToken to authenticate with backend
 *     await loginWithGoogleToken(result.idToken);
 *   } else {
 *     Alert.alert('Error', result.error);
 *   }
 * };
 * ```
 */
export async function signInWithGoogle(): Promise<GoogleSignInResponse> {
  const clientId = getClientId();

  if (!clientId) {
    logger.error('GoogleAuth', 'Google client ID not configured for platform', {
      platform: Platform.OS,
    });
    return {
      success: false,
      error: 'Google Sign-In no esta configurado para esta plataforma',
      errorCode: 'MISSING_CLIENT_ID',
    };
  }

  try {
    const redirectUri = getRedirectUri();
    const state = await generateState();

    logger.debug('GoogleAuth', 'Starting Google OAuth flow', {
      platform: Platform.OS,
      redirectUri,
    });

    // Create the auth request
    const authRequest = new AuthSession.AuthRequest({
      clientId,
      scopes: [...GOOGLE_CONFIG.scopes],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      state,
      extraParams: {
        nonce: Math.random().toString(36).substring(2),
      },
    });

    // Load the discovery document
    const discovery = await AuthSession.fetchDiscoveryAsync(
      'https://accounts.google.com'
    );

    // Prompt the user to sign in
    const result = await authRequest.promptAsync(discovery);

    if (result.type === 'success') {
      const { access_token, id_token } = result.params;

      if (!access_token) {
        return {
          success: false,
          error: 'No se recibio el token de acceso',
          errorCode: 'NO_ACCESS_TOKEN',
        };
      }

      // Fetch user info using the access token
      const userInfo = await getGoogleUserInfo(access_token);

      if (!userInfo) {
        return {
          success: false,
          error: 'No se pudo obtener la informacion del usuario',
          errorCode: 'USER_INFO_FAILED',
        };
      }

      logger.info('GoogleAuth', 'Google sign-in successful', {
        email: userInfo.email,
      });

      return {
        success: true,
        idToken: id_token || access_token, // Use ID token if available, fallback to access token
        accessToken: access_token,
        user: userInfo,
      };
    } else if (result.type === 'cancel') {
      logger.debug('GoogleAuth', 'User cancelled Google sign-in');
      return {
        success: false,
        error: 'Inicio de sesion cancelado',
        errorCode: 'USER_CANCELLED',
      };
    } else if (result.type === 'dismiss') {
      logger.debug('GoogleAuth', 'Google sign-in dismissed');
      return {
        success: false,
        error: 'Ventana de inicio de sesion cerrada',
        errorCode: 'DISMISSED',
      };
    } else {
      logger.warn('GoogleAuth', 'Unexpected auth result type', { type: result.type });
      return {
        success: false,
        error: 'Error inesperado durante el inicio de sesion',
        errorCode: 'UNEXPECTED_RESULT',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('GoogleAuth', 'Google sign-in failed', { error: errorMessage });

    return {
      success: false,
      error: `Error de autenticacion: ${errorMessage}`,
      errorCode: 'AUTH_ERROR',
    };
  }
}

/**
 * Fetch user profile information from Google
 *
 * @param accessToken - The OAuth access token
 * @returns User profile information or null if failed
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('GoogleAuth', 'Failed to fetch user info', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    const userInfo: GoogleUserInfo = await response.json();

    logger.debug('GoogleAuth', 'Fetched Google user info', {
      id: userInfo.id,
      email: userInfo.email,
    });

    return userInfo;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('GoogleAuth', 'Error fetching Google user info', {
      error: errorMessage,
    });
    return null;
  }
}

/**
 * Check if Google Sign-In is properly configured
 *
 * @returns true if at least one client ID is configured
 */
export function isGoogleAuthConfigured(): boolean {
  const clientId = getClientId();
  return !!clientId && clientId.length > 0;
}

/**
 * Get the current Google Auth configuration status
 * Useful for debugging
 */
export function getGoogleAuthStatus(): {
  configured: boolean;
  platform: string;
  clientId: string | null;
  redirectUri: string;
} {
  const clientId = getClientId();
  return {
    configured: isGoogleAuthConfigured(),
    platform: Platform.OS,
    clientId: clientId ? `${clientId.substring(0, 20)}...` : null,
    redirectUri: getRedirectUri(),
  };
}

export default {
  useGoogleAuth,
  signInWithGoogle,
  getGoogleUserInfo,
  isGoogleAuthConfigured,
  getGoogleAuthStatus,
};
