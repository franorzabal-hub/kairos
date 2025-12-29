import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterBar from '../components/FilterBar';
import { useFilters, useUnreadCounts, useAppContext } from '../context/AppContext';

const COLORS = {
  primary: '#8B1538',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
};

// Mock history data
const mockHistory = [
  {
    id: '1',
    date: 'Jueves 27 de noviembre',
    time: 'Al finalizar el día',
    childName: 'Pedro Orzabal',
    reason: 'Otro',
    authorizedPerson: 'Natalia mamá de Aitor',
    status: 'approved',
  },
  {
    id: '2',
    date: 'Jueves 27 de noviembre',
    time: 'Al finalizar el día',
    childName: 'Teodelina Orzabal',
    reason: 'Otro',
    authorizedPerson: 'Luli Dragan mamá de Justina Goldstein',
    status: 'approved',
  },
];

const MOTIVO_OPTIONS = [
  'Turno médico',
  'Turno odontológico',
  'Actividad extracurricular',
  'Viaje familiar',
  'Otro',
];

export default function CambiosScreen() {
  const { children } = useAppContext();
  const { filterMode } = useFilters();
  const { unreadCounts } = useUnreadCounts();

  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');
  const [refreshing, setRefreshing] = useState(false);

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
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSubmit = () => {
    // TODO: Submit to API
    console.log({
      selectedChildren,
      selectedDate,
      selectedTime,
      motivo,
      authorizedPerson,
      comments,
    });
  };

  // Use mock children if none loaded
  const displayChildren = children.length > 0 ? children : [
    { id: '1', first_name: 'Teodelina', last_name: 'Orzabal' },
    { id: '2', first_name: 'Pedro', last_name: 'Orzabal' },
    { id: '3', first_name: 'Joaquin', last_name: 'Orzabal' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FilterBar unreadCount={unreadCounts.cambios} />

      {/* Tab Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nuevo' && styles.tabActive]}
          onPress={() => setActiveTab('nuevo')}
        >
          <Text style={[styles.tabText, activeTab === 'nuevo' && styles.tabTextActive]}>
            Nuevo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historial' && styles.tabActive]}
          onPress={() => setActiveTab('historial')}
        >
          <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'nuevo' ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          {/* Children Selection */}
          <Text style={styles.label}>Este cambio aplica a:</Text>
          {displayChildren.map((child: any) => (
            <TouchableOpacity
              key={child.id}
              style={styles.checkboxRow}
              onPress={() => toggleChild(child.id)}
            >
              <View style={[styles.checkbox, selectedChildren.includes(child.id) && styles.checkboxChecked]}>
                {selectedChildren.includes(child.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{child.first_name} {child.last_name}</Text>
            </TouchableOpacity>
          ))}

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
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.historyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {mockHistory.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <Text style={styles.historyDate}>{item.date} - {item.time}</Text>
              <Text style={styles.historyChild}>{item.childName}</Text>
              <Text style={styles.historyDetail}>Motivo: {item.reason}</Text>
              <Text style={styles.historyDetail}>Se retira con: {item.authorizedPerson}</Text>
              <TouchableOpacity>
                <Text style={styles.viewLink}>Ver</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: -2,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfField: {
    flex: 1,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  textArea: {
    minHeight: 100,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    borderBottomWidth: 0,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  historyChild: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  historyDetail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 2,
  },
  viewLink: {
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
  },
});
