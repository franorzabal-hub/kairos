import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface Segment {
  key: string;
  label: string;
  count?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export default function SegmentedControl({ segments, selectedKey, onSelect }: SegmentedControlProps) {
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
                <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
                  <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
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
    padding: 2,
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
    borderTopLeftRadius: BORDERS.radius.md - 2,
    borderBottomLeftRadius: BORDERS.radius.md - 2,
  },
  segmentLast: {
    borderTopRightRadius: BORDERS.radius.md - 2,
    borderBottomRightRadius: BORDERS.radius.md - 2,
  },
  segmentSelected: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.md - 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDERS.radius.full,
    minWidth: 20,
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
