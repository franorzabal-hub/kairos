import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  READ_ANNOUNCEMENTS: '@kairos:read_announcements',
  READ_EVENTS: '@kairos:read_events',
  READ_CAMBIOS: '@kairos:read_cambios',
  READ_BOLETINES: '@kairos:read_boletines',
};

export type ContentType = 'announcements' | 'events' | 'cambios' | 'boletines';

const getStorageKey = (type: ContentType): string => {
  const keyMap: Record<ContentType, string> = {
    announcements: STORAGE_KEYS.READ_ANNOUNCEMENTS,
    events: STORAGE_KEYS.READ_EVENTS,
    cambios: STORAGE_KEYS.READ_CAMBIOS,
    boletines: STORAGE_KEYS.READ_BOLETINES,
  };
  return keyMap[type];
};

/**
 * Get the set of read item IDs for a content type
 */
export async function getReadIds(type: ContentType): Promise<Set<string>> {
  try {
    const stored = await AsyncStorage.getItem(getStorageKey(type));
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error(`Error reading ${type} read status:`, error);
  }
  return new Set();
}

/**
 * Mark a single item as read
 */
export async function markAsRead(type: ContentType, id: string): Promise<void> {
  try {
    const readIds = await getReadIds(type);
    readIds.add(id);
    await AsyncStorage.setItem(getStorageKey(type), JSON.stringify([...readIds]));
  } catch (error) {
    console.error(`Error marking ${type} as read:`, error);
  }
}

/**
 * Mark multiple items as read
 */
export async function markMultipleAsRead(type: ContentType, ids: string[]): Promise<void> {
  try {
    const readIds = await getReadIds(type);
    ids.forEach(id => readIds.add(id));
    await AsyncStorage.setItem(getStorageKey(type), JSON.stringify([...readIds]));
  } catch (error) {
    console.error(`Error marking ${type} as read:`, error);
  }
}

/**
 * Check if an item has been read
 */
export async function isRead(type: ContentType, id: string): Promise<boolean> {
  const readIds = await getReadIds(type);
  return readIds.has(id);
}

/**
 * Count unread items from a list of IDs
 */
export async function countUnread(type: ContentType, allIds: string[]): Promise<number> {
  const readIds = await getReadIds(type);
  return allIds.filter(id => !readIds.has(id)).length;
}

/**
 * Get unread IDs from a list
 */
export async function getUnreadIds(type: ContentType, allIds: string[]): Promise<string[]> {
  const readIds = await getReadIds(type);
  return allIds.filter(id => !readIds.has(id));
}

/**
 * Clear all read status (e.g., on logout)
 */
export async function clearAllReadStatus(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.READ_ANNOUNCEMENTS,
      STORAGE_KEYS.READ_EVENTS,
      STORAGE_KEYS.READ_CAMBIOS,
      STORAGE_KEYS.READ_BOLETINES,
    ]);
  } catch (error) {
    console.error('Error clearing read status:', error);
  }
}
