import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '../services/notifications';

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Only register if authenticated
    if (!isAuthenticated || !user?.id) return;

    // Register for push notifications
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(user.id, token);
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current = addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user?.id]);

  const handleNotificationNavigation = (data: Record<string, unknown>) => {
    // Navigate based on notification type
    const type = data?.type as string;
    const id = data?.id as string;

    switch (type) {
      case 'announcement':
        router.push(id ? `/novedades/${id}` : '/novedades');
        break;
      case 'event':
        router.push(id ? `/eventos/${id}` : '/eventos');
        break;
      case 'message':
        router.push(id ? `/mensajes/${id}` : '/mensajes');
        break;
      case 'pickup_request':
        router.push('/cambios');
        break;
      case 'report':
        router.push('/boletines');
        break;
      default:
        // Default to home/novedades
        router.push('/novedades');
    }
  };

  return {
    expoPushToken,
    notification,
  };
}
