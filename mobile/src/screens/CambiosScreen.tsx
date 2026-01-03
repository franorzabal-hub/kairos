import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import ScreenHeader from '../components/ScreenHeader';
import FilterBar from '../components/FilterBar';
import {
  PickupRequestForm,
  HistoryCard,
  MotivoPickerModal,
} from '../components/cambios';
import { useFilters } from '../context/AppContext';
import { useSession } from '../hooks';
import { usePickupRequests, useCreatePickupRequest, useUpdatePickupRequest, useChildren } from '../api/hooks';
import { PickupRequest } from '../api/frappe';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SIZES } from '../theme';

const MOTIVO_OPTIONS = [
  'Turno medico',
  'Turno odontologico',
  'Actividad extracurricular',
  'Viaje familiar',
  'Otro',
];

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
      return pickupRequests.filter(req => req.student === selectedChildId);
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

  const toggleChild = useCallback((childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  }, []);

  const onRefresh = async () => {
    await refetch();
  };

  const resetForm = useCallback(() => {
    setEditingRequest(null);
    setSelectedChildren([]);
    setSelectedDate('');
    setSelectedTime('Al finalizar el dia');
    setMotivo('');
    setAuthorizedPerson('');
    setComments('');
  }, []);

  // Check if a pickup request can be edited (pending status + future date)
  const canEditRequest = useCallback((request: PickupRequest) => {
    if (request.status !== 'pending') return false;
    const pickupDate = new Date(request.pickup_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pickupDate >= today;
  }, []);

  // Populate form with existing request data for editing
  const startEditing = useCallback((request: PickupRequest) => {
    setEditingRequest(request);
    setSelectedChildren([request.student]);
    setSelectedDate(request.pickup_date);
    setSelectedTime(request.pickup_time || 'Al finalizar el dia');
    setMotivo(request.reason || '');
    setAuthorizedPerson(request.authorized_person || '');
    setComments(request.notes || '');
    setActiveTab('nuevo');
  }, []);

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
            institution: '',
            student: childId,
            requested_by: user.id,
            request_type: 'Different Person',
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo enviar la solicitud';
      Alert.alert('Error', errorMessage);
    }
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

  // Memoized keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: PickupRequest) => item.id, []);

  // Memoized renderItem using extracted HistoryCard component
  const renderHistoryItem = useCallback(({ item }: { item: PickupRequest }) => (
    <HistoryCard
      request={item}
      children={children}
      canEdit={canEditRequest(item)}
      onEdit={startEditing}
    />
  ), [children, canEditRequest, startEditing]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {activeTab === 'nuevo' ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <ListHeader />
          <PickupRequestForm
            children={children}
            selectedChildren={selectedChildren}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            motivo={motivo}
            authorizedPerson={authorizedPerson}
            comments={comments}
            showDatePicker={showDatePicker}
            showTimePicker={showTimePicker}
            isEditing={!!editingRequest}
            onToggleChild={toggleChild}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onMotivoPress={() => setShowMotivoPicker(true)}
            onAuthorizedPersonChange={setAuthorizedPerson}
            onCommentsChange={setComments}
            onShowDatePicker={setShowDatePicker}
            onShowTimePicker={setShowTimePicker}
            onSubmit={handleSubmit}
          />
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ListHeader />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlashList
          data={filteredPickupRequests}
          keyExtractor={keyExtractor}
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

      <MotivoPickerModal
        visible={showMotivoPicker}
        options={MOTIVO_OPTIONS}
        onSelect={(option) => {
          setMotivo(option);
          setShowMotivoPicker(false);
        }}
        onClose={() => setShowMotivoPicker(false)}
      />
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
    paddingBottom: SPACING.tabBarOffset + SPACING.xl,
  },
  historyContent: {
    paddingBottom: SPACING.tabBarOffset,
    paddingHorizontal: SPACING.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl + SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.gray,
  },
});
