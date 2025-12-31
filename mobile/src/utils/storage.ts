/**
 * Platform-agnostic secure storage wrapper
 *
 * Uses expo-secure-store on native (iOS/Android) and localStorage on web.
 * This solves the issue where expo-secure-store throws errors on web platform.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Check if we're running on web
 */
const isWeb = Platform.OS === 'web';

/**
 * Store a value securely
 * @param key - The key to store under
 * @param value - The value to store
 */
export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[storage] localStorage.setItem failed:', error);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

/**
 * Retrieve a stored value
 * @param key - The key to retrieve
 * @returns The stored value or null if not found
 */
export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[storage] localStorage.getItem failed:', error);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

/**
 * Delete a stored value
 * @param key - The key to delete
 */
export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[storage] localStorage.removeItem failed:', error);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// Export as default object for compatibility
export default {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
};
