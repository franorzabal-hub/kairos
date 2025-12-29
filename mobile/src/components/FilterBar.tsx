import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useFilters } from '../context/AppContext';

const COLORS = {
  primary: '#8B1538',
  primaryLight: '#F5E6EA',
  white: '#FFFFFF',
  gray: '#666666',
  lightGray: '#F5F5F5',
  border: '#E0E0E0',
};

interface FilterBarProps {
  unreadCount?: number;
}

export default function FilterBar({ unreadCount = 0 }: FilterBarProps) {
  const { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children } = useFilters();
  const [showChildPicker, setShowChildPicker] = useState(false);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const childLabel = selectedChild
    ? `${selectedChild.first_name}`
    : 'Todos mis hijos';

  return (
    <View style={styles.container}>
      {/* Filter Mode Buttons */}
      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            filterMode === 'unread' && styles.modeButtonActive,
          ]}
          onPress={() => setFilterMode('unread')}
        >
          <Text
            style={[
              styles.modeButtonText,
              filterMode === 'unread' && styles.modeButtonTextActive,
            ]}
          >
            No Leído
            {unreadCount > 0 && (
              <Text style={styles.badge}> ({unreadCount})</Text>
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            filterMode === 'all' && styles.modeButtonActive,
          ]}
          onPress={() => setFilterMode('all')}
        >
          <Text
            style={[
              styles.modeButtonText,
              filterMode === 'all' && styles.modeButtonTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Child Selector */}
      <TouchableOpacity
        style={styles.childSelector}
        onPress={() => setShowChildPicker(true)}
      >
        <Text style={styles.childSelectorText} numberOfLines={1}>
          {childLabel}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {/* Child Picker Modal */}
      <Modal
        visible={showChildPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChildPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowChildPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Qué hijo querés ver?</Text>

            <TouchableOpacity
              style={[
                styles.childOption,
                selectedChildId === null && styles.childOptionSelected,
              ]}
              onPress={() => {
                setSelectedChildId(null);
                setShowChildPicker(false);
              }}
            >
              <View style={styles.childAvatar}>
                <Text style={styles.avatarIcon}>👨‍👩‍👧‍👦</Text>
              </View>
              <Text style={styles.childName}>Todos mis hijos</Text>
            </TouchableOpacity>

            <FlatList
              data={children}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.childOption,
                    selectedChildId === item.id && styles.childOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedChildId(item.id);
                    setShowChildPicker(false);
                  }}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.avatarInitial}>
                      {item.first_name[0]}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.childName}>
                      {item.first_name} {item.last_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modeButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.lightGray,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  modeButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  badge: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  childSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    maxWidth: 150,
  },
  childSelectorText: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 4,
  },
  chevron: {
    fontSize: 10,
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  childOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 20,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
  },
});
