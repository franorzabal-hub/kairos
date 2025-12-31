import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { logger } from '../utils/logger';

const PENDING_DEEP_LINK_KEY = 'pending_deep_link';

/**
 * Whitelist of allowed deep link routes to prevent path traversal attacks
 */
const ALLOWED_ROUTES = ['novedades', 'agenda', 'mensajes', 'mishijos', 'settings', 'eventos'] as const;
type AllowedRoute = typeof ALLOWED_ROUTES[number];

/**
 * Sanitize a path by removing path traversal attempts and normalizing
 */
function sanitizePath(path: string): string | null {
  // Remove query parameters and fragments for route validation
  const cleanPath = path.split('?')[0].split('#')[0];

  // Remove path traversal attempts (../, ..\, encoded variants)
  const sanitized = cleanPath
    .replace(/\.\./g, '')
    .replace(/%2e%2e/gi, '')
    .replace(/%252e%252e/gi, '')
    .replace(/\\/g, '/');

  // Normalize multiple slashes to single slash
  const normalized = sanitized.replace(/\/+/g, '/');

  // Ensure path starts with /
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

/**
 * Check if a path starts with an allowed route
 */
function isAllowedRoute(path: string): boolean {
  const sanitized = sanitizePath(path);
  if (!sanitized) return false;

  // Get the first segment of the path (e.g., /novedades/123 -> novedades)
  const segments = sanitized.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  const firstSegment = segments[0].toLowerCase();
  return ALLOWED_ROUTES.includes(firstSegment as AllowedRoute);
}

/**
 * Parse a deep link URL and return the route path
 */
export function parseDeepLink(url: string): string | null {
  try {
    const parsed = Linking.parse(url);

    // Handle paths for our app
    // kairos://novedades/123 -> /novedades/123
    // https://kairos.app/novedades/123 -> /novedades/123
    if (parsed.path) {
      return `/${parsed.path}`;
    }

    return null;
  } catch (error) {
    logger.error('Failed to parse deep link', error);
    return null;
  }
}

/**
 * Save a pending deep link for navigation after login
 */
export async function savePendingDeepLink(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, url);
  } catch (error) {
    // Log but don't throw - failing to save pending deep link is non-critical
    logger.warn('Failed to save pending deep link', error);
  }
}

/**
 * Get and clear any pending deep link
 */
export async function consumePendingDeepLink(): Promise<string | null> {
  try {
    const url = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
    if (url) {
      await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
    }
    return url;
  } catch (error) {
    logger.warn('Failed to consume pending deep link', error);
    return null;
  }
}

/**
 * Handle navigation from a deep link URL
 * Validates and sanitizes the path before navigation to prevent security issues
 */
export function navigateFromDeepLink(url: string): boolean {
  const path = parseDeepLink(url);
  if (!path) return false;

  // Validate against whitelist to prevent path traversal attacks
  if (!isAllowedRoute(path)) {
    logger.warn('Deep link blocked: path not in allowed routes', { path });
    return false;
  }

  // Sanitize the path
  const sanitizedPath = sanitizePath(path);
  if (!sanitizedPath) {
    logger.warn('Deep link blocked: failed to sanitize path', { path });
    return false;
  }

  try {
    // Map deep link paths to app routes
    // Deep links come as /novedades/123 but app routes are in (tabs)
    if (sanitizedPath.startsWith('/novedades')) {
      const id = sanitizedPath.split('/')[2];
      if (id) {
        router.push({ pathname: '/novedades/[id]', params: { id } });
      } else {
        router.push('/novedades');
      }
      return true;
    }

    if (sanitizedPath.startsWith('/eventos')) {
      const id = sanitizedPath.split('/')[2];
      if (id) {
        router.push({ pathname: '/eventos/[id]', params: { id } });
      } else {
        router.push('/eventos');
      }
      return true;
    }

    if (sanitizedPath.startsWith('/mensajes')) {
      const id = sanitizedPath.split('/')[2];
      if (id) {
        router.push({ pathname: '/mensajes/[id]', params: { id } });
      } else {
        router.push('/mensajes');
      }
      return true;
    }

    if (sanitizedPath.startsWith('/agenda')) {
      router.push('/agenda');
      return true;
    }

    if (sanitizedPath.startsWith('/mishijos')) {
      router.push('/mishijos');
      return true;
    }

    if (sanitizedPath.startsWith('/settings')) {
      router.push('/settings');
      return true;
    }

    // Route is in whitelist but not explicitly handled above
    // This should not happen if ALLOWED_ROUTES and handlers are in sync
    logger.warn('Deep link: allowed route without explicit handler', { sanitizedPath });
    return false;
  } catch (error) {
    logger.error('Failed to navigate from deep link', error);
    return false;
  }
}
