import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Calendar from 'expo-calendar';
import ScreenHeader from '../components/ScreenHeader';
import MapPreview from '../components/MapPreview';
import RenderHtml from 'react-native-render-html';
import DirectusImage from '../components/DirectusImage';
import Toast from '../components/Toast';
import { useEvent } from '../api/hooks';
import { Location } from '../api/frappe';
import { useContentReadStatus } from '../api/hooks';
import { COLORS, SPACING, BORDERS, FONT_SIZES, SIZES } from '../theme';
import { stripHtml } from '../utils';

// Screen-specific color variants derived from theme
const SCREEN_COLORS = {
  successLight: '#E8F5E9', // Light green for confirmed state
  errorLight: '#FFEBEE',   // Light red for expired deadline
};

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

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  // Mark as read when viewing
  useEffect(() => {
    if (event) {
      markAsRead(event.id);
    }
  }, [event?.id, markAsRead]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?q=${encoded}`
      : `https://maps.google.com/?q=${encoded}`;
    await Linking.openURL(url);
  };

  const handleAddToCalendar = async () => {
    if (!event || isAddingToCalendar) return;
    try {
      setIsAddingToCalendar(true);
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos permiso para guardar el evento en tu calendario.');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const targetCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];

      if (!targetCalendar) {
        Alert.alert('Calendario', 'No se encontro un calendario disponible.');
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

      Alert.alert('Listo', 'Evento guardado en tu calendario.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el evento en tu calendario.');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const handleConfirm = () => {
    // Confirmar asistencia no es una acción destructiva,
    // no necesita confirmación previa - solo feedback inmediato
    setIsConfirmed(true);
    setShowToast(true);
    // TODO: Aquí iría la llamada a la API para registrar la confirmación
  };

  const isDeadlinePassed = event?.confirmation_deadline
    ? new Date(event.confirmation_deadline) < new Date()
    : false;

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader showBackButton backTitle="Evento" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No se encontró el evento</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader showBackButton backTitle={event.title} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Event Image */}
        <View style={styles.imageContainer}>
          <DirectusImage
            fileId={event.image}
            style={styles.eventImage}
            resizeMode="cover"
            fallback={
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="calendar-star" size={64} color={COLORS.primary} />
              </View>
            }
          />

          {/* Confirmation Required Badge */}
          {event.requires_confirmation && !isConfirmed && (
            <View style={styles.confirmBadge}>
              <Text style={styles.badgeText}>REQUIERE CONFIRMACIÓN</Text>
            </View>
          )}

          {isConfirmed && (
            <View style={[styles.confirmBadge, styles.confirmedBadge]}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
              <Text style={styles.badgeText}> CONFIRMADO</Text>
            </View>
          )}

          {event.status === 'cancelled' && (
            <View style={[styles.confirmBadge, styles.cancelledBadge]}>
              <Text style={styles.badgeText}>CANCELADO</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{formatDate(event.start_date)}</Text>
                {event.end_date && event.end_date !== event.start_date && (
                  <Text style={styles.infoSubvalue}>
                    Hasta: {formatDate(event.end_date)}
                  </Text>
                )}
              </View>
            </View>

            {!event.all_day && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Hora</Text>
                  <Text style={styles.infoValue}>{formatTime(event.start_date)}</Text>
                </View>
              </View>
            )}

            {event.all_day && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="sunny" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Duración</Text>
                  <Text style={styles.infoValue}>Todo el día</Text>
                </View>
              </View>
            )}

          {event.target_type !== 'all' && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Dirigido a</Text>
                  <Text style={styles.infoValue}>
                    {event.target_type === 'grade' ? 'Grado específico' : 'Sección específica'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {locationName ? (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Ubicacion</Text>
                  <Text style={styles.infoValue}>{locationName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.mapLink}
                  onPress={handleOpenMap}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir ubicacion en mapas"
                >
                  <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {locationCoordinates ? (
                <MapPreview
                  latitude={locationCoordinates.latitude}
                  longitude={locationCoordinates.longitude}
                  title={locationName}
                  style={styles.mapPreview}
                />
              ) : null}
            </View>
          ) : null}

          {event.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.calendarButton, isAddingToCalendar && styles.calendarButtonDisabled]}
              onPress={handleAddToCalendar}
              disabled={isAddingToCalendar}
              accessibilityRole="button"
              accessibilityLabel="Guardar en calendario"
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
              <Text style={styles.calendarButtonText}>
                {isAddingToCalendar ? 'Guardando...' : 'Guardar en calendario'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Confirmation Deadline */}
          {event.requires_confirmation && event.confirmation_deadline && (
            <View style={[styles.deadlineCard, isDeadlinePassed && styles.deadlineExpired]}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={isDeadlinePassed ? COLORS.error : COLORS.primary}
              />
              <Text style={[styles.deadlineText, isDeadlinePassed && styles.deadlineExpiredText]}>
                {isDeadlinePassed
                  ? 'Plazo de confirmación vencido'
                  : `Confirmar antes del ${formatDate(event.confirmation_deadline)}`}
              </Text>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <RenderHtml
                contentWidth={width - 40}
                source={{ html: decodeHtmlEntities(event.description || '') }}
                baseStyle={styles.description}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Confirm Button */}
      {event.requires_confirmation && !isConfirmed && !isDeadlinePassed && event.status !== 'cancelled' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
            <Text style={styles.confirmButtonText}>Confirmar Asistencia</Text>
          </TouchableOpacity>
        </View>
      )}

      {isConfirmed && (
        <View style={styles.bottomBar}>
          <View style={styles.confirmedBar}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            <Text style={styles.confirmedText}>Asistencia Confirmada</Text>
          </View>
        </View>
      )}

      <Toast
        visible={showToast}
        message="Tu asistencia ha sido confirmada"
        type="success"
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  imageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBadge: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - SPACING.xxs,
    borderRadius: BORDERS.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmedBadge: {
    backgroundColor: COLORS.success,
  },
  cancelledBadge: {
    backgroundColor: COLORS.error,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES['6xl'],
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: SPACING.xl,
    lineHeight: FONT_SIZES['8xl'],
  },
  infoCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  locationCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapLink: {
    padding: SPACING.sm - SPACING.xxs,
  },
  mapPreview: {
    marginTop: SPACING.md,
    height: 160,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  infoIconContainer: {
    width: SIZES.avatarMd,
    height: SIZES.avatarMd,
    borderRadius: SIZES.avatarMd / 2,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.xxs,
  },
  infoValue: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  infoSubvalue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray,
    marginTop: SPACING.xxs,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  deadlineExpired: {
    backgroundColor: SCREEN_COLORS.errorLight,
  },
  deadlineText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },
  deadlineExpiredText: {
    color: COLORS.error,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.listItemPadding,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  calendarButtonDisabled: {
    opacity: 0.7,
  },
  calendarButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.darkGray,
    lineHeight: FONT_SIZES['6xl'] + SPACING.xxs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: BORDERS.width.thin,
    borderTopColor: COLORS.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  confirmedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SCREEN_COLORS.successLight,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
  },
  confirmedText: {
    color: COLORS.success,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
  },
});
