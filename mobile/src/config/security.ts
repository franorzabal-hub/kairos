/**
 * Security Configuration for Kairos Mobile App
 *
 * This file centralizes all security-related configuration including:
 * - Certificate pinning configuration (native level via expo-ssl-pinning)
 * - HTTPS enforcement
 * - Security headers
 * - Request validation
 *
 * IMPORTANT: Certificate pinning is handled at the native level by expo-ssl-pinning.
 * The configuration in app.json is injected at build time into iOS (URLSession) and
 * Android (OkHttp), providing protection for ALL network requests automatically.
 *
 * @see app.json for the expo-ssl-pinning plugin configuration
 * @see https://github.com/teincsolutions/expo-ssl-pinning
 */

import { Platform } from 'react-native';

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================

/**
 * API endpoint configuration
 * All API calls MUST use HTTPS - HTTP is never allowed
 */
export const API_CONFIG = {
  /**
   * The production Frappe API URL
   * This is the only allowed endpoint for API calls
   */
  FRAPPE_HOST: 'control.kairos.app',

  /**
   * Full HTTPS URL for the Frappe API
   * Used by the Frappe SDK client
   */
  FRAPPE_URL: 'https://control.kairos.app',

  /**
   * Allowed URL schemes
   * HTTPS only - no HTTP fallback
   */
  ALLOWED_SCHEMES: ['https'] as const,
} as const;

/**
 * Certificate Pinning Configuration
 *
 * IMPORTANT: These hashes are configured in app.json for expo-ssl-pinning.
 * They are documented here for reference and validation.
 *
 * Cloud Run uses Google-managed TLS certificates that rotate frequently.
 * We pin to the intermediate CA (WE2) which is more stable than the leaf certificate.
 *
 * Hash generation command:
 * ```bash
 * openssl s_client -connect HOST:443 -servername HOST -showcerts </dev/null 2>/dev/null | \
 * awk '/-----BEGIN CERTIFICATE-----/{n++} n==2{print; if(/-----END CERTIFICATE-----/) exit}' | \
 * openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | \
 * openssl dgst -sha256 -binary | base64
 * ```
 *
 * Certificate Chain for control.kairos.app:
 * 1. Leaf: *.a.run.app (rotates frequently - NOT pinned)
 * 2. Intermediate: Google Trust Services WE2 (pinned - primary)
 * 3. Root: GTS Root R4 (pinned - backup)
 */
export const CERTIFICATE_PINS = {
  /**
   * Google Trust Services WE2 intermediate CA
   * Issuer: GTS Root R4
   * Valid until: 2029-02-20
   */
  GTS_WE2_INTERMEDIATE: 'vh78KSg1Ry4NaqGDV10w/cTb9VH3BQUZoCWNa93W/EY=',

  /**
   * GTS Root R4 root CA (backup pin)
   * This provides fallback if Google rotates the intermediate CA
   */
  GTS_ROOT_R4: 'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=',

  /**
   * Last verified date
   * Re-verify periodically and before certificate rotation
   */
  LAST_VERIFIED: '2025-12-31',
} as const;

// =============================================================================
// SECURITY HEADERS
// =============================================================================

/**
 * Security headers to include with all API requests
 * These provide defense-in-depth alongside HTTPS
 *
 * Note: Custom headers are only added on native platforms.
 * On web, custom headers trigger CORS preflight requests, and if the server
 * doesn't explicitly allow them via Access-Control-Allow-Headers, the browser
 * blocks the entire request. Since our Frappe CORS config only allows
 * Content-Type and Authorization, we skip custom headers on web.
 */
export const SECURITY_HEADERS: Record<string, string> =
  Platform.OS === 'web'
    ? {}
    : {
        /**
         * Prevent MIME type sniffing
         */
        'X-Content-Type-Options': 'nosniff',

        /**
         * Custom header to identify requests from the mobile app
         * Can be used server-side for rate limiting or analytics
         */
        'X-Kairos-Client': 'mobile-app',

        /**
         * Platform identifier for debugging and analytics
         */
        'X-Kairos-Platform': Platform.OS,

        /**
         * Request ID header (placeholder - should be generated per request)
         * Helps with request tracing and debugging
         */
        // 'X-Request-ID': generateRequestId(), // Uncomment when implementing request tracing
      };

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates that a URL uses HTTPS
 * @param url - The URL to validate
 * @returns true if the URL uses HTTPS, false otherwise
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates that a URL points to our allowed API endpoint
 * @param url - The URL to validate
 * @returns true if the URL is our Frappe API, false otherwise
 */
