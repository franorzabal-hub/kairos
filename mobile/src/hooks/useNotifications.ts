import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AppContext';
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
  const navigation = useNavigation();

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
        navigation.navigate('Novedades' as never);
        break;
      case 'event':
        navigation.navigate('Eventos' as never);
        break;
      case 'message':
        navigation.navigate('Mensajes' as never);
        break;
      case 'pickup_request':
        navigation.navigate('Cambios' as never);
        break;
      case 'report':
        navigation.navigate('Boletines' as never);
        break;
      default:
        // Default to home/novedades
        navigation.navigate('Novedades' as never);
    }
  };

  return {
    expoPushToken,
    notification,
  };
}
