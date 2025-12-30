import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts, useAppContext } from '../context/AppContext';
import { usePickupRequests, useCreatePickupRequest, useChildren } from '../api/hooks';
import { PickupRequest } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, BADGE_STYLES, SHADOWS } from '../theme';

const MOTIVO_OPTIONS = [
  'Turno médico',
  'Turno odontológico',
  'Actividad extracurricular',
  'Viaje familiar',
  'Otro',
];

export default function CambiosScreen() {
  const { children, user } = useAppContext();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();

  // Fetch children on mount
  useChildren();

  // Fetch pickup requests history
  const { data: pickupRequests = [], isLoading, refetch, isRefetching } = usePickupRequests();
  const createPickupMutation = useCreatePickupRequest();

  // Apply filters - treat "pending" status as unread
  const filteredPickupRequests = useMemo(() => {
    if (filterMode === 'unread') {
      return pickupRequests.filter(req => req.status === 'pending');
    }
    return pickupRequests;
  }, [pickupRequests, filterMode]);

  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');

  // Form state
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('Al finalizar el día');
  const [motivo, setMotivo] = useState('');
  const [authorizedPerson, setAuthorizedPerson] = useState('');
  const [comments, setComments] = useState('');

  const toggleChild = (childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const onRefresh = async () => {
    await refetch();
  };

  const resetForm = () => {
    setSelectedChildren([]);
    setSelectedDate('');
    setSelectedTime('Al finalizar el día');
    setMotivo('');
    setAuthorizedPerson('');
    setComments('');
  };

  const handleSubmit = async () => {
    if (!user?.id || selectedChildren.length === 0) {
      Alert.alert('Error', 'Seleccione al menos un hijo');
      return;
    }

    if (!authorizedPerson.trim()) {
      Alert.alert('Error', 'Ingrese el nombre de la persona autorizada');
      return;
    }

    try {
      // Create a pickup request for each selected child
      for (const childId of selectedChildren) {
        await createPickupMutation.mutateAsync({
          organization_id: '', // Will be set by backend/RLS
          student_id: childId,
          requested_by: user.id,
          request_type: 'different_person' as const,
          pickup_date: selectedDate || new Date().toISOString().split('T')[0],
          pickup_time: selectedTime,
          authorized_person: authorizedPerson,
          reason: motivo || 'No especificado',
          notes: comments,
        });
      }

      Alert.alert('Éxito', 'Solicitud enviada correctamente');
      resetForm();
      setActiveTab('historial');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader title="Cambios" />
      <FilterBar unreadCount={unreadCounts.cambios} />

      {/* Tab Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={activeTab === 'nuevo' ? [styles.tab, styles.tabActive] : styles.tab}
          onPress={() => setActiveTab('nuevo')}
        >
          <Text style={activeTab === 'nuevo' ? [styles.tabText, styles.tabTextActive] : styles.tabText}>
            Nuevo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'historial' ? [styles.tab, styles.tabActive] : styles.tab}
          onPress={() => setActiveTab('historial')}
        >
          <Text style={activeTab === 'historial' ? [styles.tabText, styles.tabTextActive] : styles.tabText}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {activeTab === 'nuevo' ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <ListHeader />
          <View style={styles.formBody}>
          {/* Children Selection */}
          <Text style={styles.label}>Este cambio aplica a:</Text>
          {children.length === 0 ? (
            <Text style={styles.noChildrenText}>No hay hijos registrados</Text>
          ) : (
            children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={styles.checkboxRow}
                onPress={() => toggleChild(child.id)}
              >
                <View style={selectedChildren.includes(child.id) ? [styles.checkbox, styles.checkboxChecked] : styles.checkbox}>
                  {selectedChildren.includes(child.id) && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{child.first_name} {child.last_name}</Text>
              </TouchableOpacity>
            ))
          )}

          {/* Date & Time */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Día</Text>
              <TouchableOpacity style={styles.input}>
                <Text style={styles.inputText}>{selectedDate || '30 Dec 2025'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Hora</Text>
              <TouchableOpacity style={styles.input}>
                <Text style={styles.inputText}>{selectedTime} ▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Motivo */}
          <Text style={styles.label}>Motivo</Text>
          <TouchableOpacity style={styles.input}>
            <Text style={styles.inputText}>{motivo || 'Seleccione una opción'} ▼</Text>
          </TouchableOpacity>

          {/* Authorized Person */}
          <Text style={styles.label}>Se retira con</Text>
          <TextInput
            style={styles.input}
            value={authorizedPerson}
            onChangeText={setAuthorizedPerson}
            placeholder="Nombre de la persona autorizada"
            placeholderTextColor={COLORS.gray}
          />

          {/* Comments */}
          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comments}
            onChangeText={setComments}
            placeholder="Ingrese un comentario"
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={4}
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Enviar autorización</Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      ) : isLoading ? (
        <ScrollView contentContainerStyle={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.historyContainer}
          contentContainerStyle={styles.historyContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
        >
          <ListHeader />
          <View style={styles.historyBody}>
          {filteredPickupRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay solicitudes en el historial</Text>
            </View>
          ) : (
            filteredPickupRequests.map((item: PickupRequest) => {
              const child = children.find(c => c.id === item.student_id);
              const childName = child ? `${child.first_name} ${child.last_name}` : 'Estudiante';

              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {formatDate(item.pickup_date)} - {item.pickup_time}
                    </Text>
                    <View style={item.status === 'approved' ? styles.statusBadgeApproved :
                                 item.status === 'rejected' ? styles.statusBadgeRejected :
                                 styles.statusBadgePending}>
                      <Text style={styles.statusText}>
                        {item.status === 'approved' ? 'Aprobado' :
                         item.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyChild}>{childName}</Text>
                  <Text style={styles.historyDetail}>Motivo: {item.reason}</Text>
                  <Text style={styles.historyDetail}>Se retira con: {item.authorized_person}</Text>
                  {item.notes ? (
                    <Text style={styles.historyDetail}>Notas: {item.notes}</Text>
                  ) : null}
                </View>
              );
            })
          )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  listHeader: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: BORDERS.width.medium,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.listItemPadding,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: BORDERS.width.medium,
    borderBottomColor: COLORS.primary,
    marginBottom: -BORDERS.width.medium,
  },
  tabText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  formContent: {
    paddingBottom: SPACING.tabBarOffset + 20,
  },
  formBody: {
    paddingHorizontal: SPACING.screenPadding,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: BORDERS.width.medium,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radius.sm,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    ...TYPOGRAPHY.listItemTitle,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  halfField: {
    flex: 1,
  },
  input: {
    borderBottomWidth: BORDERS.width.thin,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  inputText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
  textArea: {
    minHeight: 100,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.md,
    borderBottomWidth: 0,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDERS.radius.full,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  submitButtonText: {
    color: COLORS.white,
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
  },
  historyContainer: {
    flex: 1,
  },
  historyContent: {
    paddingBottom: SPACING.tabBarOffset,
  },
  historyBody: {
    paddingHorizontal: SPACING.screenPadding,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  historyDate: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  historyChild: {
    ...TYPOGRAPHY.listItemTitle,
    marginBottom: SPACING.sm,
  },
  historyDetail: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: 2,
  },
  viewLink: {
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
  noChildrenText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    paddingVertical: SPACING.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusBadgeApproved: {
    ...BADGE_STYLES.statusApproved,
  },
  statusBadgeRejected: {
    ...BADGE_STYLES.statusRejected,
  },
  statusBadgePending: {
    ...BADGE_STYLES.statusPending,
  },
  statusText: {
    color: COLORS.white,
    ...TYPOGRAPHY.badge,
  },
});
