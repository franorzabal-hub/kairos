import { useEffect } from 'react';
import { useUnreadCounts } from '../context/AppContext';
import { useAnnouncements, useEvents, useMessages, usePickupRequests, useReports, MessageWithReadStatus } from '../api/hooks';
import { countUnread } from '../services/readStatusService';

/**
 * Hook that syncs unread counts whenever data changes.
 * Should be used once at the app level (e.g., in TabNavigator or App).
 */
export function useUnreadSync() {
  const { setUnreadCounts } = useUnreadCounts();

  // Get data from all hooks
  const { data: announcements } = useAnnouncements();
  const { data: events } = useEvents();
  const { data: messages } = useMessages();
  const { data: cambios } = usePickupRequests();
  const { data: boletines } = useReports();

  // Update unread counts when data changes
  useEffect(() => {
    const updateCounts = async () => {
      // Announcements - use AsyncStorage tracking
      const novedadesCount = announcements
        ? await countUnread('announcements', announcements.map(a => a.id))
        : 0;

      // Events - use AsyncStorage tracking
      const eventosCount = events
        ? await countUnread('events', events.map(e => e.id))
        : 0;

      // Messages - use read_at field from API
      const mensajesCount = messages
        ? (messages as MessageWithReadStatus[]).filter(m => !m.read_at).length
        : 0;

      // Cambios (pickup requests) - show pending ones as "unread"
      const cambiosCount = cambios
        ? cambios.filter(c => c.status === 'pending').length
        : 0;

      // Boletines - use AsyncStorage tracking
      const boletinesCount = boletines
        ? await countUnread('boletines', boletines.map(b => b.id))
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
  }, [announcements, events, messages, cambios, boletines, setUnreadCounts]);
}
