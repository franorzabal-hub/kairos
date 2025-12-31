import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { directus } from '../api/directus';
import { createItem, updateItem, readItems } from '@directus/sdk';
import { logger } from '../utils';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  id?: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  device_id?: string;
}

/**
 * Request notification permissions and get push token
 * Returns the Expo push token or null if failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Must be on physical device
  if (!Device.isDevice) {
    logger.info('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.info('Push notification permission not granted');
    return null;
  }

  // Get project ID for Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
                    Constants.easConfig?.projectId;

  if (!projectId) {
    logger.warn('Project ID not found. Configure eas.projectId in app.json');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B1538',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Save push token to Directus backend
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const platform = Platform.OS as 'ios' | 'android';

    // Check if token already exists for this user
    const existingTokens = await directus.request(
      readItems('push_tokens', {
        filter: {
          user_id: { _eq: userId },
          platform: { _eq: platform },
        },
      })
    );

    if (existingTokens.length > 0) {
      // Update existing token
      await directus.request(
        updateItem('push_tokens', existingTokens[0].id, {
          token,
          updated_at: new Date().toISOString(),
        })
      );
    } else {
      // Create new token record
      await directus.request(
        createItem('push_tokens', {
          user_id: userId,
          token,
          platform,
        })
      );
    }
  } catch (error) {
    // push_tokens collection might not exist yet - that's okay
    logger.warn('Could not save push token:', error);
  }
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Add notification received listener (when notification arrives)
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get the number of unread notifications (badge count)
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}
