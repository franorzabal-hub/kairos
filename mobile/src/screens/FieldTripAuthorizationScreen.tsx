/**
 * FieldTripAuthorizationScreen
 *
 * Parent view for authorizing field trips. Shows trip details,
 * emergency contact form, medical info form, and authorization controls.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RenderHtml from 'react-native-render-html';
import ScreenHeader from '../components/ScreenHeader';
import FrappeImage from '../components/FrappeImage';
import Toast from '../components/Toast';
import {
  useFieldTripStudent,
  useAuthorizeFieldTrip,
} from '../api/hooks';
import { COLORS, SPACING, BORDERS, FONT_SIZES, SIZES } from '../theme';

const SCREEN_COLORS = {
  successLight: '#E8F5E9',
  errorLight: '#FFEBEE',
  warningLight: '#FFF8E1',
};

export default function FieldTripAuthorizationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const recordId = typeof id === 'string' ? id : '';
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { data: record, isLoading } = useFieldTripStudent(recordId);
  const authorizeTrip = useAuthorizeFieldTrip();

  // Form state
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [notes, setNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const trip = record?.field_trip_details;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const isDeadlinePassed = trip?.authorization_deadline
    ? new Date(trip.authorization_deadline) < new Date()
    : false;

  const handleAuthorize = async () => {
    if (!record) return;

    // Validate required fields if trip requires them
    if (trip?.requires_emergency_contact) {
      if (!emergencyName.trim() || !emergencyPhone.trim()) {
        Alert.alert(
          'Campos requeridos',
          'Por favor complete la información de contacto de emergencia.'
        );
        return;
      }
    }

    Alert.alert(
      'Confirmar Autorización',
      `¿Está seguro que desea autorizar la salida "${trip?.trip_name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Autorizar',
          onPress: async () => {
            try {
              await authorizeTrip.mutateAsync({
                fieldTripStudentId: record.name,
                authorize: true,
                emergencyContactName: emergencyName || undefined,
                emergencyContactPhone: emergencyPhone || undefined,
                emergencyContactRelationship: emergencyRelationship || undefined,
                medicalConditions: medicalConditions || undefined,
                allergies: allergies || undefined,
                medications: medications || undefined,
                specialNeeds: specialNeeds || undefined,
                notes: notes || undefined,
              });
              setToastMessage('Salida autorizada exitosamente');
              setToastType('success');
              setShowToast(true);
              setTimeout(() => router.back(), 1500);
            } catch (error) {
              setToastMessage('Error al autorizar la salida');
              setToastType('error');
              setShowToast(true);
            }
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    if (!record) return;

    Alert.alert(
      'Rechazar Autorización',
      `¿Está seguro que NO desea autorizar la salida "${trip?.trip_name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'No Autorizar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authorizeTrip.mutateAsync({
                fieldTripStudentId: record.name,
                authorize: false,
                notes: notes || undefined,
              });
              setToastMessage('Autorización rechazada');
              setToastType('success');
              setShowToast(true);
              setTimeout(() => router.back(), 1500);
            } catch (error) {
              setToastMessage('Error al rechazar la autorización');
              setToastType('error');
              setShowToast(true);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader showBackButton backTitle="Salida" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record || !trip) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader showBackButton backTitle="Salida" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No se encontró la salida</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAuthorized = record.authorization_status === 'Authorized';
  const isDeclined = record.authorization_status === 'Declined';
  const isPending = record.authorization_status === 'Pending';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader showBackButton backTitle={trip.trip_name} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Trip Image */}
          <View style={styles.imageContainer}>
            <FrappeImage
              fileId={trip.image}
              style={styles.eventImage}
              resizeMode="cover"
              fallback={
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="bus-school" size={64} color={COLORS.primary} />
                </View>
              }
            />

            {/* Status Badge */}
            {isPending && !isDeadlinePassed && (
              <View style={styles.pendingBadge}>
                <Text style={styles.badgeText}>REQUIERE AUTORIZACIÓN</Text>
              </View>
            )}

            {isAuthorized && (
              <View style={[styles.pendingBadge, styles.authorizedBadge]}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                <Text style={styles.badgeText}> AUTORIZADO</Text>
              </View>
            )}

            {isDeclined && (
              <View style={[styles.pendingBadge, styles.declinedBadge]}>
                <Ionicons name="close-circle" size={14} color={COLORS.white} />
                <Text style={styles.badgeText}> NO AUTORIZADO</Text>
              </View>
            )}

            {trip.status === 'Cancelled' && (
              <View style={[styles.pendingBadge, styles.cancelledBadge]}>
                <Text style={styles.badgeText}>CANCELADO</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{trip.trip_name}</Text>
            <Text style={styles.tripType}>{trip.trip_type}</Text>

            {/* Date & Time Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Fecha de Salida</Text>
                  <Text style={styles.infoValue}>{formatDate(trip.departure_date)}</Text>
                  {trip.departure_time && (
                    <Text style={styles.infoSubvalue}>
                      Hora: {formatTime(trip.departure_time)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="return-up-back" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Fecha de Regreso</Text>
                  <Text style={styles.infoValue}>{formatDate(trip.return_date)}</Text>
                  {trip.return_time && (
                    <Text style={styles.infoSubvalue}>
                      Hora: {formatTime(trip.return_time)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Destino</Text>
                  <Text style={styles.infoValue}>{trip.destination}</Text>
                  {trip.destination_address && (
                    <Text style={styles.infoSubvalue}>{trip.destination_address}</Text>
                  )}
                </View>
              </View>

              {trip.meeting_point && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="flag" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Punto de Encuentro</Text>
                    <Text style={styles.infoValue}>{trip.meeting_point}</Text>
                    {trip.meeting_time && (
                      <Text style={styles.infoSubvalue}>
                        Hora: {formatTime(trip.meeting_time)}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {trip.transportation_type && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="bus" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Transporte</Text>
                    <Text style={styles.infoValue}>{trip.transportation_type}</Text>
                    {trip.transportation_details && (
                      <Text style={styles.infoSubvalue}>{trip.transportation_details}</Text>
                    )}
                  </View>
                </View>
              )}

              {trip.cost_per_student && trip.cost_per_student > 0 && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="cash" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Costo</Text>
                    <Text style={styles.infoValue}>${trip.cost_per_student}</Text>
                    {trip.payment_deadline && (
                      <Text style={styles.infoSubvalue}>
                        Pagar antes del {formatDate(trip.payment_deadline)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Authorization Deadline */}
            {trip.authorization_deadline && (
              <View style={[styles.deadlineCard, isDeadlinePassed && styles.deadlineExpired]}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={isDeadlinePassed ? COLORS.error : COLORS.primary}
                />
                <Text style={[styles.deadlineText, isDeadlinePassed && styles.deadlineExpiredText]}>
                  {isDeadlinePassed
                    ? 'Plazo de autorización vencido'
                    : `Autorizar antes del ${formatDate(trip.authorization_deadline)}`}
                </Text>
              </View>
            )}

            {/* Description */}
            {trip.description && (
              <>
                <Text style={styles.sectionTitle}>Descripción</Text>
                <RenderHtml
                  contentWidth={width - 40}
                  source={{ html: trip.description }}
                  baseStyle={styles.description}
                />
              </>
            )}

            {/* What to Bring */}
            {trip.what_to_bring && (
              <>
                <Text style={styles.sectionTitle}>Qué Llevar</Text>
                <RenderHtml
                  contentWidth={width - 40}
                  source={{ html: trip.what_to_bring }}
                  baseStyle={styles.description}
                />
              </>
            )}

            {/* What to Wear */}
            {trip.what_to_wear && (
              <>
                <Text style={styles.sectionTitle}>Vestimenta</Text>
                <RenderHtml
                  contentWidth={width - 40}
                  source={{ html: trip.what_to_wear }}
                  baseStyle={styles.description}
                />
              </>
            )}

            {/* Food Arrangements */}
            {trip.food_arrangements && (
              <>
                <Text style={styles.sectionTitle}>Alimentación</Text>
                <RenderHtml
                  contentWidth={width - 40}
                  source={{ html: trip.food_arrangements }}
                  baseStyle={styles.description}
                />
              </>
            )}

            {/* Insurance Info */}
            {trip.insurance_included && trip.insurance_details && (
              <View style={styles.insuranceCard}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <View style={styles.insuranceText}>
                  <Text style={styles.insuranceTitle}>Seguro Incluido</Text>
                  <Text style={styles.insuranceDetails}>{trip.insurance_details}</Text>
                </View>
              </View>
            )}

            {/* Emergency Contact Form */}
            {isPending && trip.requires_emergency_contact && (
              <>
                <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
                <View style={styles.formCard}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nombre *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={emergencyName}
                      onChangeText={setEmergencyName}
                      placeholder="Nombre completo"
                      placeholderTextColor={COLORS.gray}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Teléfono *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={emergencyPhone}
                      onChangeText={setEmergencyPhone}
                      placeholder="Número de teléfono"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Parentesco</Text>
                    <TextInput
                      style={styles.textInput}
                      value={emergencyRelationship}
                      onChangeText={setEmergencyRelationship}
                      placeholder="Ej: Madre, Padre, Tío"
                      placeholderTextColor={COLORS.gray}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Medical Info Form */}
            {isPending && trip.requires_medical_info && (
              <>
                <Text style={styles.sectionTitle}>Información Médica</Text>
                <View style={styles.formCard}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Condiciones Médicas</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={medicalConditions}
                      onChangeText={setMedicalConditions}
                      placeholder="Asma, diabetes, etc."
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Alergias</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={allergies}
                      onChangeText={setAllergies}
                      placeholder="Alergias alimentarias, medicamentosas, etc."
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Medicamentos</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={medications}
                      onChangeText={setMedications}
                      placeholder="Medicamentos que toma actualmente"
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Necesidades Especiales</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={specialNeeds}
                      onChangeText={setSpecialNeeds}
                      placeholder="Cualquier necesidad especial a considerar"
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Notes */}
            {isPending && (
              <>
                <Text style={styles.sectionTitle}>Notas Adicionales</Text>
                <View style={styles.formCard}>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Cualquier información adicional..."
                    placeholderTextColor={COLORS.gray}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {/* Spacer for bottom bar */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      {isPending && !isDeadlinePassed && trip.status !== 'Cancelled' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            disabled={authorizeTrip.isPending}
          >
            <Ionicons name="close-circle-outline" size={22} color={COLORS.error} />
            <Text style={styles.declineButtonText}>No Autorizar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authorizeButton, authorizeTrip.isPending && styles.buttonDisabled]}
            onPress={handleAuthorize}
            disabled={authorizeTrip.isPending}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
            <Text style={styles.authorizeButtonText}>
              {authorizeTrip.isPending ? 'Autorizando...' : 'Autorizar'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isAuthorized && (
        <View style={styles.bottomBar}>
          <View style={styles.authorizedBar}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            <Text style={styles.authorizedText}>Salida Autorizada</Text>
          </View>
        </View>
      )}

      {isDeclined && (
        <View style={styles.bottomBar}>
          <View style={styles.declinedBar}>
            <Ionicons name="close-circle" size={22} color={COLORS.error} />
            <Text style={styles.declinedText}>Autorización Rechazada</Text>
          </View>
        </View>
      )}

      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
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
  keyboardView: {
    flex: 1,
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
  pendingBadge: {
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
  authorizedBadge: {
    backgroundColor: COLORS.success,
  },
  declinedBadge: {
    backgroundColor: COLORS.error,
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
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES['8xl'],
  },
  tripType: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xl,
  },
  infoCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
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
  sectionTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.darkGray,
    lineHeight: FONT_SIZES['6xl'] + SPACING.xxs,
  },
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SCREEN_COLORS.successLight,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  insuranceText: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.success,
  },
  insuranceDetails: {
    fontSize: FONT_SIZES.md,
    color: COLORS.darkGray,
    marginTop: SPACING.xxs,
  },
  formCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.md,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.darkGray,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: BORDERS.width.thin,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  authorizeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  authorizeButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.error,
    gap: SPACING.sm,
  },
  declineButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  authorizedBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SCREEN_COLORS.successLight,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
  },
  authorizedText: {
    color: COLORS.success,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  declinedBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SCREEN_COLORS.errorLight,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
  },
  declinedText: {
    color: COLORS.error,
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