export function isAllowedApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === API_CONFIG.FRAPPE_HOST
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL by ensuring it uses HTTPS
 * @param url - The URL to sanitize
 * @returns The URL with HTTPS, or null if invalid
 */
export function sanitizeApiUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Enforce HTTPS
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }

    // Only allow our API host
    if (parsed.hostname !== API_CONFIG.FRAPPE_HOST) {
      console.warn(
        `[Security] Blocked request to unauthorized host: ${parsed.hostname}`
      );
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

/**
 * Creates headers with security enhancements for API requests
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object with security headers merged
 */
export function createSecureHeaders(
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    ...additionalHeaders,
  };
}

/**
 * Generates a unique request ID for tracing
 * Format: timestamp-random
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Logs security-related events (in development only)
 * @param event - The security event type
 * @param details - Additional details about the event
 */
export function logSecurityEvent(
  event: 'blocked_request' | 'invalid_url' | 'certificate_check' | 'auth_failure',
  details?: Record<string, unknown>
): void {
  if (__DEV__) {
    console.warn(`[Security] ${event}`, details);
  }
  // In production, you could send this to a security monitoring service
}

// =============================================================================
// EXPO-SSL-PINNING INTEGRATION
// =============================================================================

/**
 * Note: expo-ssl-pinning works at the native layer automatically.
 * These utilities are for documentation and debugging purposes.
 */

/**
 * Checks if SSL pinning is available (native builds only)
 * In Expo Go, SSL pinning is not available
 */
export async function checkSslPinningStatus(): Promise<{
  available: boolean;
  reason?: string;
  pinnedHosts?: string[] | string;
}> {
  try {
    // expo-ssl-pinning exports the module as default
    const { default: ExpoSslPinning } = await import('expo-ssl-pinning');

    if (ExpoSslPinning && typeof ExpoSslPinning.isPinningEnabled === 'function') {
      const isEnabled = ExpoSslPinning.isPinningEnabled();
      const pinnedHosts = ExpoSslPinning.getPinnedHosts();
      return {
        available: isEnabled,
        reason: isEnabled ? 'Native SSL pinning active' : 'SSL pinning not enabled',
        pinnedHosts,
      };
    }

    return {
      available: false,
      reason: 'expo-ssl-pinning not properly initialized',
    };
  } catch (error) {
    // In Expo Go or if module not available
    return {
      available: false,
      reason:
        'expo-ssl-pinning not available (expected in Expo Go, requires native build)',
    };
  }
}

// =============================================================================
// SECURITY BEST PRACTICES DOCUMENTATION
// =============================================================================

/**
 * SECURITY IMPLEMENTATION NOTES
 * =============================
 *
 * 1. CERTIFICATE PINNING (expo-ssl-pinning)
 *    - Configured in app.json under expo.plugins
 *    - Pins are injected at build time into native code
 *    - iOS: URLSession delegate validates certificates
 *    - Android: OkHttp CertificatePinner validates certificates
 *    - All network requests (including Frappe SDK) are protected
 *
 * 2. HTTPS ENFORCEMENT
 *    - The Frappe URL is hardcoded to use HTTPS
 *    - The isSecureUrl() function validates URLs before use
 *    - No HTTP fallback is allowed
 *
 * 3. CERTIFICATE ROTATION STRATEGY
 *    - We pin to the intermediate CA (WE2), not the leaf certificate
 *    - Cloud Run rotates leaf certificates frequently
 *    - The intermediate CA is more stable (valid until 2029)
 *    - Backup pin to GTS Root R4 provides additional safety
 *
 * 4. LIMITATIONS
 *    - SSL pinning only works in native builds (EAS Build or prebuild)
 *    - Expo Go does not support SSL pinning
 *    - Web builds cannot implement true certificate pinning
 *    - Jailbroken/rooted devices can bypass pinning
 *
 * 5. MONITORING
 *    - Certificate expiration: Monitor WE2 expiry (2029-02-20)
 *    - Pin failures: Check app crash reports for SSL errors
 *    - Re-verify pins periodically using the openssl commands above
 *
 * 6. EMERGENCY RECOVERY
 *    If users are locked out due to certificate changes:
 *    1. Update the pins in app.json
 *    2. Release an app update through the app stores
 *    3. Consider using Expo Updates for OTA pin updates (if configured)
 */

export default {
  API_CONFIG,
  CERTIFICATE_PINS,
  SECURITY_HEADERS,
  isSecureUrl,
  isAllowedApiUrl,
  sanitizeApiUrl,
  createSecureHeaders,
  generateRequestId,
  logSecurityEvent,
  checkSslPinningStatus,
};
