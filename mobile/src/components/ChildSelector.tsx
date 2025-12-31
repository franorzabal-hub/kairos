import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DirectusImage from './DirectusImage';
import { Student } from '../api/directus';
import { useFilters } from '../context/AppContext';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';

interface ChildSelectorProps {
  children?: Student[];
  selectedChildId?: string | null;
  onSelectChild?: (childId: string) => void;
  showAllOption?: boolean;
  onSelectAll?: () => void;
  compact?: boolean; // Inline chip style for header use
}

function ChildSelector({
  children: childrenProp,
  selectedChildId: selectedChildIdProp,
  onSelectChild: onSelectChildProp,
  showAllOption = false,
  onSelectAll: onSelectAllProp,
  compact = false,
}: ChildSelectorProps) {
  // Use props if provided, otherwise use context
  const filters = useFilters();
  const children = childrenProp ?? filters.children;
  const selectedChildId = selectedChildIdProp ?? filters.selectedChildId;
  const onSelectChild = onSelectChildProp ?? filters.setSelectedChildId;
  const onSelectAll = onSelectAllProp ?? (() => filters.setSelectedChildId(null));

  if (!children || children.length === 0) {
    return null;
  }

  // Compact mode: dropdown-style chip showing selected child
  if (compact) {
    const selectedChild = selectedChildId
      ? children.find(c => c.id === selectedChildId)
      : null;
    const displayName = selectedChild ? selectedChild.first_name : 'Todos';

    // For compact mode with single child, just show the name
    if (children.length === 1) {
      return (
        <View style={styles.compactChip}>
          <Text style={styles.compactText}>{children[0].first_name}</Text>
        </View>
      );
    }

    // TODO: Could expand this to a dropdown/actionsheet
    return (
      <TouchableOpacity
        style={styles.compactChip}
        onPress={() => {
          // Cycle through children + "Todos" option
          if (!selectedChildId) {
            onSelectChild(children[0].id);
          } else {
            const currentIndex = children.findIndex(c => c.id === selectedChildId);
            if (currentIndex < children.length - 1) {
              onSelectChild(children[currentIndex + 1].id);
            } else {
              onSelectAll?.();
            }
          }
        }}
      >
        <Text style={styles.compactText}>{displayName}</Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
      </TouchableOpacity>
    );
  }

  // Single child - show info card instead of selector
  if (children.length === 1 && !showAllOption) {
    const child = children[0];
    return (
      <View style={styles.singleChildContainer}>
        <View style={styles.singleChildCard}>
          <DirectusImage
            fileId={child.photo}
            style={styles.singleChildAvatar}
            resizeMode="cover"
            fallback={
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                </Text>
              </View>
            }
          />
          <View style={styles.singleChildInfo}>
            <Text style={styles.singleChildName}>
              {child.first_name} {child.last_name}
            </Text>
            <Text style={styles.singleChildMeta}>
              Estudiante activo
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showAllOption && (
          <TouchableOpacity
            style={[
              styles.childChip,
              !selectedChildId && styles.childChipSelected,
            ]}
            onPress={onSelectAll}
          >
            <View style={[styles.avatarSmall, !selectedChildId && styles.avatarSmallSelected]}>
              <Ionicons
                name="people"
                size={20}
                color={!selectedChildId ? COLORS.white : COLORS.gray}
              />
            </View>
            <Text style={[
              styles.chipText,
              !selectedChildId && styles.chipTextSelected,
            ]}>
              Todos
            </Text>
          </TouchableOpacity>
        )}
        {children.map((child) => {
          const isSelected = selectedChildId === child.id;
          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                isSelected && styles.childChipSelected,
              ]}
              onPress={() => onSelectChild(child.id)}
            >
              <DirectusImage
                fileId={child.photo}
                style={[styles.avatarSmall, isSelected && styles.avatarSmallSelected]}
                resizeMode="cover"
                fallback={
                  <View style={[styles.avatarSmall, isSelected && styles.avatarSmallSelected]}>
                    <Text style={[styles.avatarInitialsSmall, isSelected && styles.avatarInitialsSmallSelected]}>
                      {child.first_name.charAt(0)}
                    </Text>
                  </View>
                }
              />
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}>
                {child.first_name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sm,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingRight: SPACING.md,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.full,
    gap: SPACING.sm,
  },
  childChipSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallSelected: {
    backgroundColor: COLORS.primary,
  },
  avatarInitialsSmall: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  avatarInitialsSmallSelected: {
    color: COLORS.white,
  },
  chipText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Single child display
  singleChildContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  singleChildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  singleChildAvatar: {
    width: 56,
    height: 56,
    borderRadius: BORDERS.radius.full,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  singleChildInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  singleChildName: {
    ...TYPOGRAPHY.listItemTitle,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  singleChildMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Compact mode styles
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.md,
    gap: 4,
  },
  compactText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

// Memoize to prevent unnecessary re-renders when parent state changes
export default React.memo(ChildSelector);
