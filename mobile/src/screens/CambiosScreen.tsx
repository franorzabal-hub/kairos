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
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import { useFilters } from '../context/AppContext';
import { useSession } from '../hooks';
import { usePickupRequests, useCreatePickupRequest, useUpdatePickupRequest, useChildren } from '../api/hooks';
import { PickupRequest } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, BADGE_STYLES, SHADOWS } from '../theme';

const MOTIVO_OPTIONS = [
  'Turno medico',
  'Turno odontologico',
  'Actividad extracurricular',
  'Viaje familiar',
  'Otro',
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeInput = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const buildTimeValue = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(':')) {
    return new Date();
  }
  const [hours, minutes] = timeStr.split(':').map((value) => Number(value));
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 0);
  date.setMinutes(Number.isFinite(minutes) ? minutes : 0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

export default function CambiosScreen() {
  const { user, children } = useSession();
  const { selectedChildId } = useFilters();

  // Fetch children on mount
  useChildren();

  // Fetch pickup requests history
  const { data: pickupRequests = [], isLoading, refetch, isRefetching } = usePickupRequests();
  const createPickupMutation = useCreatePickupRequest();
  const updatePickupMutation = useUpdatePickupRequest();

  // Apply child filter only (no read/unread filter for cambios)
  const filteredPickupRequests = useMemo(() => {
    if (selectedChildId) {
      return pickupRequests.filter(req => req.student_id === selectedChildId);
    }
    return pickupRequests;
  }, [pickupRequests, selectedChildId]);

  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');

  // Form state
  const [editingRequest, setEditingRequest] = useState<PickupRequest | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('Al finalizar el dia');
  const [motivo, setMotivo] = useState('');
  const [authorizedPerson, setAuthorizedPerson] = useState('');
  const [comments, setComments] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMotivoPicker, setShowMotivoPicker] = useState(false);

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
    setEditingRequest(null);
    setSelectedChildren([]);
    setSelectedDate('');
    setSelectedTime('Al finalizar el dia');
    setMotivo('');
    setAuthorizedPerson('');
    setComments('');
  };

  // Check if a pickup request can be edited (pending status + future date)
  const canEditRequest = (request: PickupRequest) => {
    if (request.status !== 'pending') return false;
    const pickupDate = new Date(request.pickup_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pickupDate >= today;
  };

  // Populate form with existing request data for editing
  const startEditing = (request: PickupRequest) => {
    setEditingRequest(request);
    setSelectedChildren([request.student_id]);
    setSelectedDate(request.pickup_date);
    setSelectedTime(request.pickup_time || 'Al finalizar el dia');
    setMotivo(request.reason || '');
    setAuthorizedPerson(request.authorized_person || '');
    setComments(request.notes || '');
    setActiveTab('nuevo');
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
      if (editingRequest) {
        await updatePickupMutation.mutateAsync({
          id: editingRequest.id,
          data: {
            pickup_date: selectedDate || editingRequest.pickup_date,
            pickup_time: selectedTime,
            authorized_person: authorizedPerson,
            reason: motivo || 'No especificado',
            notes: comments,
          },
        });
        Alert.alert('Exito', 'Solicitud actualizada correctamente');
      } else {
        for (const childId of selectedChildren) {
          await createPickupMutation.mutateAsync({
            organization_id: '',
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
        Alert.alert('Exito', 'Solicitud enviada correctamente');
      }

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
      <FilterBar showUnreadFilter={false} />

      {/* Tab Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={activeTab === 'nuevo' ? [styles.tab, styles.tabActive] : styles.tab}
          onPress={() => {
            resetForm();
            setActiveTab('nuevo');
          }}
        >
          <Text style={activeTab === 'nuevo' ? [styles.tabText, styles.tabTextActive] : styles.tabText}>
            {editingRequest ? 'Editar' : 'Nuevo'}
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

  const renderHistoryItem = ({ item }: { item: PickupRequest }) => {
    const child = children.find(c => c.id === item.student_id);
    const childName = child ? `${child.first_name} ${child.last_name}` : 'Estudiante';
    const isEditable = canEditRequest(item);

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>
            {formatDate(item.pickup_date)} - {item.pickup_time}
          </Text>
          <View style={styles.headerRight}>
            {isEditable && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEditing(item)}
              >
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <View style={item.status === 'approved' ? styles.statusBadgeApproved :
                         item.status === 'rejected' ? styles.statusBadgeRejected :
                         styles.statusBadgePending}>
              <Text style={styles.statusText}>
                {item.status === 'approved' ? 'Aprobado' :
                 item.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
              </Text>
            </View>
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {activeTab === 'nuevo' ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <ListHeader />
          <View style={styles.formBody}>
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

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Dia</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.inputText, selectedDate ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
                    {selectedDate ? formatDateLabel(selectedDate) : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Hora</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
                  <Text style={[styles.inputText, selectedTime ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
                    {selectedTime || 'Al finalizar el dia'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={selectedDate ? new Date(selectedDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_event, date) => {
                    if (Platform.OS !== 'ios') {
                      setShowDatePicker(false);
                    }
                    if (date) {
                      setSelectedDate(formatDateInput(date));
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {showTimePicker && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={buildTimeValue(selectedTime)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_event, date) => {
                    if (Platform.OS !== 'ios') {
                      setShowTimePicker(false);
                    }
                    if (date) {
                      setSelectedTime(formatTimeInput(date));
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.label}>Motivo</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowMotivoPicker(true)}>
              <Text style={[styles.inputText, motivo ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
                {motivo || 'Seleccione una opcion'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Se retira con</Text>
            <TextInput
              style={styles.input}
              value={authorizedPerson}
              onChangeText={setAuthorizedPerson}
              placeholder="Nombre de la persona autorizada"
              placeholderTextColor={COLORS.gray}
            />

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

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Enviar autorizacion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredPickupRequests}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.historyContent}
          renderItem={renderHistoryItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay solicitudes en el historial</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showMotivoPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMotivoPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowMotivoPicker(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona motivo</Text>
            {MOTIVO_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setMotivo(option);
                  setShowMotivoPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  },
  inputTextPlaceholder: {
    color: COLORS.gray,
  },
  inputTextSelected: {
    color: COLORS.darkGray,
  },
  textArea: {
    minHeight: 100,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.md,
    borderBottomWidth: 0,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pickerDoneText: {
    color: COLORS.primary,
    fontWeight: '600',
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
  historyContent: {
    paddingBottom: SPACING.tabBarOffset,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    padding: SPACING.xs,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.xl,
    borderTopRightRadius: SPACING.xl,
    padding: SPACING.xl,
  },
  modalTitle: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: SPACING.md,
  },
  modalOptionText: {
    ...TYPOGRAPHY.listItemTitle,
    textAlign: 'center',
  },
});
