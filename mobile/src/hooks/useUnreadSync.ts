import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnreadCounts } from '../context/UIContext';
import { useAnnouncements, useEvents, useConversations, usePickupRequests, useReports } from '../api/hooks';
import { getAllReadIds } from '../services/readStatusService';

/**
 * Hook that syncs unread counts whenever data changes.
 * Should be used once at the app level (e.g., in TabNavigator or App).
 * Optimized to fetch all read IDs in a single API call.
 */
export function useUnreadSync() {
  const { setUnreadCounts } = useUnreadCounts();
  const { user } = useAuth();

  // Get data from all hooks
  const { data: announcements } = useAnnouncements();
  const { data: events } = useEvents();
  const { data: conversations } = useConversations();
  const { data: cambios } = usePickupRequests();
  const { data: boletines } = useReports();

  // Debounce ref to avoid multiple rapid updates
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update unread counts when data changes
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the update by 100ms to batch rapid changes
    timeoutRef.current = setTimeout(async () => {
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

      // Fetch all read IDs in ONE API call
      const allReadIds = await getAllReadIds(user.id);

      // Announcements - use cached read IDs
      const novedadesCount = announcements
        ? announcements.filter(a => !allReadIds.announcements.has(a.id)).length
        : 0;

      // Events - use cached read IDs
      const eventosCount = events
        ? events.filter(e => !allReadIds.events.has(e.id)).length
        : 0;

      // Mensajes - sum unread counts across conversations
      const mensajesCount = conversations
        ? conversations.reduce((total, convo) => total + (convo.unreadCount || 0), 0)
        : 0;

      // Cambios (pickup requests) - show pending ones as "unread"
      const cambiosCount = cambios
        ? cambios.filter(c => c.status === 'pending').length
        : 0;

      // Boletines - use cached read IDs
      const boletinesCount = boletines
        ? boletines.filter(b => !allReadIds.boletines.has(b.id)).length
        : 0;

      setUnreadCounts({
        novedades: novedadesCount,
        eventos: eventosCount,
        mensajes: mensajesCount,
        cambios: cambiosCount,
        boletines: boletinesCount,
      });
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [announcements, events, conversations, cambios, boletines, setUnreadCounts, user]);
}
