import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';

interface Child {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface PickupRequestFormProps {
  children: Child[];
  selectedChildren: string[];
  selectedDate: string;
  selectedTime: string;
  motivo: string;
  authorizedPerson: string;
  comments: string;
  showDatePicker: boolean;
  showTimePicker: boolean;
  isEditing: boolean;
  onToggleChild: (childId: string) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onMotivoPress: () => void;
  onAuthorizedPersonChange: (text: string) => void;
  onCommentsChange: (text: string) => void;
  onShowDatePicker: (show: boolean) => void;
  onShowTimePicker: (show: boolean) => void;
  onSubmit: () => void;
}

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

const PickupRequestForm = React.memo(({
  children,
  selectedChildren,
  selectedDate,
  selectedTime,
  motivo,
  authorizedPerson,
  comments,
  showDatePicker,
  showTimePicker,
  isEditing,
  onToggleChild,
  onDateChange,
  onTimeChange,
  onMotivoPress,
  onAuthorizedPersonChange,
  onCommentsChange,
  onShowDatePicker,
  onShowTimePicker,
  onSubmit,
}: PickupRequestFormProps) => (
  <View style={styles.formBody}>
    <Text style={styles.label}>Este cambio aplica a:</Text>
    {children.length === 0 ? (
      <Text style={styles.noChildrenText}>No hay hijos registrados</Text>
    ) : (
      children.map((child) => (
        <TouchableOpacity
          key={child.id}
          style={styles.checkboxRow}
          onPress={() => onToggleChild(child.id)}
          disabled={isEditing}
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
        <TouchableOpacity style={styles.input} onPress={() => onShowDatePicker(true)}>
          <Text style={[styles.inputText, selectedDate ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
            {selectedDate ? formatDateLabel(selectedDate) : 'Seleccionar fecha'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.halfField}>
        <Text style={styles.label}>Hora</Text>
        <TouchableOpacity style={styles.input} onPress={() => onShowTimePicker(true)}>
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
              onShowDatePicker(false);
            }
            if (date) {
              onDateChange(formatDateInput(date));
            }
          }}
        />
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.pickerDone} onPress={() => onShowDatePicker(false)}>
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
              onShowTimePicker(false);
            }
            if (date) {
              onTimeChange(formatTimeInput(date));
            }
          }}
        />
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.pickerDone} onPress={() => onShowTimePicker(false)}>
            <Text style={styles.pickerDoneText}>Listo</Text>
          </TouchableOpacity>
        )}
      </View>
    )}

    <Text style={styles.label}>Motivo</Text>
    <TouchableOpacity style={styles.input} onPress={onMotivoPress}>
      <Text style={[styles.inputText, motivo ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
        {motivo || 'Seleccione una opcion'}
      </Text>
    </TouchableOpacity>

    <Text style={styles.label}>Se retira con</Text>
    <TextInput
      style={styles.input}
      value={authorizedPerson}
      onChangeText={onAuthorizedPersonChange}
      placeholder="Nombre de la persona autorizada"
      placeholderTextColor={COLORS.gray}
    />

    <Text style={styles.label}>Comentarios</Text>
    <TextInput
      style={[styles.input, styles.textArea]}
      value={comments}
      onChangeText={onCommentsChange}
      placeholder="Ingrese un comentario"
      placeholderTextColor={COLORS.gray}
      multiline
      numberOfLines={4}
    />

    <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
      <Text style={styles.submitButtonText}>
        {isEditing ? 'Actualizar autorizacion' : 'Enviar autorizacion'}
      </Text>
    </TouchableOpacity>
  </View>
));

PickupRequestForm.displayName = 'PickupRequestForm';

export default PickupRequestForm;

const styles = StyleSheet.create({
  formBody: {
    paddingHorizontal: SPACING.screenPadding,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  noChildrenText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    paddingVertical: SPACING.md,
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
});
