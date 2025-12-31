import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useUI, FilterMode } from '../context/UIContext';
import { useChildren } from '../context/ChildrenContext';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface FilterOption {
  mode: FilterMode;
  label: string;
  count?: number;
  icon?: string;
}

interface FilterBarProps {
  unreadCount?: number;
  showUnreadFilter?: boolean;
  // Additional filters for Novedades (pinned, archived)
  pinnedCount?: number;
  archivedCount?: number;
  showPinnedFilter?: boolean;
  showArchivedFilter?: boolean;
}

function FilterBar({
  unreadCount = 0,
  showUnreadFilter = true,
  pinnedCount = 0,
  archivedCount = 0,
  showPinnedFilter = false,
  showArchivedFilter = false,
}: FilterBarProps) {
  const { filterMode, setFilterMode } = useUI();
  const { children, selectedChildId, setSelectedChildId } = useChildren();
  const [showChildPicker, setShowChildPicker] = useState(false);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const childLabel = selectedChild
    ? `${selectedChild.first_name}`
    : 'Todos';

  // Helper to render a filter pill
  const renderFilterPill = (mode: FilterMode, label: string, count?: number, icon?: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      key={mode}
      style={[
        styles.pill,
        filterMode === mode && styles.pillActive,
      ]}
      onPress={() => setFilterMode(mode)}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={filterMode === mode ? COLORS.white : COLORS.gray}
          style={styles.pillIcon}
        />
      )}
      <Text
        style={[
          styles.pillText,
          filterMode === mode && styles.pillTextActive,
        ]}
      >
        {label}{count !== undefined && count > 0 ? ` (${count})` : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showUnreadFilter && (
          <>
            {/* Unread Filter Pill */}
            {renderFilterPill('unread', 'No Leído', unreadCount)}

            {/* All Filter Pill */}
            {renderFilterPill('all', 'Todos')}

            {/* Pinned Filter Pill (if enabled) */}
            {showPinnedFilter && renderFilterPill('pinned', 'Fijados', pinnedCount, 'pin-outline')}

            {/* Archived Filter Pill (if enabled) */}
            {showArchivedFilter && renderFilterPill('archived', 'Archivados', archivedCount, 'archive-outline')}

            {/* Divider */}
            <View style={styles.divider} />
          </>
        )}

        {/* Child Selector Pill */}
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

            <FlashList
              data={children}
              keyExtractor={(item) => item.id}
              estimatedItemSize={60}
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
  pillText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  pillTextActive: {
    color: COLORS.white,
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

// Memoize to prevent unnecessary re-renders when parent state changes
export default React.memo(FilterBar);
