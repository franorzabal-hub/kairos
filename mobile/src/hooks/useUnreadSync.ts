import { useEffect } from 'react';
import { useUnreadCounts, useAuth } from '../context/AppContext';
import { useAnnouncements, useEvents, useMessages, usePickupRequests, useReports, MessageWithReadStatus } from '../api/hooks';
import { countUnread } from '../services/readStatusService';

/**
 * Hook that syncs unread counts whenever data changes.
 * Should be used once at the app level (e.g., in TabNavigator or App).
 */
export function useUnreadSync() {
  const { setUnreadCounts } = useUnreadCounts();
  const { user } = useAuth();

  // Get data from all hooks
  const { data: announcements } = useAnnouncements();
  const { data: events } = useEvents();
  const { data: messages } = useMessages();
  const { data: cambios } = usePickupRequests();
  const { data: boletines } = useReports();

  // Update unread counts when data changes
  useEffect(() => {
    const updateCounts = async () => {
      // Skip if no user (not logged in)
      if (!user?.id) {
        setUnreadCounts({
          novedades: 0,
          eventos: 0,
          mensajes: 0,
          cambios: 0,
          boletines: 0,
        });
        return;
      }

      // Announcements - use database tracking
      const novedadesCount = announcements
        ? await countUnread('announcements', announcements.map(a => a.id), user.id)
        : 0;

      // Events - use database tracking
      const eventosCount = events
        ? await countUnread('events', events.map(e => e.id), user.id)
        : 0;

      // Messages - use read_at field from API
      const mensajesCount = messages
        ? (messages as MessageWithReadStatus[]).filter(m => !m.read_at).length
        : 0;

      // Cambios (pickup requests) - show pending ones as "unread"
      const cambiosCount = cambios
        ? cambios.filter(c => c.status === 'pending').length
        : 0;

      // Boletines - use database tracking
      const boletinesCount = boletines
        ? await countUnread('boletines', boletines.map(b => b.id), user.id)
        : 0;

      setUnreadCounts({
        novedades: novedadesCount,
        eventos: eventosCount,
        mensajes: mensajesCount,
        cambios: cambiosCount,
        boletines: boletinesCount,
      });
    };

    updateCounts();
  }, [announcements, events, messages, cambios, boletines, setUnreadCounts, user?.id]);
}
