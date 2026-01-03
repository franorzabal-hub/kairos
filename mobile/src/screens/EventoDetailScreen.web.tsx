/**
 * EventoDetailScreen.web.tsx - Web-optimized Event Detail
 *
 * Design Pattern: 2-Column Layout (Airbnb/Eventbrite style)
 * - Left column (2/3): Visual header, metadata, description
 * - Right column (1/3): Sticky action panel with context and CTAs
 *
 * Key improvements over mobile:
 * - Proper visual hierarchy for web viewports
 * - Action panel always visible (sticky)
 * - Button colors: Blue/Dark for positive actions (NOT red)
 * - Reduced banner height, pattern fallback instead of empty space
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Calendar from 'expo-calendar';
import { WebLayout } from '../components/web/WebLayout';
import MapPreview from '../components/MapPreview';
import RenderHtml from 'react-native-render-html';
import DirectusImage from '../components/DirectusImage';
import Toast from '../components/Toast';
import { useEvent } from '../api/hooks';
import { Location } from '../api/frappe';
import { useContentReadStatus } from '../api/hooks';
import { COLORS, SPACING, FONT_SIZES } from '../theme';
import { stripHtml } from '../utils';
import { useSession } from '../hooks';

// Decode HTML entities
const decodeHtmlEntities = (text: string) => {
  if (!text) return '';
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

const getLocationCoordinates = (location?: Location | null) => {
  if (!location?.custom_fields) return null;
  const fields = location.custom_fields as Record<string, unknown>;
  const latitude = Number(fields.lat ?? fields.latitude ?? fields.latitud);
  const longitude = Number(fields.lng ?? fields.longitude ?? fields.lon ?? fields.longitud);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

export default function EventoDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const eventId = typeof id === 'string' ? id : '';
  const { data: event } = useEvent(eventId);
  const { width } = useWindowDimensions();
  const { markAsRead } = useContentReadStatus('events');
  const { children } = useSession();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  // Determine if we're on a wide screen (desktop/tablet)
  const isWideScreen = width >= 1024;
  const contentWidth = isWideScreen ? Math.min(width - 320, 800) : width - 40;

  // Mark as read when viewing
  useEffect(() => {
    if (event) {
      markAsRead(event.id);
    }
  }, [event?.id, markAsRead]);

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const location = event && typeof event.location_id === 'object' ? (event.location_id as Location) : null;
  const locationName = location?.name || event?.location_external;
  const locationCoordinates = getLocationCoordinates(location);

  const handleOpenMap = async () => {
    if (!locationName) return;
    const encoded = encodeURIComponent(locationName);
    const url = `https://maps.google.com/?q=${encoded}`;
    await Linking.openURL(url);
  };

  const handleAddToCalendar = async () => {
    if (!event || isAddingToCalendar) return;
    try {
      setIsAddingToCalendar(true);
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        alert('Necesitamos permiso para guardar el evento en tu calendario.');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const targetCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];

      if (!targetCalendar) {
        alert('No se encontró un calendario disponible.');
        return;
      }

      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : startDate;
      const allDayEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59);

      await Calendar.createEventAsync(targetCalendar.id, {
        title: event.title,
        startDate,
        endDate: event.all_day ? allDayEnd : endDate,
        allDay: event.all_day,
        location: locationName || undefined,
        notes: event.description ? stripHtml(event.description) : undefined,
      });

      alert('Evento guardado en tu calendario.');
    } catch (error) {
      alert('No se pudo guardar el evento en tu calendario.');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    setShowToast(true);
    // TODO: API call to register confirmation
  };

  const handleDecline = () => {
    // TODO: API call to register decline
    alert('Has indicado que no podrás asistir.');
  };

  const isDeadlinePassed = event?.confirmation_deadline
    ? new Date(event.confirmation_deadline) < new Date()
    : false;

  // Get the first child for context (events are usually per-child)
  const primaryChild = children?.[0];

  if (!event) {
    return (
      <WebLayout
        title="Evento"
        breadcrumbs={[
          { label: 'Agenda', href: '/agenda' },
          { label: 'Cargando...' },
        ]}
      >
        <View className="flex-1 items-center justify-center py-8">
          <Text className="text-base text-gray-500">No se encontró el evento</Text>
        </View>
      </WebLayout>
    );
  }

  const isCancelled = event.status === 'cancelled';
  const needsConfirmation = event.requires_confirmation && !isConfirmed && !isDeadlinePassed && !isCancelled;

  return (
    <WebLayout
      title={event.title}
      breadcrumbs={[
        { label: 'Agenda', href: '/agenda' },
        { label: event.title },
      ]}
    >
      {/* Main Container - 2 Column Grid on wide screens */}
      <View
        className={`mx-auto ${isWideScreen ? 'flex-row gap-8' : ''}`}
        style={{ maxWidth: 1200 }}
      >
          {/* LEFT COLUMN - Content (2/3 width on desktop) */}
          <View className={isWideScreen ? 'flex-1' : 'w-full'} style={isWideScreen ? { flex: 2 } : {}}>
            {/* Visual Header */}
            {event.image ? (
              <View className="relative rounded-xl overflow-hidden mb-6" style={{ height: 280 }}>
                <DirectusImage
                  fileId={event.image}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                {/* Status Badge Overlay */}
                {isCancelled && (
                  <View className="absolute top-4 left-4 bg-red-600 px-3 py-1.5 rounded-lg">
                    <Text className="text-sm font-bold text-white">CANCELADO</Text>
                  </View>
                )}
              </View>
            ) : (
              /* Pattern Fallback - Subtle gradient instead of empty banner */
              <View
                className="rounded-xl mb-6 items-center justify-center"
                style={{
                  height: 180,
                  backgroundColor: COLORS.primaryLight,
                  backgroundImage: Platform.OS === 'web'
                    ? 'linear-gradient(135deg, rgba(139,21,56,0.08) 25%, transparent 25%), linear-gradient(225deg, rgba(139,21,56,0.08) 25%, transparent 25%)'
                    : undefined,
                }}
              >
                <MaterialCommunityIcons name="calendar-star" size={56} color={COLORS.primary} />
                {isCancelled && (
                  <View className="absolute top-4 left-4 bg-red-600 px-3 py-1.5 rounded-lg">
                    <Text className="text-sm font-bold text-white">CANCELADO</Text>
                  </View>
                )}
              </View>
            )}

            {/* Title */}
            <Text
              className={`text-3xl font-bold mb-4 ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}
              style={{ lineHeight: 40 }}
            >
              {event.title}
            </Text>

            {/* Metadata Grid */}
            <View className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
              <View className={`${isWideScreen ? 'flex-row flex-wrap' : ''} gap-5`}>
                {/* Date */}
                <View className={`flex-row items-start gap-3 ${isWideScreen ? 'w-1/2 pr-4' : ''}`}>
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: COLORS.primaryLight }}
                  >
                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 mb-0.5">Fecha</Text>
                    <Text className="text-base font-semibold text-gray-900 capitalize">
                      {formatDateLong(event.start_date)}
                    </Text>
                    {event.end_date && event.end_date !== event.start_date && (
                      <Text className="text-sm text-gray-500 mt-0.5 capitalize">
                        Hasta: {formatDateLong(event.end_date)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Time */}
                {!event.all_day && (
                  <View className={`flex-row items-start gap-3 ${isWideScreen ? 'w-1/2' : ''}`}>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: COLORS.primaryLight }}
                    >
                      <Ionicons name="time" size={20} color={COLORS.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500 mb-0.5">Hora</Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {formatTime(event.start_date)}
                      </Text>
                    </View>
                  </View>
                )}

                {event.all_day && (
                  <View className={`flex-row items-start gap-3 ${isWideScreen ? 'w-1/2' : ''}`}>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: COLORS.primaryLight }}
                    >
                      <Ionicons name="sunny" size={20} color={COLORS.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500 mb-0.5">Duración</Text>
                      <Text className="text-base font-semibold text-gray-900">Todo el día</Text>
                    </View>
                  </View>
                )}

                {/* Location */}
                {locationName && (
                  <View className={`flex-row items-start gap-3 ${isWideScreen ? 'w-1/2 pr-4' : ''}`}>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: COLORS.primaryLight }}
                    >
                      <Ionicons name="location" size={20} color={COLORS.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500 mb-0.5">Ubicación</Text>
                      <Pressable onPress={handleOpenMap} className="flex-row items-center gap-1.5">
                        <Text className="text-base font-semibold text-gray-900">{locationName}</Text>
                        <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Target Audience */}
                {event.target_type !== 'all' && (
                  <View className={`flex-row items-start gap-3 ${isWideScreen ? 'w-1/2' : ''}`}>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: COLORS.primaryLight }}
                    >
                      <Ionicons name="people" size={20} color={COLORS.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500 mb-0.5">Dirigido a</Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {event.target_type === 'grade' ? 'Grado específico' : 'Sección específica'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Map Preview */}
            {locationCoordinates && (
              <View className="mb-6 rounded-xl overflow-hidden">
                <MapPreview
                  latitude={locationCoordinates.latitude}
                  longitude={locationCoordinates.longitude}
                  title={locationName || ''}
                  style={{ height: 200 }}
                />
              </View>
            )}

            {/* Description */}
            {event.description && (
              <View className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Descripción</Text>
                <RenderHtml
                  contentWidth={contentWidth}
                  source={{ html: decodeHtmlEntities(event.description || '') }}
                  baseStyle={{
                    fontSize: FONT_SIZES['2xl'],
                    color: COLORS.gray700,
                    lineHeight: 26,
                  }}
                />
              </View>
            )}
          </View>

          {/* RIGHT COLUMN - Action Panel (1/3 width on desktop, sticky) */}
          <View
            className={isWideScreen ? 'sticky top-24' : 'mt-0'}
            style={isWideScreen ? { flex: 1, alignSelf: 'flex-start' } : {}}
          >
            <View className="bg-white rounded-xl border border-gray-100 p-6 shadow-lg">
              {/* Child Context */}
              {primaryChild && (
                <View className="flex-row items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Text className="text-base font-bold text-white">
                      {primaryChild.first_name?.charAt(0).toUpperCase() || 'E'}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm text-gray-500">Evento para</Text>
                    <Text className="text-base font-semibold text-gray-900">{primaryChild.first_name}</Text>
                  </View>
                </View>
              )}

              {/* Status Badge */}
              {needsConfirmation && (
                <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="warning" size={20} color="#F59E0B" />
                    <Text className="text-amber-800 font-semibold">Confirmación Pendiente</Text>
                  </View>
                  {event.confirmation_deadline && (
                    <Text className="text-amber-700 text-sm mt-1 ml-7">
                      Confirmar antes del {formatDateLong(event.confirmation_deadline)}
                    </Text>
                  )}
                </View>
              )}

              {isConfirmed && (
                <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    <Text className="text-green-800 font-semibold">Asistencia Confirmada</Text>
                  </View>
                </View>
              )}

              {isDeadlinePassed && event.requires_confirmation && !isConfirmed && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text className="text-red-800 font-semibold">Plazo de confirmación vencido</Text>
                  </View>
                </View>
              )}

              {isCancelled && (
                <View className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-5">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="ban" size={20} color="#6B7280" />
                    <Text className="text-gray-700 font-semibold">Este evento ha sido cancelado</Text>
                  </View>
                </View>
              )}

              {/* Primary Action - BLUE/DARK (NOT RED) */}
              {needsConfirmation && (
                <>
                  <Pressable
                    onPress={handleConfirm}
                    className="w-full py-4 rounded-xl items-center justify-center flex-row gap-2 mb-3 active:opacity-90"
                    style={{ backgroundColor: '#1F2937' }} // Dark gray/almost black
                  >
                    <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                    <Text className="text-white text-base font-semibold">Confirmar Asistencia</Text>
                  </Pressable>

                  {/* Secondary Action - Subtle/Outlined */}
                  <Pressable
                    onPress={handleDecline}
                    className="w-full py-3 rounded-xl items-center justify-center flex-row gap-2 border border-gray-200 active:bg-gray-50"
                  >
                    <Text className="text-gray-600 text-base">No podré asistir</Text>
                  </Pressable>
                </>
              )}

              {/* Tool Buttons */}
              {!isCancelled && (
                <View className={`${needsConfirmation ? 'mt-5 pt-5 border-t border-gray-100' : ''}`}>
                  <Pressable
                    onPress={handleAddToCalendar}
                    disabled={isAddingToCalendar}
                    className="w-full py-3 rounded-lg items-center justify-center flex-row gap-2 border border-gray-200 active:bg-gray-50 mb-2"
                    style={{ opacity: isAddingToCalendar ? 0.6 : 1 }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLORS.gray600} />
                    <Text className="text-gray-700 text-sm font-medium">
                      {isAddingToCalendar ? 'Guardando...' : 'Agregar al Calendario'}
                    </Text>
                  </Pressable>

                  {locationName && (
                    <Pressable
                      onPress={handleOpenMap}
                      className="w-full py-3 rounded-lg items-center justify-center flex-row gap-2 border border-gray-200 active:bg-gray-50"
                    >
                      <Ionicons name="map-outline" size={18} color={COLORS.gray600} />
                      <Text className="text-gray-700 text-sm font-medium">Ver en Mapa</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

      <Toast
        visible={showToast}
        message="Tu asistencia ha sido confirmada"
        type="success"
        onHide={() => setShowToast(false)}
      />
    </WebLayout>
  );
}
