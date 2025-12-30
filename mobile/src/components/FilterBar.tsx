import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFilters } from '../context/AppContext';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

export type ReadFilter = 'all' | 'unread' | 'read';

interface FilterBarProps {
  unreadCount?: number;
  // New filter props
  readFilter?: ReadFilter;
  onReadFilterChange?: (filter: ReadFilter) => void;
  showArchived?: boolean;
  onShowArchivedChange?: (show: boolean) => void;
  showPinnedOnly?: boolean;
  onShowPinnedOnlyChange?: (show: boolean) => void;
  // Feature flags for which filters to show
  showArchivedFilter?: boolean;
  showPinnedFilter?: boolean;
  showReadFilter?: boolean;
}

export default function FilterBar({
  unreadCount = 0,
  readFilter,
  onReadFilterChange,
  showArchived = false,
  onShowArchivedChange,
  showPinnedOnly = false,
  onShowPinnedOnlyChange,
  showArchivedFilter = true,
  showPinnedFilter = true,
  showReadFilter = true,
}: FilterBarProps) {
  const { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children } = useFilters();
  const [showChildPicker, setShowChildPicker] = useState(false);

  // Use provided readFilter or fall back to context filterMode
  const currentReadFilter = readFilter ?? (filterMode === 'unread' ? 'unread' : 'all');

  const handleReadFilterChange = (filter: ReadFilter) => {
    if (onReadFilterChange) {
      onReadFilterChange(filter);
    } else {
      // Fall back to context if no handler provided
      setFilterMode(filter === 'unread' ? 'unread' : 'all');
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);
  const childLabel = selectedChild
    ? `${selectedChild.first_name}`
    : 'Todos';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showReadFilter && (
          <>
            {/* Unread Filter Pill */}
            <TouchableOpacity
              style={[
                styles.pill,
                currentReadFilter === 'unread' && styles.pillActive,
              ]}
              onPress={() => handleReadFilterChange('unread')}
            >
              <Text
                style={[
                  styles.pillText,
                  currentReadFilter === 'unread' && styles.pillTextActive,
                ]}
              >
                No Leído{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>

            {/* Read Filter Pill */}
            <TouchableOpacity
              style={[
                styles.pill,
                currentReadFilter === 'read' && styles.pillActive,
              ]}
              onPress={() => handleReadFilterChange('read')}
            >
              <Text
                style={[
                  styles.pillText,
                  currentReadFilter === 'read' && styles.pillTextActive,
                ]}
              >
                Leído
              </Text>
            </TouchableOpacity>

            {/* All Filter Pill */}
            <TouchableOpacity
              style={[
                styles.pill,
                currentReadFilter === 'all' && styles.pillActive,
              ]}
              onPress={() => handleReadFilterChange('all')}
            >
              <Text
                style={[
                  styles.pillText,
                  currentReadFilter === 'all' && styles.pillTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Divider */}
        {(showArchivedFilter || showPinnedFilter) && showReadFilter && (
          <View style={styles.divider} />
        )}

        {/* Archived Filter */}
        {showArchivedFilter && onShowArchivedChange && (
          <TouchableOpacity
            style={[
              styles.pill,
              showArchived && styles.pillActiveSecondary,
            ]}
            onPress={() => onShowArchivedChange(!showArchived)}
          >
            <Ionicons
              name={showArchived ? 'archive' : 'archive-outline'}
              size={14}
              color={showArchived ? COLORS.warning : COLORS.gray}
              style={styles.pillIcon}
            />
            <Text
              style={[
                styles.pillText,
                showArchived && styles.pillTextActiveSecondary,
              ]}
            >
              Archivados
            </Text>
          </TouchableOpacity>
        )}

        {/* Pinned Filter */}
        {showPinnedFilter && onShowPinnedOnlyChange && (
          <TouchableOpacity
            style={[
              styles.pill,
              showPinnedOnly && styles.pillActiveSecondary,
            ]}
            onPress={() => onShowPinnedOnlyChange(!showPinnedOnly)}
          >
            <Ionicons
              name={showPinnedOnly ? 'pin' : 'pin-outline'}
              size={14}
              color={showPinnedOnly ? COLORS.primary : COLORS.gray}
              style={styles.pillIcon}
            />
            <Text
              style={[
                styles.pillText,
                showPinnedOnly && styles.pillTextActiveSecondary,
              ]}
            >
              Fijados
            </Text>
          </TouchableOpacity>
        )}

        {/* Divider before child selector */}
        {children.length > 0 && (
          <View style={styles.divider} />
        )}

        {/* Child Selector Pill */}
        {children.length > 0 && (
          <TouchableOpacity
            style={[
              styles.pill,
              selectedChildId && styles.pillActive,
            ]}
            onPress={() => setShowChildPicker(true)}
          >
            <Ionicons
              name="person-outline"
              size={14}
              color={selectedChildId ? COLORS.white : COLORS.gray}
              style={styles.pillIcon}
            />
            <Text
              style={[
                styles.pillText,
                selectedChildId && styles.pillTextActive,
              ]}
            >
              {childLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={selectedChildId ? COLORS.white : COLORS.gray}
              style={styles.pillChevron}
            />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Child Picker Modal */}
      <Modal
        visible={showChildPicker}
        transparent={true}
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
              style={selectedChildId === null ? [styles.childOption, styles.childOptionSelected] : styles.childOption}
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
                  style={selectedChildId === item.id ? [styles.childOption, styles.childOptionSelected] : styles.childOption}
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
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.listItemPadding,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
    backgroundColor: COLORS.pillBackground,
  },
  pillActive: {
    backgroundColor: COLORS.pillActive,
  },
  pillActiveSecondary: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  pillTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  pillTextActiveSecondary: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  pillIcon: {
    marginRight: SPACING.xs,
  },
  pillChevron: {
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: SPACING.xl,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.xl,
    borderTopRightRadius: SPACING.xl,
    padding: SPACING.xl,
    maxHeight: '60%',
  },
  modalTitle: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.screenPadding,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.sm,
  },
  childOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarIcon: {
    fontSize: SPACING.xl,
  },
  avatarInitial: {
    color: COLORS.white,
    ...TYPOGRAPHY.cardTitle,
  },
  childName: {
    ...TYPOGRAPHY.listItemTitle,
  },
});
