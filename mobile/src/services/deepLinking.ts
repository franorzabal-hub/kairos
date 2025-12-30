import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const PENDING_DEEP_LINK_KEY = 'pending_deep_link';

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
    console.error('Error parsing deep link:', error);
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
    console.error('Error saving pending deep link:', error);
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
    console.error('Error consuming pending deep link:', error);
    return null;
  }
}

/**
 * Handle navigation from a deep link URL
 */
export function navigateFromDeepLink(url: string): boolean {
  const path = parseDeepLink(url);
  if (!path) return false;

  try {
    // Map deep link paths to app routes
    // Deep links come as /novedades/123 but app routes are in (tabs)
    if (path.startsWith('/novedades')) {
      const id = path.split('/')[2];
      if (id) {
        router.push({ pathname: '/novedades/[id]', params: { id } });
      } else {
        router.push('/novedades');
      }
      return true;
    }

    if (path.startsWith('/eventos')) {
      const id = path.split('/')[2];
      if (id) {
        router.push({ pathname: '/eventos/[id]', params: { id } });
      } else {
        router.push('/eventos');
      }
      return true;
    }

    if (path.startsWith('/mensajes')) {
      const id = path.split('/')[2];
      if (id) {
        router.push({ pathname: '/mensajes/[id]', params: { id } });
      } else {
        router.push('/mensajes');
      }
      return true;
    }

    // For unknown paths, try to navigate directly
    router.push(path as any);
    return true;
  } catch (error) {
    console.error('Error navigating from deep link:', error);
    return false;
  }
}
