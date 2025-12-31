import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../../theme';

export interface ContactChannel {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export interface ChannelSelectorModalProps {
  visible: boolean;
  channels: ContactChannel[];
  onSelectChannel: (channel: ContactChannel) => void;
  onClose: () => void;
}

const ChannelSelectorModal = React.memo(({
  visible,
  channels,
  onSelectChannel,
  onClose,
}: ChannelSelectorModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
        {/* Handle bar */}
        <View style={styles.modalHandle} />

        {/* Title */}
        <Text style={styles.modalTitle}>Nuevo mensaje</Text>
        <Text style={styles.modalSubtitle}>
          Selecciona el area con la que deseas comunicarte
        </Text>

        {/* Channel options */}
        <View style={styles.channelList}>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              style={styles.channelItem}
              onPress={() => onSelectChannel(channel)}
              activeOpacity={0.7}
            >
              <View style={[styles.channelIcon, { backgroundColor: `${channel.color}15` }]}>
                <Ionicons name={channel.icon} size={24} color={channel.color} />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.channelDescription}>{channel.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
));

ChannelSelectorModal.displayName = 'ChannelSelectorModal';

export default ChannelSelectorModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDERS.radius.xl,
    borderTopRightRadius: BORDERS.radius.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.screenPadding,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  channelList: {
    gap: SPACING.sm,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  channelDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  cancelButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
