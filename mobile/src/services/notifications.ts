import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getDocList, createDoc, updateDoc, PushToken } from '../api/frappe';
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

export interface PushTokenData {
  name?: string;
  user: string;
  token: string;
  platform: 'iOS' | 'Android';
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
    logger.error('Failed to get push token', error);
    return null;
  }
}

/**
 * Save push token to Frappe backend
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';

    // Check if token already exists for this user
    const existingTokens = await getDocList<PushToken>('Push Token', {
      filters: [
        ['user', '=', userId],
        ['platform', '=', platform],
      ],
    });

    if (existingTokens.length > 0) {
      // Update existing token
      await updateDoc<PushToken>('Push Token', existingTokens[0].name, {
        token,
      });
    } else {
      // Create new token record
      await createDoc<PushToken>('Push Token', {
        user: userId,
        token,
        platform,
      });
    }
  } catch (error) {
    // Push Token DocType might not exist yet - that's okay
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
