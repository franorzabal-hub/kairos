import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY, SHADOWS } from '../theme';
import { getPastelColor } from '../utils';

interface Segment {
  key: string;
  label: string;
  count?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedKey: string;
  onSelect: (key: string) => void;
  accentColor?: string; // Dynamic color for badge (follows child color)
}

function SegmentedControl({ segments, selectedKey, onSelect, accentColor }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      <View style={styles.segmentWrapper}>
        {segments.map((segment, index) => {
          const isSelected = segment.key === selectedKey;
          return (
            <TouchableOpacity
              key={segment.key}
              style={[
                styles.segment,
                isSelected && styles.segmentSelected,
                index === 0 && styles.segmentFirst,
                index === segments.length - 1 && styles.segmentLast,
              ]}
              onPress={() => onSelect(segment.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                {segment.label}
              </Text>
              {segment.count !== undefined && segment.count > 0 && (
                <View style={[
                  styles.countBadge,
                  isSelected && (accentColor
                    ? { backgroundColor: getPastelColor(accentColor) }
                    : styles.countBadgeSelected
                  ),
                ]}>
                  <Text style={[
                    styles.countText,
                    isSelected && (accentColor
                      ? { color: accentColor }
                      : styles.countTextSelected
                    ),
                  ]}>
                    {segment.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.xxs,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  segmentFirst: {
    borderTopLeftRadius: BORDERS.radius.md - SPACING.xxs,
    borderBottomLeftRadius: BORDERS.radius.md - SPACING.xxs,
  },
  segmentLast: {
    borderTopRightRadius: BORDERS.radius.md - SPACING.xxs,
    borderBottomRightRadius: BORDERS.radius.md - SPACING.xxs,
  },
  segmentSelected: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.md - SPACING.xxs,
    ...SHADOWS.small,
  },
  segmentText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.gray,
  },
  segmentTextSelected: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.sm - SPACING.xxs,
    paddingVertical: 1,
    borderRadius: BORDERS.radius.full,
    minWidth: SPACING.xl,
    alignItems: 'center',
  },
  countBadgeSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  countTextSelected: {
    color: COLORS.primary,
  },
});

// Memoize to prevent unnecessary re-renders when parent state changes
export default React.memo(SegmentedControl);
