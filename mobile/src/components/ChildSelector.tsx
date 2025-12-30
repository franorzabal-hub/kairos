import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DirectusImage from './DirectusImage';
import { Student } from '../api/directus';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';

interface ChildSelectorProps {
  children: Student[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
  showAllOption?: boolean;
  onSelectAll?: () => void;
}

export default function ChildSelector({
  children,
  selectedChildId,
  onSelectChild,
  showAllOption = false,
  onSelectAll,
}: ChildSelectorProps) {
  if (children.length === 0) {
    return null;
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
      <Text style={styles.label}>Seleccionar hijo/a</Text>
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
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.screenPadding,
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
});
