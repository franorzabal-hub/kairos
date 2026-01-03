import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DirectusImage from './DirectusImage';
import { Student } from '../api/frappe';
import { useChildren } from '../context/ChildrenContext';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS, SIZES, FONT_SIZES } from '../theme';
import { getPastelColor, getChildColor } from '../utils';

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
  const childrenCtx = useChildren();
  const children = childrenProp ?? childrenCtx.children;
  const selectedChildId = selectedChildIdProp ?? childrenCtx.selectedChildId;
  const onSelectChild = onSelectChildProp ?? childrenCtx.setSelectedChildId;
  const onSelectAll = onSelectAllProp ?? (() => childrenCtx.setSelectedChildId(null));

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
              { backgroundColor: !selectedChildId ? COLORS.primaryLight : COLORS.lightGray },
            ]}
            onPress={onSelectAll}
          >
            <View style={[
              styles.avatarSmall,
              { backgroundColor: !selectedChildId ? COLORS.primary : COLORS.border },
            ]}>
              <Ionicons
                name="people"
                size={20}
                color={!selectedChildId ? COLORS.white : COLORS.gray}
              />
            </View>
            <Text style={[
              styles.chipText,
              { color: !selectedChildId ? COLORS.primary : COLORS.darkGray },
              !selectedChildId && styles.chipTextSelectedWeight,
            ]}>
              Todos
            </Text>
          </TouchableOpacity>
        )}
        {children.map((child, index) => {
          const isSelected = selectedChildId === child.id;
          const childColor = getChildColor(index);
          const chipBgColor = isSelected ? getPastelColor(childColor) : COLORS.lightGray;
          const avatarBgColor = isSelected ? childColor : COLORS.border;
          const textColor = isSelected ? childColor : COLORS.darkGray;

          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                { backgroundColor: chipBgColor },
              ]}
              onPress={() => onSelectChild(child.id)}
            >
              <DirectusImage
                fileId={child.photo}
                style={[styles.avatarSmall, { backgroundColor: avatarBgColor }]}
                resizeMode="cover"
                fallback={
                  <View style={[styles.avatarSmall, { backgroundColor: avatarBgColor }]}>
                    <Text style={[styles.avatarInitialsSmall, isSelected && styles.avatarInitialsSmallSelected]}>
                      {child.first_name.charAt(0)}
                    </Text>
                  </View>
                }
              />
              <Text style={[
                styles.chipText,
                { color: textColor },
                isSelected && styles.chipTextSelectedWeight,
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
  avatarSmall: {
    width: SIZES.avatarSm,
    height: SIZES.avatarSm,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  chipTextSelectedWeight: {
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
    width: SIZES.avatarXl,
    height: SIZES.avatarXl,
    borderRadius: BORDERS.radius.full,
  },
  avatarPlaceholder: {
    width: SIZES.avatarXl,
    height: SIZES.avatarXl,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: FONT_SIZES['5xl'],
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
    marginTop: SPACING.xxs,
  },
  // Compact mode styles
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.md,
    gap: SPACING.xs,
  },
  compactText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

// Memoize to prevent unnecessary re-renders when parent state changes
export default React.memo(ChildSelector);
