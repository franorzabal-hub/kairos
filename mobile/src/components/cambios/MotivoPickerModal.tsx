import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';

export interface MotivoPickerModalProps {
  visible: boolean;
  options: string[];
  onSelect: (option: string) => void;
  onClose: () => void;
}

const MotivoPickerModal = React.memo(({
  visible,
  options,
  onSelect,
  onClose,
}: MotivoPickerModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Selecciona motivo</Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.modalOption}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.modalOptionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </Modal>
));

MotivoPickerModal.displayName = 'MotivoPickerModal';

export default MotivoPickerModal;

const styles = StyleSheet.create({
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
